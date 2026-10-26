from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List, Optional
from bson import ObjectId
from datetime import datetime
from pydantic import BaseModel

from app.models.user import User
from app.api.v1.endpoints.auth import get_current_user
from app.core.database import get_database

router = APIRouter()

_PROJECT_SECRET_FIELDS = {
    "github_access_token", "slack_bot_token", "jira_api_token", "jira_oauth_access_token",
    "jira_refresh_token", "notion_token",
}


def _public_project(project: dict) -> dict:
    project["_id"] = str(project["_id"])
    if "organization_id" in project:
        project["organization_id"] = str(project["organization_id"])
    project_settings = project.get("settings")
    if isinstance(project_settings, dict):
        project["settings"] = {key: value for key, value in project_settings.items() if key not in _PROJECT_SECRET_FIELDS}
    return project

# 1. LIST PROJECTS (Filtered by User Role)
@router.get("/")
async def list_projects(
    limit: int = 100, 
    current_user: User = Depends(get_current_user)
):
    db = get_database()
    
    if not current_user.current_org_id:
        return []

    # Filter based on role
    query = {"organization_id": current_user.current_org_id}
    
    # Robust query for managers and employees
    if current_user.role == "manager":
        query["manager_id"] = current_user.id
    elif current_user.role == "employee":
        query["employee_ids"] = current_user.id
        
    projects = await db["projects"].find(query).limit(limit).to_list(limit)

    # 🚨 FIX: Convert ObjectIds to Strings
    results = []
    for project in projects:
        results.append(_public_project(project))

    return results

