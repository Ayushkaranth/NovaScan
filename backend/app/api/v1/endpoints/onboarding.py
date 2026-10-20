from fastapi import APIRouter, HTTPException, Body, Depends
import httpx
import os
from datetime import datetime
from dotenv import load_dotenv
from app.api.v1.endpoints.auth import get_current_user, check_role
from app.models.user import User
from app.core.database import get_database
from typing import List, Dict, Optional, Any
from bson import ObjectId
from app.core.config import settings
from app.services.integration.oauth_token_manager import oauth_token_manager

load_dotenv()
router = APIRouter()
BASE_URL = os.getenv("BASE_URL") 

# 1. CREATE PROJECT (Shell)
@router.post("/project")
async def create_project_shell(
    name: str = Body(...),
    repo_owner: str = Body(...),
    repo_name: str = Body(...),
    github_token: Optional[str] = Body(None),
    jira_url: Optional[str] = Body(None),
    jira_email: Optional[str] = Body(None),
    jira_token: Optional[str] = Body(None),
    slack_token: Optional[str] = Body(None),
    slack_channel: Optional[str] = Body(None),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ("admin", "manager", "hr"):
        raise HTTPException(status_code=403, detail="Only admins and managers can create projects")

    if not current_user.current_org_id:
        raise HTTPException(status_code=400, detail="You must belong to an Organization first")

    db = get_database()

    oauth_credentials = await oauth_token_manager.credentials_for_org(current_user.current_org_id)
    github_token = oauth_credentials.get("github_token")

    # 1. SAVE TO 'PROJECTS' COLLECTION
    new_project = {
        "organization_id": current_user.current_org_id,
        "name": name,
        "slug": name.lower().replace(" ", "-"),
        "repo_owner": repo_owner.strip(),
        "repo_name": repo_name.strip(),
        "created_by": current_user.id,
        "manager_id": current_user.id if current_user.role == "manager" else None,
        "employee_ids": [],
        "created_at": datetime.utcnow(),
        "settings": {
            "slack_channel": oauth_credentials.get("slack_channel") or slack_channel,
            "jira_url": oauth_credentials.get("jira_url") or jira_url,
            "jira_project_key": "SCRUM" 
        }
    }
    
    result = await db["projects"].insert_one(new_project)
    project_id = str(result.inserted_id)
    await oauth_token_manager.apply_to_project(current_user.current_org_id, project_id)

    # 2. AUTO-INSTALL GITHUB WEBHOOK (FIXED: Uses Org ID)
    webhook_target = f"{settings.BASE_URL.rstrip('/')}/api/v1/webhooks/github/{current_user.current_org_id}"
    webhook_config = {
        "name": "web",
        "active": True,
        "events": ["pull_request", "push"],
        "config": {"url": webhook_target, "content_type": "json", "insecure_ssl": "0"}
    }

    if github_token:
        headers = {"Authorization": f"Bearer {github_token}", "Accept": "application/vnd.github+json"}
        async with httpx.AsyncClient(timeout=15) as http:
            try:
                await http.post(
                    f"https://api.github.com/repos/{repo_owner.strip()}/{repo_name.strip()}/hooks",
                    json=webhook_config,
                    headers=headers
                )
            except Exception as e:
                print(f"Webhook creation failed: {e}")
        
    return {"status": "success", "project_id": project_id, "message": "Project created successfully"}

# 2. ASSIGN TEAM
@router.post("/assign-team")
async def assign_team(
    project_id: str = Body(..., alias="org_id"),
    manager_id: str = Body(...),
    employee_ids: List[str] = Body(...),
    hr_user: User = Depends(check_role("admin"))
):
    db = get_database()

    project = await db["projects"].find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if project["organization_id"] != hr_user.current_org_id:
        raise HTTPException(status_code=403, detail="Project does not belong to your organization")

    await db["projects"].update_one(
        {"_id": ObjectId(project_id)},
        {
            "$set": {
                "manager_id": manager_id,
                "employee_ids": employee_ids
            }
        }
    )

    notif_list = []
    notif_list.append({
        "user_id": manager_id,
        "title": "New Assignment",
        "message": f"You are now managing {project['name']}.",
        "project_id": project_id,
        "created_at": datetime.utcnow(),
        "is_read": False
    })
    
    for emp_id in employee_ids:
        notif_list.append({
            "user_id": emp_id,
            "title": "Project Joined",
            "message": f"You've joined {project['name']}.",
            "project_id": project_id,
            "created_at": datetime.utcnow(),
            "is_read": False
        })
        
    if notif_list:
        await db["notifications"].insert_many(notif_list)

    project_settings = project.get("settings", {})
    slack_credentials = await oauth_token_manager.credentials_for_org(hr_user.current_org_id)
    slack_token = slack_credentials.get("slack_token") or project_settings.get("slack_bot_token")
    if slack_token and project_settings.get("slack_channel"):
        await broadcast_team_assignment(
            token=slack_token,
            channel=project_settings["slack_channel"],
            project_name=project["name"],
            manager_id=manager_id,
            employee_ids=employee_ids
        )
    
    return {"status": "success", "message": "Team updated, Slack notified, and Dashboard updated."}

# 3. MASTER ONBOARD (All-in-One Wizard)
@router.post("/master-onboard")
async def master_onboard(
    payload: Dict[str, Any] = Body(...),
    hr_user: User = Depends(get_current_user)
):
    """
    Creates Project, Settings, and Team Assignments in one go.
    """
    db = get_database()

    if hr_user.role not in ("admin", "manager", "hr"):
        raise HTTPException(status_code=403, detail="Only admins and managers can create projects")
    
    if not hr_user.current_org_id:
        raise HTTPException(status_code=400, detail="Join an organization first")

    if not all(payload.get(key) for key in ("name", "repo_owner", "repo_name", "manager_id")):
        raise HTTPException(status_code=422, detail="Project name, repository, and manager are required")

    # Managers can only assign projects to themselves. Admins/HR can choose any manager.
    manager_id = str(payload["manager_id"])
    if hr_user.role == "manager" and manager_id != hr_user.id:
        raise HTTPException(status_code=403, detail="Managers can only assign projects to themselves")
    manager = await db["users"].find_one({"_id": manager_id})
    if not manager and ObjectId.is_valid(manager_id):
        manager = await db["users"].find_one({"_id": ObjectId(manager_id)})
    if not manager or str(manager.get("current_org_id")) != str(hr_user.current_org_id):
        raise HTTPException(status_code=400, detail="The selected manager must belong to your organization")
    if manager.get("role") not in ("admin", "manager", "hr"):
        raise HTTPException(status_code=400, detail="The selected project manager must have a manager role")

    employee_ids = [str(member_id) for member_id in payload.get("employee_ids", [])]
    for employee_id in employee_ids:
        employee = await db["users"].find_one({"_id": employee_id})
        if not employee and ObjectId.is_valid(employee_id):
            employee = await db["users"].find_one({"_id": ObjectId(employee_id)})
        if not employee or str(employee.get("current_org_id")) != str(hr_user.current_org_id):
            raise HTTPException(status_code=400, detail="All assigned employees must belong to your organization")

    # 1. Prepare Project Data. OAuth credentials stay in the encrypted org vault;
    # apply_to_project copies only the integrations already authorized for this org.
    org_credentials = await oauth_token_manager.credentials_for_org(hr_user.current_org_id)
    project_id = str(ObjectId())
    
    new_project = {
        "_id": ObjectId(project_id), # Ensure it's stored as ObjectId
        "organization_id": hr_user.current_org_id, 
        "name": payload["name"],
        "slug": payload["name"].lower().replace(" ", "-"),
        "repo_owner": payload["repo_owner"].strip(),
        "repo_name": payload["repo_name"].strip(),
        "created_by": hr_user.id,
        "manager_id": payload["manager_id"],
        "employee_ids": employee_ids,
        "created_at": datetime.utcnow(),
        "settings": {
            "slack_channel": org_credentials.get("slack_channel"),
            "slack_team_id": org_credentials.get("slack_team_id"),
            "jira_url": org_credentials.get("jira_url"),
            "jira_project_key": "KAN",
            "notion_token": payload.get("notion_token"),
            "notion_database_id": payload.get("notion_database_id")
        }
    }
    
    await db["projects"].insert_one(new_project)
    await oauth_token_manager.apply_to_project(hr_user.current_org_id, project_id)

    # 2. Setup GitHub Webhook (FIXED: Uses Org ID)
    # 🔴 OLD BUG: webhook_target = f"{BASE_URL}/api/v1/webhooks/github/{project_id}"
    # 🟢 NEW FIX: Use hr_user.current_org_id
    webhook_target = f"{settings.BASE_URL.rstrip('/')}/api/v1/webhooks/github/{hr_user.current_org_id}"
    
    webhook_config = {
        "name": "web", 
        "active": True, 
        "events": ["pull_request", "push"],
        "config": {"url": webhook_target, "content_type": "json", "insecure_ssl": "0"}
    }
    
    github_token = org_credentials.get("github_token")
    if github_token:
        headers = {"Authorization": f"Bearer {github_token}", "Accept": "application/vnd.github+json"}
        try:
            async with httpx.AsyncClient(timeout=15) as http:
                await http.post(
                    f"https://api.github.com/repos/{payload['repo_owner'].strip()}/{payload['repo_name'].strip()}/hooks",
                    json=webhook_config, headers=headers
                )
        except Exception as e:
            print(f"GitHub webhook creation failed: {e}")

    # 3. Create Dashboard Notifications
    notif_batch = [
        {
            "user_id": payload["manager_id"], 
            "title": "New Assignment", 
            "message": f"Manager for {payload['name']}", 
            "project_id": project_id,
            "is_read": False, 
            "created_at": datetime.utcnow()
        }
    ]
    for emp_id in employee_ids:
        notif_batch.append({
            "user_id": emp_id, 
            "title": "New Assignment", 
            "message": f"Assigned to {payload['name']}", 
            "project_id": project_id,
            "is_read": False, 
            "created_at": datetime.utcnow()
        })
    
    if notif_batch:
        await db["notifications"].insert_many(notif_batch)

    applied = await oauth_token_manager.apply_to_project(hr_user.current_org_id, project_id)
    return {"status": "success", "project_id": project_id, "integrations": applied.get("applied", [])}

# --- Helper ---
async def broadcast_team_assignment(token: str, channel: str, project_name: str, manager_id: str, employee_ids: list):
    try:
        async with httpx.AsyncClient() as client:
            message = {
                "channel": channel,
                "text": f"🏗️ *New Project Infrastructure Deployed: {project_name}*\n"
                        f"👤 *Manager ID:* {manager_id}\n"
                        f"👥 *Team Size:* {len(employee_ids)} members"
            }
            await client.post(
                "https://slack.com/api/chat.postMessage",
                json=message,
                headers={"Authorization": f"Bearer {token}"}
            )
    except Exception as e:
        print(f"Slack broadcast failed: {e}")
