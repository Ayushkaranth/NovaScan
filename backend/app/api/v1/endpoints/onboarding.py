from fastapi import APIRouter, HTTPException, Body, Depends
import httpx
import os
from datetime import datetime
from dotenv import load_dotenv
from app.api.v1.endpoints.auth import get_current_user
from app.models.user import User
from app.core.database import get_database

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