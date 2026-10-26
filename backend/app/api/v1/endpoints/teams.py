from datetime import datetime, timedelta
from typing import List, Optional
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator

from app.api.v1.endpoints.auth import get_current_user
from app.core.database import get_database
from app.models.user import User
from app.services.integration import google_calendar

router = APIRouter()


def _id_values(value: str) -> list:
    values = [str(value)]
    if ObjectId.is_valid(str(value)):
        values.append(ObjectId(str(value)))
    return values


async def _find_user(db, user_id: str):
    return await db["users"].find_one({"_id": {"$in": _id_values(user_id)}})


async def _find_team(db, org_id: str, team_id: str):
    org_values = _id_values(org_id)
    team_values = _id_values(team_id)
    return await db["teams"].find_one({"_id": {"$in": team_values}, "organization_id": {"$in": org_values}})


def _public_team(team: dict) -> dict:
    team["_id"] = str(team["_id"])
    team["organization_id"] = str(team.get("organization_id", ""))
    team["manager_id"] = str(team.get("manager_id", ""))
    team["member_ids"] = [str(value) for value in team.get("member_ids", [])]
    return team


def _can_manage_members(user: User) -> bool:
    return user.role in ("admin", "hr")


def _same_org(user: dict, org_id: str) -> bool:
    return str(user.get("current_org_id")) == str(org_id)


def _can_view_team(user: User, team: dict) -> bool:
    return user.role in ("admin", "hr") or str(team.get("manager_id")) == str(user.id) or str(user.id) in {str(value) for value in team.get("member_ids", [])}


async def _validate_team_members(db, org_id: str, manager_id: str, member_ids: List[str], team_id: Optional[str] = None):
    normalized = list(dict.fromkeys([str(manager_id), *(str(value) for value in member_ids)]))
    org_values = _id_values(org_id)
    for user_id in normalized:
        user = await _find_user(db, user_id)
        if not user or not _same_org(user, org_id):
            raise HTTPException(status_code=400, detail="Every team member must belong to this organization")
        role = (user.get("role") or "employee").lower()
        if user_id == str(manager_id) and role != "manager":
            raise HTTPException(status_code=400, detail="A team manager must have the Manager role")
        if role in ("manager", "employee"):
            query = {"organization_id": {"$in": org_values}, "$or": [{"manager_id": user_id}, {"member_ids": user_id}]}
            if team_id:
                query["_id"] = {"$nin": _id_values(team_id)}
            existing = await db["teams"].find_one(query, {"_id": 1, "name": 1})
            if existing:
                raise HTTPException(status_code=409, detail=f"{role.title()} users can belong to only one team")
    return normalized


class TeamCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    description: Optional[str] = Field(default="", max_length=500)
    manager_id: str
    member_ids: List[str] = Field(default_factory=list)


class TeamUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    description: Optional[str] = Field(default=None, max_length=500)
    manager_id: Optional[str] = None
    member_ids: Optional[List[str]] = None


class TaskStatusUpdate(BaseModel):
    status: str


@router.get("")
async def list_teams(current_user: User = Depends(get_current_user)):
    if not current_user.current_org_id:
        return []
    db = get_database()
    org_values = _id_values(current_user.current_org_id)
    query = {"organization_id": {"$in": org_values}}
    if current_user.role == "manager":
        query["manager_id"] = str(current_user.id)
    elif current_user.role not in ("admin", "hr"):
        query["member_ids"] = str(current_user.id)
    teams = await db["teams"].find(query).sort("name", 1).to_list(length=1000)
    return [_public_team(team) for team in teams]


@router.post("")
async def create_team(payload: TeamCreate, current_user: User = Depends(get_current_user)):
    if not _can_manage_members(current_user):
        raise HTTPException(status_code=403, detail="Only admins and HR can create teams")
    if not current_user.current_org_id:
        raise HTTPException(status_code=400, detail="Join an organization before creating a team")
    db = get_database()
    existing = await db["teams"].find_one({"organization_id": {"$in": _id_values(current_user.current_org_id)}, "name_key": payload.name.strip().casefold()})
    if existing:
        raise HTTPException(status_code=409, detail="A team with this name already exists")
    members = await _validate_team_members(db, current_user.current_org_id, payload.manager_id, payload.member_ids)
    team = {
        "organization_id": str(current_user.current_org_id),
        "name": payload.name.strip(),
        "name_key": payload.name.strip().casefold(),
        "description": (payload.description or "").strip(),
        "manager_id": str(payload.manager_id),
        "member_ids": members,
        "created_by": str(current_user.id),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "standup_schedule": None,
    }
    result = await db["teams"].insert_one(team)
    team["_id"] = result.inserted_id
    return _public_team(team)


