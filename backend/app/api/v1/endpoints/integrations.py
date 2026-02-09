from fastapi import APIRouter, HTTPException, Depends, Body
from app.core.database import get_database
from app.models.user import User
from app.models.integration import IntegrationConnectRequest, IntegrationStatus, ProjectIntegrationsView
from app.api.v1.endpoints.auth import get_current_user
from bson import ObjectId
from datetime import datetime
import httpx

router = APIRouter()

# --- Helper: Verify External Credentials ---
async def verify_credentials(platform: str, creds: dict) -> bool:
    async with httpx.AsyncClient() as client:
        try:
            if platform == "github":
                token = creds.get("access_token")
                resp = await client.get("https://api.github.com/user", headers={
                    "Authorization": f"Bearer {token}",
                    "Accept": "application/vnd.github.v3+json"
                })
                return resp.status_code == 200
            
            elif platform == "slack":
                token = creds.get("bot_token")
                resp = await client.post("https://slack.com/api/auth.test", headers={
                    "Authorization": f"Bearer {token}"
                })
                return resp.json().get("ok") is True

            elif platform == "jira":
                # Handle domain cleanup (remove https:// and path)
                raw_domain = creds.get("domain", "")
                domain = raw_domain.replace("https://", "").replace("http://", "").split("/")[0]
                
                url = f"https://{domain}/rest/api/3/myself"
                resp = await client.get(url, auth=(creds.get("email"), creds.get("api_token")))
                return resp.status_code == 200

            elif platform == "notion":
                resp = await client.get("https://api.notion.com/v1/users/me", headers={
                    "Authorization": f"Bearer {creds.get('token')}",
                    "Notion-Version": "2022-06-28"
                })
                return resp.status_code == 200

        except Exception as e:
            print(f"Verification Failed for {platform}: {e}")
            return False
    return False

# 1. CONNECT INTEGRATION (Verify & Save)
@router.post("/{project_id}/{platform}")
async def connect_integration(
    project_id: str,
    platform: str,
    payload: IntegrationConnectRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Verifies the token with the 3rd party API.
    If valid, updates the PROJECT's settings in the DB.
    """
    db = get_database()
    valid_platforms = ["github", "jira", "slack", "notion"]
    
    if platform not in valid_platforms:
        raise HTTPException(status_code=400, detail="Unsupported platform")

    # 1. Check Project & Permissions
    project = await db["projects"].find_one({"_id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Only Admin or the Assigned Manager can edit integrations
    is_admin = current_user.role == "admin"
    is_manager = current_user.role == "manager" and project.get("manager_id") == current_user.id
    
    if not (is_admin or is_manager):
        raise HTTPException(status_code=403, detail="Not authorized to edit this project")

    # 2. Verify Credentials
    is_valid = await verify_credentials(platform, payload.credentials)
    if not is_valid:
        raise HTTPException(status_code=400, detail=f"Invalid {platform} credentials or connection failed.")

    # 3. Map Input to Project Settings Schema
    creds = payload.credentials
    update_fields = {}
    
    if platform == "github":
        update_fields["settings.github_access_token"] = creds.get("access_token")
    elif platform == "slack":
        update_fields["settings.slack_bot_token"] = creds.get("bot_token")
        if creds.get("channel"):
            update_fields["settings.slack_channel"] = creds.get("channel")
    elif platform == "jira":
        update_fields["settings.jira_url"] = creds.get("domain")
        update_fields["settings.jira_email"] = creds.get("email")
        update_fields["settings.jira_api_token"] = creds.get("api_token")
    elif platform == "notion":
        update_fields["settings.notion_token"] = creds.get("token")
        if creds.get("database_id"):
            update_fields["settings.notion_database_id"] = creds.get("database_id")

    # 4. Save to DB
    await db["projects"].update_one(
        {"_id": project_id},
        {"$set": update_fields}
    )

    return {"status": "success", "message": f"{platform} connected successfully"}

# 2. LIST INTEGRATIONS (Status Only)
@router.get("/{project_id}", response_model=ProjectIntegrationsView)
async def get_project_integrations(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Returns which tools are connected for this project.
    Does NOT return the actual secret tokens.
    """
    db = get_database()
    project = await db["projects"].find_one({"_id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    settings = project.get("settings", {})
    statuses = []

    # Helper to check
    def check_status(platform, has_token, details=None):
        return IntegrationStatus(
            platform=platform,
            is_connected=bool(has_token),
            connected_at=project.get("created_at"), # Simplified for now
            details=details if has_token else None
        )

    # 1. GitHub
    statuses.append(check_status("github", settings.get("github_access_token"), 
                                 {"repo": f"{project.get('repo_owner')}/{project.get('repo_name')}"}))

    # 2. Slack
    statuses.append(check_status("slack", settings.get("slack_bot_token"), 
                                 {"channel": settings.get("slack_channel")}))

    # 3. Jira
    statuses.append(check_status("jira", settings.get("jira_api_token"), 
                                 {"domain": settings.get("jira_url")}))

    # 4. Notion
    statuses.append(check_status("notion", settings.get("notion_token"), 
                                 {"db_id": settings.get("notion_database_id")}))

    return {
        "project_id": project_id,
        "integrations": statuses
    }