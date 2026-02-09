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

load_dotenv()
router = APIRouter()
BASE_URL = os.getenv("BASE_URL") 

# 1. CREATE PROJECT 
@router.post("/project")
async def create_project_shell(
    name: str = Body(...),
    repo_owner: str = Body(...),
    repo_name: str = Body(...),
    github_token: str = Body(...),
    jira_url: Optional[str] = Body(None),
    jira_email: Optional[str] = Body(None),
    jira_token: Optional[str] = Body(None),
    slack_token: Optional[str] = Body(None),
    slack_channel: Optional[str] = Body(None),
    current_user: User = Depends(get_current_user)
):
    """
    Creates a Project entity in the 'projects' collection.
    Links it to the current user's Organization.
    """
    if not BASE_URL:
        raise HTTPException(status_code=500, detail="Server misconfiguration: BASE_URL missing")
    
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only Admins can create projects")

    if not current_user.current_org_id:
        raise HTTPException(status_code=400, detail="You must belong to an Organization first")

    db = get_database()

    # 1. SAVE TO 'PROJECTS' COLLECTION
    new_project = {
        "organization_id": current_user.current_org_id, # Link to Parent Org
        "name": name,
        "slug": name.lower().replace(" ", "-"),
        "repo_owner": repo_owner.strip(),
        "repo_name": repo_name.strip(),
        "created_by": current_user.id,
        
        # Team (Empty initially, filled via /assign-team)
        "manager_id": None, 
        "employee_ids": [],
        
        "created_at": datetime.utcnow(),
        "settings": {
            "github_access_token": github_token,
            "slack_bot_token": slack_token,
            "slack_channel": slack_channel,
            "jira_url": jira_url,
            "jira_email": jira_email,
            "jira_api_token": jira_token,
            "jira_project_key": "SCRUM" 
        }
    }
    
    result = await db["projects"].insert_one(new_project)
    project_id = str(result.inserted_id)

    # 2. AUTO-INSTALL GITHUB WEBHOOK
    webhook_target = f"{BASE_URL}/api/v1/webhooks/github/{project_id}"
    webhook_config = {
        "name": "web",
        "active": True,
        "events": ["pull_request", "push"],
        "config": {"url": webhook_target, "content_type": "json", "insecure_ssl": "0"}
    }

    headers = {
        "Authorization": f"token {github_token}",
        "Accept": "application/vnd.github.v3+json"
    }

    async with httpx.AsyncClient() as http:
        try:
            await http.post(
                f"https://api.github.com/repos/{repo_owner.strip()}/{repo_name.strip()}/hooks",
                json=webhook_config,
                headers=headers
            )
        except Exception as e:
            print(f"Webhook creation failed: {e}")
        
    return {"status": "success", "project_id": project_id, "message": "Project created successfully"}

# 2. ASSIGN TEAM (Step 2)
@router.post("/assign-team")
async def assign_team(
    project_id: str = Body(..., alias="org_id"), # Accepting org_id from frontend but treating as project_id
    manager_id: str = Body(...),
    employee_ids: List[str] = Body(...),
    hr_user: User = Depends(check_role("admin")) # Changed "hr" to "admin" to match typical roles
):
    db = get_database()
    
    # 1. Verify Project
    project = await db["projects"].find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if project["organization_id"] != hr_user.current_org_id:
        raise HTTPException(status_code=403, detail="Project does not belong to your organization")

    # 2. Update Project Team
    await db["projects"].update_one(
        {"_id": ObjectId(project_id)},
        {
            "$set": {
                "manager_id": manager_id,
                "employee_ids": employee_ids
            }
        }
    )

    # 3. Create Dashboard Notifications
    notif_list = []
    
    # Notify Manager
    notif_list.append({
        "user_id": manager_id,
        "title": "New Assignment",
        "message": f"You are now managing {project['name']}.",
        "project_id": project_id,
        "created_at": datetime.utcnow(),
        "is_read": False
    })
    
    # Notify Employees
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

    # 4. Broadcast to Slack (if configured)
    settings = project.get("settings", {})
    if settings.get("slack_bot_token") and settings.get("slack_channel"):
        await broadcast_team_assignment(
            token=settings["slack_bot_token"],
            channel=settings["slack_channel"],
            project_name=project["name"],
            manager_id=manager_id,
            employee_ids=employee_ids
        )
    
    return {"status": "success", "message": "Team updated, Slack notified, and Dashboard updated."}

# 3. MASTER ONBOARD (All-in-One Wizard)
@router.post("/master-onboard")
async def master_onboard(
    payload: Dict[str, Any] = Body(...),
    hr_user: User = Depends(check_role("admin"))
):
    """
    Creates Project, Settings, and Team Assignments in one go.
    """
    db = get_database()
    
    if not hr_user.current_org_id:
        raise HTTPException(status_code=400, detail="Join an organization first")

    # 1. Prepare Project Data
    project_id = str(ObjectId())
    
    new_project = {
        "_id": project_id,
        "organization_id": hr_user.current_org_id, # Crucial Link
        "name": payload["name"],
        "slug": payload["name"].lower().replace(" ", "-"),
        "repo_owner": payload["repo_owner"].strip(),
        "repo_name": payload["repo_name"].strip(),
        "created_by": hr_user.id,
        
        # Team Structure
        "manager_id": payload["manager_id"],
        "employee_ids": payload["employee_ids"],

        "created_at": datetime.utcnow(),
        
        # Integrations
        "settings": {
            "github_access_token": payload["github_token"],
            "slack_bot_token": payload["slack_token"],
            "slack_channel": payload["slack_channel"],
            "jira_url": payload.get("jira_url"),
            "jira_email": payload.get("jira_email"),
            "jira_api_token": payload.get("jira_token"),
            "jira_project_key": "SCRUM",
            "notion_token": payload.get("notion_token"),
            "notion_database_id": payload.get("notion_database_id")
        }
    }
    
    # Save to PROJECTS collection
    await db["projects"].insert_one(new_project)

    # 2. Setup GitHub Webhook
    webhook_target = f"{BASE_URL}/api/v1/webhooks/github/{project_id}"
    webhook_config = {
        "name": "web", 
        "active": True, 
        "events": ["pull_request", "push"],
        "config": {"url": webhook_target, "content_type": "json", "insecure_ssl": "0"}
    }
    
    headers = {"Authorization": f"token {payload['github_token']}", "Accept": "application/vnd.github.v3+json"}
    
    try:
        async with httpx.AsyncClient() as http:
            await http.post(
                f"https://api.github.com/repos/{payload['repo_owner']}/{payload['repo_name']}/hooks",
                json=webhook_config, headers=headers
            )
    except Exception as e:
        print(f"⚠️ Webhook setup failed: {e}")

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
    for emp_id in payload["employee_ids"]:
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

    return {"status": "success", "project_id": project_id}

# --- Helper ---
async def broadcast_team_assignment(token: str, channel: str, project_name: str, manager_id: str, employee_ids: list):
    try:
        async with httpx.AsyncClient() as client:
            # Note: Slack user IDs <@ID> format usually requires checking if IDs are email or Slack IDs.
            # Assuming these are internal DB IDs, this might just print the ID string unless mapped.
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