@router.get("/{team_id}")
async def get_team(team_id: str, current_user: User = Depends(get_current_user)):
    if not current_user.current_org_id:
        raise HTTPException(status_code=400, detail="No organization found")
    db = get_database()
    team = await _find_team(db, current_user.current_org_id, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    if not _can_view_team(current_user, team):
        raise HTTPException(status_code=403, detail="You are not a member of this team")
    return _public_team(team)


@router.put("/{team_id}")
async def update_team(team_id: str, payload: TeamUpdate, current_user: User = Depends(get_current_user)):
    if not _can_manage_members(current_user):
        raise HTTPException(status_code=403, detail="Only admins and HR can update team membership")
    if not current_user.current_org_id:
        raise HTTPException(status_code=400, detail="Join an organization before managing teams")
    db = get_database()
    team = await _find_team(db, current_user.current_org_id, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    update = payload.dict(exclude_unset=True)
    if "name" in update:
        update["name"] = update["name"].strip()
        update["name_key"] = update["name"].casefold()
        duplicate = await db["teams"].find_one({"organization_id": {"$in": _id_values(current_user.current_org_id)}, "name_key": update["name_key"], "_id": {"$ne": team["_id"]}})
        if duplicate:
            raise HTTPException(status_code=409, detail="A team with this name already exists")
    manager_id = str(update.get("manager_id", team["manager_id"]))
    member_ids = update.get("member_ids", team.get("member_ids", []))
    if "manager_id" in update or "member_ids" in update:
        if manager_id != str(team.get("manager_id")) and "member_ids" not in update:
            member_ids = [value for value in member_ids if str(value) != str(team.get("manager_id"))]
        update["member_ids"] = await _validate_team_members(db, current_user.current_org_id, manager_id, member_ids, team_id)
        update["manager_id"] = manager_id
    update["updated_at"] = datetime.utcnow()
    await db["teams"].update_one({"_id": team["_id"]}, {"$set": update})
    team.update(update)
    return _public_team(team)


@router.delete("/{team_id}")
async def delete_team(team_id: str, current_user: User = Depends(get_current_user)):
    if not _can_manage_members(current_user):
        raise HTTPException(status_code=403, detail="Only admins and HR can delete teams")
    if not current_user.current_org_id:
        raise HTTPException(status_code=400, detail="Join an organization before managing teams")
    db = get_database()
    team = await _find_team(db, current_user.current_org_id, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    schedule = team.get("standup_schedule") or {}
    if schedule.get("google_event_id") and schedule.get("organizer_id"):
        try:
            await google_calendar.delete_event(current_user.current_org_id, schedule["organizer_id"], schedule["google_event_id"])
        except ValueError:
            pass
    await db["teams"].delete_one({"_id": team["_id"]})
    await db["standups"].update_many({"team_id": team_id}, {"$set": {"team_archived": True}})
    return {"status": "success"}


class StandupSchedule(BaseModel):
    weekdays: List[int] = Field(default_factory=lambda: [0, 1, 2, 3, 4])
    local_time: str = "10:00"
    duration_minutes: int = Field(default=15, ge=5, le=180)
    timezone: str = "Asia/Kolkata"

    @field_validator("timezone")
    @classmethod
    def validate_timezone(cls, value):
        try:
            ZoneInfo(value)
        except (ZoneInfoNotFoundError, TypeError) as exc:
            raise ValueError("Choose a valid timezone, such as Asia/Kolkata") from exc
        return value


def _can_schedule(user: User, team: dict) -> bool:
    return user.role in ("admin", "hr") or (user.role == "manager" and str(team.get("manager_id")) == str(user.id))


@router.get("/{team_id}/schedule")
async def get_team_schedule(team_id: str, current_user: User = Depends(get_current_user)):
    if not current_user.current_org_id:
        raise HTTPException(status_code=400, detail="No organization found")
    db = get_database()
    team = await _find_team(db, current_user.current_org_id, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    if not _can_view_team(current_user, team):
        raise HTTPException(status_code=403, detail="You are not a member of this team")
    schedule = dict(team.get("standup_schedule") or {})
    if schedule:
        connection = await google_calendar.get_connection(current_user.current_org_id, schedule.get("organizer_id", ""))
        schedule["connected"] = bool(connection)
        schedule["organizer_email"] = (connection or {}).get("email") or schedule.get("organizer_email")
    return schedule or None


@router.put("/{team_id}/schedule")
async def set_team_schedule(team_id: str, payload: StandupSchedule, current_user: User = Depends(get_current_user)):
    if not current_user.current_org_id:
        raise HTTPException(status_code=400, detail="Join an organization before scheduling a standup")
    db = get_database()
    team = await _find_team(db, current_user.current_org_id, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    if not _can_schedule(current_user, team):
        raise HTTPException(status_code=403, detail="Only admins, HR, or this team's manager can schedule its standup")
    if not google_calendar.google_calendar_configured():
        raise HTTPException(status_code=503, detail="Google Calendar OAuth is not configured on the server")
    old_schedule = team.get("standup_schedule") or {}
    organizer_id = str(old_schedule.get("organizer_id") or current_user.id)
    organizer_connection = await google_calendar.get_connection(current_user.current_org_id, organizer_id)
    if not organizer_connection:
        organizer_id = str(current_user.id)
        organizer_connection = await google_calendar.get_connection(current_user.current_org_id, organizer_id)
    if not organizer_connection:
        raise HTTPException(status_code=409, detail="Connect a Google Calendar account before creating this team's schedule")
    members = list(dict.fromkeys([str(team.get("manager_id")), *(str(value) for value in team.get("member_ids", []))]))
    emails = []
    for member_id in members:
        user = await _find_user(db, member_id)
        if user and user.get("email"):
            emails.append(user["email"])
    try:
        created = await google_calendar.create_recurring_standup(
            org_id=current_user.current_org_id, organizer_id=organizer_id,
            team_id=team_id, team_name=team.get("name", "Team"), member_emails=emails,
            weekdays=payload.weekdays, local_time=payload.local_time,
            duration_minutes=payload.duration_minutes, timezone_name=payload.timezone,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    schedule = {
        "weekdays": created["weekdays"], "local_time": created["local_time"],
        "duration_minutes": created["duration_minutes"], "timezone": created["timezone"],
        "google_event_id": created["id"], "calendar_url": created["html_link"],
        "meet_url": created["meet_url"], "conference_id": created["conference_id"],
        "organizer_id": organizer_id, "organizer_email": organizer_connection.get("email"),
        "next_start": created["start"], "updated_at": datetime.utcnow(),
    }
    await db["teams"].update_one({"_id": team["_id"]}, {"$set": {"standup_schedule": schedule, "updated_at": datetime.utcnow()}})
    await db["calendar_events"].insert_one({
        "organization_id": str(current_user.current_org_id), "team_id": team_id,
        "title": f"{team.get('name')} Daily Standup", "start_time": created["start"],
        "end_time": created["end"], "timezone": created["timezone"],
        "attendees": emails, "google_event_id": created["id"], "meet_url": created["meet_url"],
        "calendar_url": created["html_link"], "recurrence": created["recurrence"],
        "created_by": str(current_user.id), "created_at": datetime.utcnow(),
    })
    if old_schedule.get("google_event_id") and old_schedule.get("organizer_id"):
        try:
            await google_calendar.delete_event(current_user.current_org_id, old_schedule["organizer_id"], old_schedule["google_event_id"])
        except ValueError:
            pass
    schedule["connected"] = True
    schedule["team_name"] = team.get("name")
    return schedule


@router.delete("/{team_id}/schedule")
async def clear_team_schedule(team_id: str, current_user: User = Depends(get_current_user)):
    if not current_user.current_org_id:
        raise HTTPException(status_code=400, detail="Join an organization before managing schedules")
    db = get_database()
    team = await _find_team(db, current_user.current_org_id, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    if not _can_schedule(current_user, team):
        raise HTTPException(status_code=403, detail="Only admins, HR, or this team's manager can change its schedule")
    schedule = team.get("standup_schedule") or {}
    if schedule.get("google_event_id") and schedule.get("organizer_id"):
        try:
            await google_calendar.delete_event(current_user.current_org_id, schedule["organizer_id"], schedule["google_event_id"])
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
    await db["teams"].update_one({"_id": team["_id"]}, {"$set": {"standup_schedule": None, "updated_at": datetime.utcnow()}})
    return {"status": "success"}


@router.get("/{team_id}/calendar")
async def get_team_calendar(team_id: str, current_user: User = Depends(get_current_user)):
    if not current_user.current_org_id:
        raise HTTPException(status_code=400, detail="No organization found")
    db = get_database()
    team = await _find_team(db, current_user.current_org_id, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    if not _can_view_team(current_user, team):
        raise HTTPException(status_code=403, detail="You are not a member of this team")
    schedule = team.get("standup_schedule") or {}
    organizer_id = schedule.get("organizer_id")
    if organizer_id:
        try:
            events = await google_calendar.list_events(
                current_user.current_org_id, organizer_id,
                time_min=datetime.utcnow() - timedelta(days=14),
                time_max=datetime.utcnow() + timedelta(days=90),
            )
            event_id = schedule.get("google_event_id")
            matches = [event for event in events if event.get("id") == event_id or event.get("recurringEventId") == event_id]
            mapped = [{
                "id": event.get("id"), "title": event.get("summary") or team.get("name"),
                "start_time": (event.get("start") or {}).get("dateTime") or (event.get("start") or {}).get("date"),
                "end_time": (event.get("end") or {}).get("dateTime") or (event.get("end") or {}).get("date"),
                "meet_url": event.get("hangoutLink") or schedule.get("meet_url"),
                "calendar_url": event.get("htmlLink") or schedule.get("calendar_url"),
                "attendees": event.get("attendees", []),
            } for event in matches]
            if mapped:
                return mapped
        except ValueError:
            pass
    cursor = db["calendar_events"].find({"team_id": team_id, "organization_id": str(current_user.current_org_id)}).sort("start_time", 1).limit(100)
    results = await cursor.to_list(length=100)
    for event in results:
        event["id"] = str(event.pop("_id"))
        event.pop("attendees", None)
    return results


@router.get("/{team_id}/tasks")
async def list_team_tasks(team_id: str, current_user: User = Depends(get_current_user)):
    if not current_user.current_org_id:
        raise HTTPException(status_code=400, detail="No organization found")
    db = get_database()
    team = await _find_team(db, current_user.current_org_id, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    if not _can_view_team(current_user, team):
        raise HTTPException(status_code=403, detail="You are not a member of this team")
    cursor = db["standup_tasks"].find({"team_id": team_id}).sort("created_at", -1).limit(200)
    tasks = await cursor.to_list(length=200)
    for task in tasks:
        task["id"] = str(task.pop("_id"))
    return tasks


@router.patch("/{team_id}/tasks/{task_id}")
async def update_team_task(team_id: str, task_id: str, payload: TaskStatusUpdate, current_user: User = Depends(get_current_user)):
    if not current_user.current_org_id:
        raise HTTPException(status_code=400, detail="No organization found")
    db = get_database()
    team = await _find_team(db, current_user.current_org_id, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    if not _can_view_team(current_user, team):
        raise HTTPException(status_code=403, detail="You are not a member of this team")
    task = await db["standup_tasks"].find_one({"team_id": team_id, "_id": {"$in": _id_values(task_id)}})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    allowed = _can_schedule(current_user, team) or str(task.get("assignee_id")) == str(current_user.id)
    if not allowed:
        raise HTTPException(status_code=403, detail="Only this team's manager or the task assignee can update a task")
    status = payload.status
    if status not in ("open", "in_progress", "done"):
        raise HTTPException(status_code=422, detail="Task status must be open, in_progress, or done")
    query = {"team_id": team_id, "_id": {"$in": _id_values(task_id)}}
    result = await db["standup_tasks"].update_one(query, {"$set": {"status": status, "updated_at": datetime.utcnow()}})
    if not result.matched_count:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"status": "success"}
