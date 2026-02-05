from fastapi import APIRouter, HTTPException, Body, Depends
import httpx
import os
from datetime import datetime
from dotenv import load_dotenv
from app.api.v1.endpoints.auth import get_current_user
from app.models.user import User
from app.core.database import get_database
from app.api.v1.endpoints.auth import get_current_user, check_role
from typing import List, Dict, Optional, Any
from bson import ObjectId

load_dotenv()
router = APIRouter()
BASE_URL = os.getenv("BASE_URL") 

@router.post("/project")
async def create_project(
    name: str = Body(...),
    repo_owner: str = Body(...),
    repo_name: str = Body(...),
    github_token: str = Body(...),
    jira_url: str = Body(...),
    jira_email: str = Body(...),
    jira_token: str = Body(...),
    slack_token: str = Body(...),
    slack_channel: str = Body(...),
    current_user: User = Depends(get_current_user)
):
    if not BASE_URL:
        raise HTTPException(status_code=500, detail="Server misconfiguration: BASE_URL missing")

    db = get_database()

    # 1. SAVE TO DATABASE WITH ALL REQUIRED FIELDS
    new_org = {
        "name": name,
        "slug": name.lower().replace(" ", "-"), # Added slug for model validation
        "repo_owner": repo_owner.strip(),
        "repo_name": repo_name.strip(),
        "owner_id": current_user.id,
        "members": [current_user.id],
        "created_at": datetime.utcnow(),        # Added timestamp
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
    
    result = await db["organizations"].insert_one(new_org)
    org_id = str(result.inserted_id)

    # 2. AUTO-INSTALL GITHUB WEBHOOK
    webhook_target = f"{BASE_URL}/api/v1/webhooks/github/{org_id}"
    webhook_config = {
        "name": "web",
        "active": True,
        "events": ["pull_request"],
        "config": {"url": webhook_target, "content_type": "json", "insecure_ssl": "0"}
    }

    headers = {
        "Authorization": f"token {github_token}",
        "Accept": "application/vnd.github.v3+json"
    }

    async with httpx.AsyncClient() as http:
        response = await http.post(
            f"https://api.github.com/repos/{repo_owner.strip()}/{repo_name.strip()}/hooks",
            json=webhook_config,
            headers=headers
        )
        
    return {"status": "success", "org_id": org_id, "message": "Project created successfully"}

@router.post("/assign-team")
async def assign_team(
    org_id: str = Body(...),
    manager_id: str = Body(...),
    employee_ids: List[str] = Body(...),
    hr_user: User = Depends(check_role("hr"))
):
    db = get_database()
    org = await db["organizations"].find_one({"_id": ObjectId(org_id)})
    if not org:
        raise HTTPException(status_code=404, detail="Project not found")

    # 1. Update Organization assignments
    await db["organizations"].update_one(
        {"_id": ObjectId(org_id)},
        {
            "$set": {f"assignments.{manager_id}": employee_ids},
            "$addToSet": {"members": {"$each": [manager_id] + employee_ids}}
        }
    )

    # 2. Create Website Dashboard Notifications
    notif_list = []
    # For Manager
    notif_list.append({
        "user_id": manager_id,
        "title": "New Assignment",
        "message": f"You are now managing {org['name']}.",
        "created_at": datetime.utcnow(),
        "is_read": False
    })
    # For Employees
    for emp_id in employee_ids:
        notif_list.append({
            "user_id": emp_id,
            "title": "Project Joined",
            "message": f"You've joined {org['name']}. Your Manager is User_{manager_id[:5]}.",
            "created_at": datetime.utcnow(),
            "is_read": False
        })
    await db["notifications"].insert_many(notif_list)

    # 3. Broadcast to Slack Channel
    settings = org.get("settings", {})
    if settings.get("slack_bot_token"):
        await broadcast_team_assignment(
            token=settings["slack_bot_token"],
            channel=settings["slack_channel"],
            org_name=org["name"],
            manager_id=manager_id,
            employee_ids=employee_ids
        )
    
    return {"status": "success", "message": "Team updated, Slack notified, and Dashboard updated."}

@router.post("/master-onboard")
async def master_onboard(
    payload: Dict[str, Any] = Body(...),
    hr_user: User = Depends(check_role("hr"))
):
    db = get_database()
    
    # 1. Generate ID and prepare Organization data
    org_id = str(ObjectId())
    new_org = {
        "_id": org_id,
        "name": payload["name"],
        "slug": payload["name"].lower().replace(" ", "-"),
        "repo_owner": payload["repo_owner"].strip(),
        "repo_name": payload["repo_name"].strip(),
        "owner_id": hr_user.id,
        "members": [hr_user.id, payload["manager_id"]] + payload["employee_ids"],
        "assignments": {payload["manager_id"]: payload["employee_ids"]},
        "created_at": datetime.utcnow(),
        "settings": {
            "github_access_token": payload["github_token"],
            "slack_bot_token": payload["slack_token"],
            "slack_channel": payload["slack_channel"],
            "jira_url": payload.get("jira_url"),
            "jira_email": payload.get("jira_email"),
            "jira_api_token": payload.get("jira_token"),
            "jira_project_key": "SCRUM" 
        }
    }
    
    await db["organizations"].insert_one(new_org)

    # 2. Setup GitHub Webhook
    webhook_target = f"{BASE_URL}/api/v1/webhooks/github/{org_id}"
    webhook_config = {
        "name": "web", "active": True, "events": ["pull_request"],
        "config": {"url": webhook_target, "content_type": "json", "insecure_ssl": "0"}
    }
    headers = {"Authorization": f"token {payload['github_token']}", "Accept": "application/vnd.github.v3+json"}
    
    async with httpx.AsyncClient() as http:
        await http.post(
            f"https://api.github.com/repos/{payload['repo_owner']}/{payload['repo_name']}/hooks",
            json=webhook_config, headers=headers
        )

    # 3. Create Dashboard Notifications
    notif_batch = [
        {"user_id": payload["manager_id"], "title": "New Assignment", "message": f"Manager for {payload['name']}", "is_read": False, "created_at": datetime.utcnow()}
    ]
    for emp_id in payload["employee_ids"]:
        notif_batch.append({"user_id": emp_id, "title": "New Assignment", "message": f"Assigned to {payload['name']}", "is_read": False, "created_at": datetime.utcnow()})
    
    await db["notifications"].insert_many(notif_batch)

    return {"status": "success", "org_id": org_id}

async def broadcast_team_assignment(token: str, channel: str, org_name: str, manager_id: str, employee_ids: list):
    async with httpx.AsyncClient() as client:
        message = {
            "channel": channel,
            "text": f"🏗️ *New Project Infrastructure Deployed: {org_name}*\n"
                    f"👤 *Manager:* <@{manager_id}>\n"
                    f"👥 *Team:* " + ", ".join([f"<@{uid}>" for uid in employee_ids])
        }
        await client.post(
            "https://slack.com/api/chat.postMessage",
            json=message,
            headers={"Authorization": f"Bearer {token}"}
        )