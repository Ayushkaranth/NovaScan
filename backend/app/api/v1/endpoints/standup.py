from fastapi import APIRouter, HTTPException, Depends, Body, Request, UploadFile, File
from fastapi.responses import RedirectResponse
from typing import List, Optional, Literal
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from pydantic import BaseModel
from urllib.parse import quote, urlencode, urlparse
from jose import jwt, JWTError
import httpx
import logging
from io import BytesIO
from pypdf import PdfReader
from app.core.database import get_database
from app.models.user import User
from app.api.v1.endpoints.auth import get_current_user
from app.services.intelligence.standup_agent import analyze_standup
from app.services.integration.calendar_service import calendar_service
from bson import ObjectId
from app.core.config import settings
from app.services.integration import google_calendar

router = APIRouter()
logger = logging.getLogger(__name__)


def _google_state_encode(user_id: str, org_id: str, team_id: str, redirect_uri: str, frontend_origin: str, include_drive: bool) -> str:
    return jwt.encode({"sub": str(user_id), "org_id": str(org_id), "team_id": team_id, "redirect_uri": redirect_uri, "frontend_origin": frontend_origin, "include_drive": include_drive, "exp": datetime.utcnow() + timedelta(minutes=15)}, settings.SECRET_KEY, algorithm="HS256")


async def _google_state_decode(state: str):
    try:
        claims = jwt.decode(state, settings.SECRET_KEY, algorithms=["HS256"])
    except JWTError as exc:
        raise HTTPException(status_code=400, detail="Google Calendar authorization expired. Start the connection again.") from exc
    if not claims.get("sub") or not claims.get("org_id") or not claims.get("team_id") or not claims.get("redirect_uri") or not claims.get("frontend_origin"):
        raise HTTPException(status_code=400, detail="Invalid Google Calendar authorization state")
    redirect_uri = claims["redirect_uri"]
    allowed_redirects = {settings.google_calendar_redirect}
    parsed_redirect = urlparse(redirect_uri)
    if parsed_redirect.scheme == "http" and parsed_redirect.hostname in ("localhost", "127.0.0.1", "::1") and parsed_redirect.path == "/api/v1/standup/google/callback" and not parsed_redirect.query and not parsed_redirect.fragment:
        allowed_redirects.add(redirect_uri)
    if redirect_uri not in allowed_redirects:
        raise HTTPException(status_code=400, detail="Google Calendar callback URI is not allowed")
    frontend_origin = claims["frontend_origin"].rstrip("/")
    parsed_frontend = urlparse(frontend_origin)
    if frontend_origin != settings.FRONTEND_URL.rstrip("/") and not (parsed_frontend.scheme == "http" and parsed_frontend.hostname in ("localhost", "127.0.0.1") and parsed_frontend.port == 3000 and not parsed_frontend.path and not parsed_frontend.query and not parsed_frontend.fragment):
        raise HTTPException(status_code=400, detail="Google Calendar return URL is not allowed")
    return claims


async def _find_team_for_standup(db, org_id: str, team_id: str):
    query = {"_id": team_id, "organization_id": org_id}
    if ObjectId.is_valid(team_id):
        query = {"_id": {"$in": [team_id, ObjectId(team_id)]}, "organization_id": {"$in": [org_id, ObjectId(org_id)] if ObjectId.is_valid(org_id) else [org_id]}}
    return await db["teams"].find_one(query)


def _team_read_allowed(team: dict, user: User) -> bool:
    return user.role in ("admin", "hr") or str(team.get("manager_id")) == str(user.id) or str(user.id) in {str(value) for value in team.get("member_ids", [])}


def _team_manage_allowed(team: dict, user: User) -> bool:
    return user.role in ("admin", "hr") or (user.role == "manager" and str(team.get("manager_id")) == str(user.id))


