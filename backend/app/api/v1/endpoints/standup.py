from fastapi import APIRouter, HTTPException, Depends, Body
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from app.core.database import get_database
from app.models.user import User
from app.api.v1.endpoints.auth import get_current_user
from app.services.intelligence.standup_agent import analyze_standup
from app.services.integration.calendar_service import calendar_service
from bson import ObjectId

router = APIRouter()

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

# --- Helper: RBAC ---

async def verify_standup_access(project_id: str, user: User, db):
    """
    Ensures that the user has permission to manage standups for this project.
    HR: Can access all.
    Manager: Can access all (per user request).
    """
    if user.role in ["hr", "manager"]:
        return True
        
    # Optional: If we want to restrict employees, we can do it here.
    # For now, only HR and Managers can add transcripts.
    raise HTTPException(status_code=403, detail="Not authorized. Only Managers and HR can add transcripts.")

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
    await verify_standup_access(project_id, current_user, db)
    
    # Fetch Project & Members
    # Fetch Project & Members
    query = {"_id": project_id}
    if ObjectId.is_valid(project_id):
        query = {"_id": ObjectId(project_id)}
    
    project = await db["projects"].find_one(query)
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
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
    await verify_standup_access(project_id, current_user, db)
    
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
    # Simply check if user belongs to project or is HR (simplified check)
    # For now, allowing any authenticated user to see events if they have the project_id
    # In production, check members list.
    
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
    cursor = db["standups"].find({"project_id": project_id}).sort("date", -1).limit(20)
    summaries = await cursor.to_list(length=20)
    
    results = []
    for s in summaries:
        s["id"] = str(s.pop("_id"))
        results.append(s)
        
    return results