# 2. GET SINGLE PROJECT
@router.get("/{project_id}")
async def get_project(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    db = get_database()

    # Allow lookup by String or ObjectId
    query = {"_id": project_id}
    if ObjectId.is_valid(project_id):
        query = {"$or": [{"_id": project_id}, {"_id": ObjectId(project_id)}]}

    project = await db["projects"].find_one(query)

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Security Check: Must belong to user's org
    # (We convert both to strings to be safe)
    if str(project.get("organization_id")) != str(current_user.current_org_id):
         raise HTTPException(status_code=403, detail="Access denied")

    # 🚨 FIX: Convert ObjectId to String to prevent 500 Crash
    return _public_project(project)


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    repo_owner: Optional[str] = None
    repo_name: Optional[str] = None
    manager_id: Optional[str] = None
    employee_ids: Optional[List[str]] = None
    team_id: Optional[str] = None


@router.put("/{project_id}")
async def update_project(
    project_id: str,
    project_update: ProjectUpdate = Body(...),
    current_user: User = Depends(get_current_user),
):
    db = get_database()
    query = {"_id": project_id}
    if ObjectId.is_valid(project_id):
        query = {"$or": [{"_id": project_id}, {"_id": ObjectId(project_id)}]}

    project = await db["projects"].find_one(query)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if str(project.get("organization_id")) != str(current_user.current_org_id):
        raise HTTPException(status_code=403, detail="Access denied")

    is_admin = current_user.role in ("admin", "hr")
    is_assigned_manager = current_user.role == "manager" and str(project.get("manager_id")) == str(current_user.id)
    if not (is_admin or is_assigned_manager):
        raise HTTPException(status_code=403, detail="Only organization admins or the assigned project manager can update project settings")

    update_data = project_update.dict(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No project settings were provided")
    if is_assigned_manager:
        if set(update_data) != {"employee_ids"}:
            raise HTTPException(status_code=403, detail="Project managers can only remove project team members")
        current_ids = {str(member_id) for member_id in (project.get("employee_ids") or [])}
        requested_ids = {str(member_id) for member_id in (update_data.get("employee_ids") or [])}
        if not requested_ids.issubset(current_ids):
            raise HTTPException(status_code=403, detail="Project managers cannot add team members")

    if "team_id" in update_data:
        team_id = update_data.get("team_id")
        if team_id:
            id_values = [str(team_id)]
            if ObjectId.is_valid(str(team_id)):
                id_values.append(ObjectId(str(team_id)))
            org_values = [str(current_user.current_org_id)]
            if ObjectId.is_valid(str(current_user.current_org_id)):
                org_values.append(ObjectId(str(current_user.current_org_id)))
            team = await db["teams"].find_one({"_id": {"$in": id_values}, "organization_id": {"$in": org_values}})
            if not team:
                raise HTTPException(status_code=400, detail="Select a team from this organization")
            update_data["team_id"] = str(team["_id"])
        else:
            update_data["team_id"] = None

    for field in ("name", "repo_owner", "repo_name"):
        if field in update_data:
            if not isinstance(update_data[field], str) or not update_data[field].strip():
                raise HTTPException(status_code=422, detail=f"{field.replace('_', ' ').title()} cannot be empty")
            update_data[field] = update_data[field].strip()

    if "name" in update_data:
        update_data["slug"] = update_data["name"].lower().replace(" ", "-")

    manager_id = update_data.get("manager_id")
    if manager_id is not None:
        manager_id = str(manager_id)
        if current_user.role == "manager" and manager_id != str(current_user.id):
            raise HTTPException(status_code=403, detail="Managers can only assign projects to themselves")
        manager = await db["users"].find_one({"_id": manager_id})
        if not manager and ObjectId.is_valid(manager_id):
            manager = await db["users"].find_one({"_id": ObjectId(manager_id)})
        if not manager or str(manager.get("current_org_id")) != str(current_user.current_org_id):
            raise HTTPException(status_code=400, detail="The selected manager must belong to your organization")
        if manager.get("role") not in ("admin", "manager", "hr"):
            raise HTTPException(status_code=400, detail="The selected project manager must have a manager role")
        update_data["manager_id"] = manager_id

    if "employee_ids" in update_data:
        employee_ids = list(dict.fromkeys(str(member_id) for member_id in (update_data["employee_ids"] or [])))
        for employee_id in employee_ids:
            employee = await db["users"].find_one({"_id": employee_id})
            if not employee and ObjectId.is_valid(employee_id):
                employee = await db["users"].find_one({"_id": ObjectId(employee_id)})
            if not employee or str(employee.get("current_org_id")) != str(current_user.current_org_id):
                raise HTTPException(status_code=400, detail="All assigned employees must belong to your organization")
        update_data["employee_ids"] = employee_ids

    await db["projects"].update_one({"_id": project["_id"]}, {"$set": update_data})
    return {"status": "success", "message": "Project settings updated", "project_id": str(project["_id"])}

# 3. DELETE PROJECT
@router.delete("/{project_id}")
async def delete_project(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only Admins can delete projects")

    db = get_database()
    
    query = {"_id": project_id}
    if ObjectId.is_valid(project_id):
        query = {"_id": ObjectId(project_id)}

    project = await db["projects"].find_one(query)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if str(project.get("organization_id")) != str(current_user.current_org_id):
        raise HTTPException(status_code=403, detail="Access denied")

    result = await db["projects"].delete_one({"_id": project["_id"]})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")

    from app.services.integration.oauth_token_manager import oauth_token_manager
    await oauth_token_manager.delete_project_connections(current_user.current_org_id, project_id)

    return {"status": "success", "message": "Project deleted"}

# 4. UPDATE PROJECT SETTINGS
class ProjectSettingsUpdate(BaseModel):
    github_access_token: Optional[str] = None
    slack_bot_token: Optional[str] = None
    slack_channel: Optional[str] = None
    jira_url: Optional[str] = None
    jira_email: Optional[str] = None
    jira_api_token: Optional[str] = None
    notion_token: Optional[str] = None
    notion_database_id: Optional[str] = None

@router.put("/{project_id}/settings")
async def update_project_settings(
    project_id: str,
    settings_update: ProjectSettingsUpdate = Body(...),
    current_user: User = Depends(get_current_user)
):
    db = get_database()
    
    query = {"_id": project_id}
    if ObjectId.is_valid(project_id):
        query = {"$or": [{"_id": project_id}, {"_id": ObjectId(project_id)}]}

    project = await db["projects"].find_one(query)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if str(project.get("organization_id")) != str(current_user.current_org_id):
         raise HTTPException(status_code=403, detail="Access denied")

    update_data = settings_update.dict(exclude_unset=True)
    if not update_data:
         raise HTTPException(status_code=400, detail="No data provided")

    # Update nested settings fields
    set_fields = {f"settings.{k}": v for k, v in update_data.items()}

    await db["projects"].update_one(
        query,
        {"$set": set_fields}
    )

    return {"status": "success", "message": "Project settings updated"}