@router.get("/google/status")
async def google_calendar_status(current_user: User = Depends(get_current_user)):
    connection = await google_calendar.get_connection(current_user.current_org_id or "", current_user.id)
    scopes = str((connection or {}).get("scope") or "")
    return {
        "configured": google_calendar.google_calendar_configured(),
        "connected": bool(connection),
        "email": connection.get("email") if connection else None,
        "drive_enabled": google_calendar.GOOGLE_DRIVE_FILE_SCOPE in scopes.split(),
        "drive_picker_configured": bool(settings.GOOGLE_DRIVE_API_KEY and settings.GOOGLE_CLOUD_PROJECT_NUMBER),
    }


@router.get("/google/authorize")
async def google_calendar_authorize(team_id: str, request: Request, drive: bool = False, current_user: User = Depends(get_current_user)):
    if not current_user.current_org_id:
        raise HTTPException(status_code=400, detail="Join an organization before connecting Google Calendar")
    if not google_calendar.google_calendar_configured():
        raise HTTPException(status_code=503, detail="Google Calendar OAuth is not configured on the server")
    db = get_database()
    team = await _find_team_for_standup(db, current_user.current_org_id, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    if not _team_manage_allowed(team, current_user):
        raise HTTPException(status_code=403, detail="Connect the calendar account for a team you manage")
    request_host = (request.url.hostname or "").lower()
    if request_host in ("localhost", "127.0.0.1", "::1"):
        port = request.url.port or 8000
        # Use one canonical local hostname even when the frontend calls the API
        # through 127.0.0.1. Google requires the URI to match exactly, and the
        # browser can reach the local server through localhost either way.
        redirect_uri = f"http://localhost:{port}/api/v1/standup/google/callback"
    else:
        redirect_uri = settings.google_calendar_redirect
    request_origin = request.headers.get("origin", "").rstrip("/")
    parsed_origin = urlparse(request_origin)
    if request_origin == settings.FRONTEND_URL.rstrip("/") or (parsed_origin.scheme == "http" and parsed_origin.hostname in ("localhost", "127.0.0.1") and parsed_origin.port == 3000 and not parsed_origin.path and not parsed_origin.query and not parsed_origin.fragment):
        frontend_origin = request_origin
    else:
        frontend_origin = settings.FRONTEND_URL.rstrip("/")
    state = _google_state_encode(current_user.id, current_user.current_org_id, team_id, redirect_uri, frontend_origin, drive)
    return {"url": google_calendar.google_authorization_url(state, redirect_uri, include_drive=drive), "redirect_uri": redirect_uri}


@router.get("/google/drive/picker-config")
async def google_drive_picker_config(current_user: User = Depends(get_current_user)):
    connection = await google_calendar.get_connection(current_user.current_org_id or "", current_user.id)
    scopes = str((connection or {}).get("scope") or "")
    if not connection or google_calendar.GOOGLE_DRIVE_FILE_SCOPE not in scopes.split():
        raise HTTPException(status_code=409, detail="Enable Google Drive transcript access first")
    if not settings.GOOGLE_DRIVE_API_KEY or not settings.GOOGLE_CLOUD_PROJECT_NUMBER:
        raise HTTPException(status_code=503, detail="Google Drive Picker is not configured on the server")
    token = await google_calendar.access_token(current_user.current_org_id or "", current_user.id)
    return {
        "access_token": token,
        "api_key": settings.GOOGLE_DRIVE_API_KEY,
        "app_id": settings.GOOGLE_CLOUD_PROJECT_NUMBER,
    }


class DriveTranscriptRequest(BaseModel):
    file_id: str


@router.post("/teams/{team_id}/drive-transcript")
async def analyze_drive_team_transcript(team_id: str, payload: DriveTranscriptRequest, current_user: User = Depends(get_current_user)):
    db = get_database()
    team = await _team_for_user(db, team_id, current_user)
    if not _team_manage_allowed(team, current_user):
        raise HTTPException(status_code=403, detail="Only admins, HR, or this team's manager can import a transcript")
    connection = await google_calendar.get_connection(current_user.current_org_id or "", current_user.id)
    scopes = str((connection or {}).get("scope") or "")
    if not connection or google_calendar.GOOGLE_DRIVE_FILE_SCOPE not in scopes.split():
        raise HTTPException(status_code=409, detail="Enable Google Drive transcript access first")
    file_id = payload.file_id.strip()
    if not file_id or len(file_id) > 256:
        raise HTTPException(status_code=422, detail="Choose a valid Google Docs transcript")

    token = await google_calendar.access_token(current_user.current_org_id or "", current_user.id)
    headers = {"Authorization": f"Bearer {token}"}
    encoded_file_id = quote(file_id, safe="")
    async with httpx.AsyncClient(timeout=30.0) as client:
        metadata_response = await client.get(
            f"https://www.googleapis.com/drive/v3/files/{encoded_file_id}",
            params={"fields": "id,name,mimeType"}, headers=headers,
        )
        if metadata_response.status_code in (403, 404):
            raise HTTPException(status_code=403, detail="NovaScan cannot access that file. Select a transcript in the Google Drive picker and try again.")
        if metadata_response.status_code != 200:
            raise HTTPException(status_code=502, detail="Google Drive could not read the selected document")
        metadata = metadata_response.json()
        if metadata.get("mimeType") != "application/vnd.google-apps.document":
            raise HTTPException(status_code=415, detail="Choose a Google Docs transcript")
        export_response = await client.get(
            f"https://www.googleapis.com/drive/v3/files/{encoded_file_id}/export",
            params={"mimeType": "text/plain"}, headers=headers,
        )
    if export_response.status_code != 200:
        raise HTTPException(status_code=502, detail="Google Drive could not export this transcript as text")
    transcript = export_response.text
    if not transcript.strip():
        raise HTTPException(status_code=422, detail="The selected Google Doc contains no transcript text")
    if len(transcript) > 100_000:
        raise HTTPException(status_code=413, detail="Transcript text is too long (maximum 100,000 characters)")

    members = await _team_ai_members(db, team)
    result = await analyze_standup(transcript, members, team.get("name", "Team"))
    if result.get("error"):
        raise HTTPException(status_code=503, detail=result["error"])
    result["source"] = "google_drive"
    result["source_file_id"] = file_id
    result["source_name"] = metadata.get("name") or "Google Drive transcript"
    return result


@router.get("/google/callback")
async def google_calendar_callback(code: Optional[str] = None, state: Optional[str] = None, error: Optional[str] = None):
    frontend = settings.FRONTEND_URL.rstrip("/") + "/dashboard/standup"
    if error or not code or not state:
        return RedirectResponse(frontend + "?" + urlencode({"google": "error", "message": error or "Authorization was cancelled"}))
    try:
        claims = await _google_state_decode(state)
        frontend = claims["frontend_origin"].rstrip("/") + "/dashboard/standup"
        db = get_database()
        user = await db["users"].find_one({"_id": {"$in": [claims["sub"], ObjectId(claims["sub"])]} if ObjectId.is_valid(claims["sub"]) else claims["sub"]})
        if not user or str(user.get("current_org_id")) != str(claims["org_id"]):
            raise HTTPException(status_code=403, detail="Google Calendar account no longer belongs to this organization")
        team = await _find_team_for_standup(db, claims["org_id"], claims["team_id"])
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
        callback_user = User(**{**user, "_id": str(user.get("_id"))})
        if not _team_manage_allowed(team, callback_user):
            raise HTTPException(status_code=403, detail="You no longer have permission to connect this team's calendar")
        token_data = await google_calendar.exchange_code(code, claims["redirect_uri"])
        google_email = await google_calendar.google_account_email(token_data.get("access_token", ""))
        await google_calendar.save_connection(claims["org_id"], claims["sub"], token_data)
        await db["google_calendar_connections"].update_one(
            {"org_id": claims["org_id"], "user_id": claims["sub"]},
            {"$set": {"email": google_email, "app_user_email": user.get("email"), "full_name": user.get("full_name") or user.get("name")}},
        )
        return RedirectResponse(frontend + "?" + urlencode({"google": "drive_connected" if claims.get("include_drive") else "connected", "team_id": claims["team_id"]}))
    except HTTPException as exc:
        logger.warning("Google Calendar OAuth callback rejected: %s", exc.detail)
        return RedirectResponse(frontend + "?" + urlencode({"google": "error", "message": exc.detail}))
    except (ValueError, httpx.HTTPError) as exc:
        logger.warning("Google Calendar OAuth callback failed: %s", exc)
        return RedirectResponse(frontend + "?google=error&message=Google+Calendar+connection+failed")


@router.delete("/google/connection")
async def disconnect_google_calendar(current_user: User = Depends(get_current_user)):
    await google_calendar.disconnect(current_user.current_org_id, current_user.id)
    return {"status": "success"}

# --- Models ---

class AnalysisRequest(BaseModel):
    transcript: str

class TaskItem(BaseModel):
    title: str
    description: Optional[str] = ""
    assignee_id: Optional[str] = None
    assignee_name: Optional[str] = "Unknown"

class EventItem(BaseModel):
    title: str
    date: Optional[str] = None # YYYY-MM-DD
    time: Optional[str] = None # HH:MM
    description: Optional[str] = ""

class BlockerItem(BaseModel):
    user_id: Optional[str] = None
    user_name: str
    issue: str

class ExecuteRequest(BaseModel):
    tasks: List[TaskItem]
    events: List[EventItem]
    blockers: List[BlockerItem]
    summary: str
    source: Literal["manual_transcript", "google_drive"] = "manual_transcript"
    source_file_id: Optional[str] = None
    source_name: Optional[str] = None


async def _team_for_user(db, team_id: str, user: User):
    team = await _find_team_for_standup(db, user.current_org_id, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    if not _team_read_allowed(team, user):
        raise HTTPException(status_code=403, detail="You are not a member of this team")
    return team


async def _team_ai_members(db, team: dict):
    ids = list(dict.fromkeys([str(team.get("manager_id")), *(str(value) for value in team.get("member_ids", []))]))
    raw_ids = []
    for user_id in ids:
        raw_ids.extend([user_id, ObjectId(user_id)] if ObjectId.is_valid(user_id) else [user_id])
    users = await db["users"].find({"_id": {"$in": raw_ids}}).to_list(length=1000)
    class SimpleUser:
        def __init__(self, user):
            self.id = str(user.get("_id"))
            self.full_name = user.get("full_name") or user.get("name") or "Team member"
            self.email = user.get("email") or ""
    return [SimpleUser(user) for user in users]


async def _store_standup(db, *, team_id: str, org_id: str, created_by: str, analysis: dict, transcript_id: Optional[str] = None, source: str = "manual_transcript", source_file_id: Optional[str] = None, source_name: Optional[str] = None):
    now = datetime.utcnow()
    record = {
        "organization_id": str(org_id), "team_id": str(team_id), "date": now,
        "summary": analysis.get("summary", ""), "tasks": analysis.get("tasks", []),
        "blockers": analysis.get("blockers", []), "created_by": str(created_by),
        "source": "google_meet" if transcript_id else source,
        "source_file_id": source_file_id,
        "source_name": source_name,
        "google_transcript_id": transcript_id, "created_at": now,
    }
    result = await db["standups"].insert_one(record)
    record_id = str(result.inserted_id)
    task_docs = []
    for task in analysis.get("tasks", []):
        assignee_id = str(task.get("assignee_id") or "")
        task_docs.append({
            "organization_id": str(org_id), "team_id": str(team_id), "standup_id": record_id,
            "title": str(task.get("title") or "Follow-up")[:250],
            "description": str(task.get("description") or ""),
            "assignee_id": assignee_id or None,
            "assignee_name": task.get("assignee_name") or "Unassigned",
            "status": "open", "created_at": now, "updated_at": now,
        })
    if task_docs:
        await db["standup_tasks"].insert_many(task_docs)
    record["id"] = record_id
    record.pop("_id", None)
    return record

# --- Helper: RBAC ---

async def verify_standup_access(project_id: str, user: User, db):
    query = {"_id": {"$in": [project_id, ObjectId(project_id)]} if ObjectId.is_valid(project_id) else project_id}
    project = await db["projects"].find_one(query)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if str(project.get("organization_id") or project.get("org_id")) != str(user.current_org_id):
        raise HTTPException(status_code=404, detail="Project not found")
    is_member = str(user.id) in {str(v) for v in project.get("employee_ids", [])}
    is_manager = str(user.id) == str(project.get("manager_id"))
    if user.role not in ("admin", "hr") and not is_member and not is_manager:
        raise HTTPException(status_code=403, detail="You are not a member of this project")
    return project

# --- Endpoints ---

@router.post("/{project_id}/analyze")
async def analyze_standup_transcript(
    project_id: str,
    payload: AnalysisRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Analyzes the transcript and returns structured data.
    """
    db = get_database()
    project = await verify_standup_access(project_id, current_user, db)
    if current_user.role not in ("admin", "hr") and str(project.get("manager_id")) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Only admins, HR, or this project's manager can submit transcripts")
    
    # Fetch Project & Members
    # Fetch Project & Members
    member_ids = project.get("employee_ids", []) + [project.get("manager_id")]
    
    # Provide a default list if member_ids is messed up, but try to fetch
    members_cursor = db["users"].find({"_id": {"$in": member_ids}})
    members = await members_cursor.to_list(length=100)
    
    # Convert to User objects (pydantic) for the service
    # Note: We might need to handle the _id alias if using standard PyMongo dicts
    # quick hack: map dicts to User objects or just pass a simplified list to the agent
    class SimpleUser:
        def __init__(self, id, full_name, email):
            self.id = str(id)
            self.full_name = full_name
            self.email = email
            
    simple_members = [SimpleUser(m["_id"], m.get("full_name"), m.get("email")) for m in members]

    result = await analyze_standup(payload.transcript, simple_members, project.get("name"))
    return result

@router.post("/{project_id}/execute")
async def execute_standup_automations(
    project_id: str,
    payload: ExecuteRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Executes the automations: Calendar events, Jira tickets (TODO), Slack msg (TODO).
    Saves the summary.
    """
    db = get_database()
    project = await verify_standup_access(project_id, current_user, db)
    if current_user.role not in ("admin", "hr") and str(project.get("manager_id")) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Only admins, HR, or this project's manager can save standup actions")
    
    # 1. Calendar Events
    created_events = []
    for event in payload.events:
        try:
            # Parse date/time
            # robust parsing needed, but assuming ISO for now or "today" handling
             # (In a real app, the LLM usually gives a standard format or we sanitize it)
            start_dt = datetime.now() # Placeholder if parsing fails
            try:
                if event.date.lower() == "today":
                    d = datetime.now().date()
                else:
                    d = datetime.strptime(event.date, "%Y-%m-%d").date()
                
                t = datetime.strptime(event.time, "%H:%M").time()
                start_dt = datetime.combine(d, t)
            except:
                pass # Use current time as fallback

            await calendar_service.create_event(
                project_id=project_id,
                title=event.title,
                start_time=start_dt,
                description=event.description
            )
            created_events.append(event.title)
        except Exception as e:
            print(f"Failed to create event {event.title}: {e}")

    # 2. Save Summary (History)
    standup_record = {
        "project_id": project_id,
        "date": datetime.utcnow(),
        "summary": payload.summary,
        "tasks": [t.dict() for t in payload.tasks],
        "blockers": [b.dict() for b in payload.blockers],
        "created_by": current_user.id
    }
    await db["standups"].insert_one(standup_record)

    return {"status": "success", "created_events": created_events, "message": "Standup processed successfully"}

@router.get("/{project_id}/events")
async def get_project_events(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Returns calendar events for the project. Visible to all members (employees included).
    """
    db = get_database()
    await verify_standup_access(project_id, current_user, db)
    events = await calendar_service.get_project_events(project_id)
    return events

@router.get("/{project_id}/summary")
async def get_project_summaries(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Returns past standup summaries.
    """
    db = get_database()
    project = await verify_standup_access(project_id, current_user, db)
    cursor = db["standups"].find({"project_id": {"$in": [project_id, project.get("_id")]}}).sort("date", -1).limit(20)
    summaries = await cursor.to_list(length=20)
    
    results = []
    for s in summaries:
        s["id"] = str(s.pop("_id"))
        results.append(s)
        
    return results


# Team-first standup API. Project standups above remain available for older clients,
# while new schedules, transcript processing, tasks, and history are team scoped.
@router.get("/teams/{team_id}/summary")
async def get_team_standup_summaries(team_id: str, current_user: User = Depends(get_current_user)):
    db = get_database()
    await _team_for_user(db, team_id, current_user)
    cursor = db["standups"].find({"team_id": team_id, "team_archived": {"$ne": True}}).sort("date", -1).limit(50)
    rows = await cursor.to_list(length=50)
    for row in rows:
        row["id"] = str(row.pop("_id"))
    return rows


@router.post("/teams/{team_id}/analyze")
async def analyze_team_standup(team_id: str, payload: AnalysisRequest, current_user: User = Depends(get_current_user)):
    db = get_database()
    team = await _team_for_user(db, team_id, current_user)
    if not _team_manage_allowed(team, current_user):
        raise HTTPException(status_code=403, detail="Only admins, HR, or this team's manager can submit a standup transcript")
    if not payload.transcript.strip():
        raise HTTPException(status_code=422, detail="Transcript cannot be empty")
    members = await _team_ai_members(db, team)
    result = await analyze_standup(payload.transcript, members, team.get("name", "Team"))
    if result.get("error"):
        raise HTTPException(status_code=503, detail=result["error"])
    return result


@router.post("/teams/{team_id}/analyze-upload")
async def analyze_uploaded_team_transcript(
    team_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Extract text from a user-uploaded transcript and return the usual review preview."""
    db = get_database()
    team = await _team_for_user(db, team_id, current_user)
    if not _team_manage_allowed(team, current_user):
        raise HTTPException(status_code=403, detail="Only admins, HR, or this team's manager can submit a standup transcript")

    filename = (file.filename or "").lower()
    suffix = filename.rsplit(".", 1)[-1] if "." in filename else ""
    if suffix not in {"txt", "text", "pdf"}:
        raise HTTPException(status_code=415, detail="Upload a .txt, .text, or text-based .pdf transcript")

    content = await file.read(10 * 1024 * 1024 + 1)
    await file.close()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Transcript files must be 10 MB or smaller")
    if not content:
        raise HTTPException(status_code=422, detail="The uploaded transcript file is empty")

    try:
        if suffix == "pdf":
            reader = PdfReader(BytesIO(content))
            if reader.is_encrypted:
                raise HTTPException(status_code=422, detail="Password-protected PDFs are not supported")
            transcript = "\n".join(page.extract_text() or "" for page in reader.pages)
        else:
            transcript = content.decode("utf-8-sig")
    except HTTPException:
        raise
    except Exception as exc:
        logger.info("Transcript upload could not be parsed (%s)", type(exc).__name__)
        raise HTTPException(status_code=422, detail="Could not read this file. Please upload a valid text or PDF transcript.") from exc

    if not transcript.strip():
        raise HTTPException(status_code=422, detail="No selectable text was found. Scanned/image-only PDFs are not supported yet.")
    if len(transcript) > 100_000:
        raise HTTPException(status_code=413, detail="Transcript text is too long (maximum 100,000 characters)")

    members = await _team_ai_members(db, team)
    result = await analyze_standup(transcript, members, team.get("name", "Team"))
    if result.get("error"):
        raise HTTPException(status_code=503, detail=result["error"])
    return result


@router.post("/teams/{team_id}/execute")
async def execute_team_standup(team_id: str, payload: ExecuteRequest, current_user: User = Depends(get_current_user)):
    db = get_database()
    team = await _team_for_user(db, team_id, current_user)
    if not _team_manage_allowed(team, current_user):
        raise HTTPException(status_code=403, detail="Only admins, HR, or this team's manager can save standup actions")

    members = await _team_ai_members(db, team)
    valid_member_ids = {member.id for member in members}
    cleaned_tasks = []
    for task in payload.tasks:
        item = task.dict()
        if item.get("assignee_id") and str(item["assignee_id"]) not in valid_member_ids:
            item["assignee_id"] = None
            item["assignee_name"] = "Unassigned"
        cleaned_tasks.append(item)
    analysis = {
        "summary": payload.summary,
        "tasks": cleaned_tasks,
        "blockers": [blocker.dict() for blocker in payload.blockers],
    }
    record = await _store_standup(
        db, team_id=team_id, org_id=current_user.current_org_id,
        created_by=current_user.id, analysis=analysis, source=payload.source,
        source_file_id=payload.source_file_id, source_name=payload.source_name,
    )

    created_events = []
    skipped_events = []
    schedule = team.get("standup_schedule") or {}
    organizer_id = schedule.get("organizer_id")
    timezone_name = schedule.get("timezone") or "Asia/Kolkata"
    timezone = ZoneInfo(timezone_name)
    for event in payload.events:
        try:
            event_day = datetime.strptime(event.date, "%Y-%m-%d").date() if event.date and event.date.lower() != "today" else datetime.now(timezone).date()
            event_time = datetime.strptime(event.time or "10:00", "%H:%M").time()
            start = datetime.combine(event_day, event_time, tzinfo=timezone)
            end = start + timedelta(minutes=30)
            if not organizer_id:
                skipped_events.append({"title": event.title, "reason": "Set up this team's Google Calendar schedule first"})
                continue
            users = await _team_ai_members(db, team)
            result = await google_calendar.create_calendar_event(
                current_user.current_org_id, organizer_id, title=event.title,
                start=start, end=end, timezone_name=timezone_name,
                description=event.description or "Scheduled from a reviewed team standup transcript.",
                attendee_emails=[user.email for user in users if user.email],
            )
            await db["calendar_events"].insert_one({
                "organization_id": str(current_user.current_org_id), "team_id": team_id,
                "title": event.title, "description": event.description or "",
                "start_time": start, "end_time": end, "timezone": timezone_name,
                "google_event_id": result.get("id"), "calendar_url": result.get("htmlLink"),
                "attendees": [user.email for user in users if user.email], "created_by": str(current_user.id),
                "created_at": datetime.utcnow(),
            })
            created_events.append(event.title)
        except (ValueError, TypeError) as exc:
            skipped_events.append({"title": event.title, "reason": str(exc)})

    return {"status": "success", "standup_id": record["id"], "created_events": created_events, "skipped_events": skipped_events}


@router.post("/teams/{team_id}/sync-transcripts")
async def sync_team_meet_transcripts(team_id: str, current_user: User = Depends(get_current_user)):
    db = get_database()
    team = await _team_for_user(db, team_id, current_user)
    if not _team_manage_allowed(team, current_user):
        raise HTTPException(status_code=403, detail="Only admins, HR, or this team's manager can sync meeting transcripts")
    schedule = team.get("standup_schedule") or {}
    organizer_id = schedule.get("organizer_id")
    if not organizer_id or not schedule.get("meet_url"):
        raise HTTPException(status_code=409, detail="Create the team's Google Calendar standup with a Meet link first")
    try:
        transcripts = await google_calendar.fetch_meet_transcripts(
            current_user.current_org_id, organizer_id, schedule["meet_url"],
            time_min=datetime.utcnow() - timedelta(days=29), time_max=datetime.utcnow(),
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    members = await _team_ai_members(db, team)
    imported = []
    for transcript in transcripts:
        exists = await db["standups"].find_one({"google_transcript_id": transcript["transcript_id"]}, {"_id": 1})
        if exists:
            continue
        analysis = await analyze_standup(transcript["text"], members, team.get("name", "Team"))
        if analysis.get("error"):
            continue
        record = await _store_standup(
            db, team_id=team_id, org_id=current_user.current_org_id,
            created_by=current_user.id, analysis=analysis,
            transcript_id=transcript["transcript_id"],
        )
        imported.append({"id": record["id"], "summary": record["summary"], "task_count": len(record["tasks"]), "blocker_count": len(record["blockers"])})
    return {"status": "success", "imported": imported, "already_processed": len(transcripts) - len(imported)}
