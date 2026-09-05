from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel
from typing import Optional, Dict, Any
import httpx
import logging
from app.core.config import settings
from app.services.integration.oauth_token_manager import oauth_token_manager

logger = logging.getLogger(__name__)

router = APIRouter()

class OAuthCallbackPayload(BaseModel):
    code: str
    org_id: Optional[str] = "default_org"
    state: Optional[str] = None
    installation_id: Optional[str] = None

@router.get("/status")
async def get_oauth_status(org_id: str = "default_org"):
    """
    Returns active 1-click enterprise OAuth connector statuses.
    """
    connections = oauth_token_manager.list_connections(org_id)
    return {
        "status": "success",
        "org_id": org_id,
        "connections": {
            "github": connections.get("github", {"status": "not_connected"}),
            "slack": connections.get("slack", {"status": "not_connected"}),
            "jira": connections.get("jira", {"status": "not_connected"}),
            "notion": connections.get("notion", {"status": "not_connected"}),
            "gmeet": connections.get("gmeet", {"status": "available"})
        }
    }

# --- 1. GITHUB APP INTEGRATION ---
@router.get("/github/install")
async def get_github_app_install_url(org_id: str = "default_org"):
    """
    Generates official GitHub App Installation URL (No secret API key sharing required).
    """
    app_name = settings.GITHUB_APP_NAME or "novascan-ai-app"
    install_url = f"https://github.com/apps/{app_name}/installations/new?state={org_id}"
    return {
        "provider": "github",
        "install_url": install_url,
        "mode": "github_app",
        "scopes": ["pull_requests:read", "contents:read", "webhooks:auto_managed"]
    }

@router.post("/github/callback")
async def handle_github_app_callback(payload: OAuthCallbackPayload):
    """
    Processes GitHub App installation webhook callback.
    """
    try:
        installation_id = payload.installation_id or payload.code
        oauth_token_manager.save_connection(payload.org_id or "default_org", "github", {
            "installation_id": installation_id,
            "workspace_name": f"GitHub Org (Installation #{installation_id})",
            "scope": "Read-Only PR Diffs & Detections",
            "mode": "GitHub App"
        })
        return {
            "status": "success",
            "message": "GitHub App installed successfully! Webhooks auto-subscribed.",
            "provider": "github"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"GitHub App Callback Error: {str(e)}")

# --- 2. SLACK 1-CLICK OAUTH ("Add to Slack") ---
@router.get("/slack/authorize")
async def get_slack_auth_url(org_id: str = "default_org"):
    """
    Generates official 'Add to Slack' OAuth authorization URL.
    """
    client_id = settings.SLACK_CLIENT_ID or "mock_slack_client_id"
    redirect_uri = settings.slack_redirect
    scopes = "channels:history,chat:write,team:read"
    
    auth_url = f"https://slack.com/oauth/v2/authorize?client_id={client_id}&scope={scopes}&redirect_uri={redirect_uri}&state={org_id}"
    return {
        "provider": "slack",
        "auth_url": auth_url,
        "scopes": ["channels:history", "chat:write", "team:read"]
    }

@router.post("/slack/callback")
async def handle_slack_callback(payload: OAuthCallbackPayload):
    """
    Exchanges authorization code for Slack bot token (xoxb-...) and encrypts via AES-256.
    """
    client_id = settings.SLACK_CLIENT_ID
    client_secret = settings.SLACK_CLIENT_SECRET
    
    # If credentials are not set in .env, simulate successful OAuth connection for demo/dev
    if not (client_id and client_secret):
        oauth_token_manager.save_connection(payload.org_id or "default_org", "slack", {
            "bot_token": f"xoxb-mock-oauth-token-{payload.code[:8]}",
            "team_name": "Acme Engineering Workspace",
            "team_id": "T12345678",
            "scope": "channels:history,chat:write"
        })
        return {
            "status": "success",
            "message": "Slack workspace connected via 1-Click OAuth!",
            "provider": "slack",
            "workspace_name": "Acme Engineering Workspace"
        }

    # Live Server-to-Server Token Exchange
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            res = await client.post("https://slack.com/api/oauth.v2.access", data={
                "client_id": client_id,
                "client_secret": client_secret,
                "code": payload.code,
                "redirect_uri": settings.slack_redirect
            })
            data = res.json()
            if not data.get("ok"):
                raise HTTPException(status_code=400, detail=f"Slack OAuth Error: {data.get('error')}")

            bot_token = data.get("access_token")
            team_info = data.get("team", {})

            oauth_token_manager.save_connection(payload.org_id or "default_org", "slack", {
                "bot_token": bot_token,
                "team_name": team_info.get("name", "Connected Workspace"),
                "team_id": team_info.get("id"),
                "scope": data.get("scope")
            })

            return {
                "status": "success",
                "message": "Slack connected successfully via OAuth!",
                "provider": "slack",
                "workspace_name": team_info.get("name")
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Slack Callback Exception: {str(e)}")

# --- 3. ATLASSIAN JIRA 3-LEGGED OAUTH (3LO) ---
@router.get("/jira/authorize")
async def get_jira_auth_url(org_id: str = "default_org"):
    """
    Generates Atlassian 3-Legged OAuth (3LO) workspace connection URL.
    """
    client_id = settings.JIRA_CLIENT_ID or "mock_jira_client_id"
    redirect_uri = settings.jira_redirect
    scopes = "read:jira-work write:jira-work offline_access"

    auth_url = f"https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id={client_id}&scope={scopes}&redirect_uri={redirect_uri}&state={org_id}&response_type=code&prompt=consent"
    return {
        "provider": "jira",
        "auth_url": auth_url,
        "scopes": ["read:jira-work", "write:jira-work", "offline_access"]
    }

@router.post("/jira/callback")
async def handle_jira_callback(payload: OAuthCallbackPayload):
    """
    Exchanges code for Atlassian OAuth access token, refresh token, and cloud_id.
    """
    client_id = settings.JIRA_CLIENT_ID
    client_secret = settings.JIRA_CLIENT_SECRET

    if not (client_id and client_secret):
        oauth_token_manager.save_connection(payload.org_id or "default_org", "jira", {
            "access_token": f"atlassian-mock-access-token-{payload.code[:8]}",
            "refresh_token": f"atlassian-mock-refresh-token-{payload.code[:8]}",
            "workspace_name": "Jira Production Workspace",
            "cloud_id": "cloud-id-12345",
            "scope": "read:jira-work write:jira-work offline_access"
        })
        return {
            "status": "success",
            "message": "Jira Cloud workspace connected via 1-Click OAuth!",
            "provider": "jira",
            "workspace_name": "Jira Production Workspace"
        }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            # 1. Exchange Code for Token
            res = await client.post("https://auth.atlassian.com/oauth/token", json={
                "grant_type": "authorization_code",
                "client_id": client_id,
                "client_secret": client_secret,
                "code": payload.code,
                "redirect_uri": settings.jira_redirect
            })
            token_data = res.json()
            if "access_token" not in token_data:
                raise HTTPException(status_code=400, detail=f"Jira OAuth Error: {token_data}")

            # 2. Get Connected Accessible Resources (Cloud ID)
            headers = {"Authorization": f"Bearer {token_data['access_token']}", "Accept": "application/json"}
            res_sites = await client.get("https://api.atlassian.com/oauth/token/accessible-resources", headers=headers)
            sites = res_sites.json()
            cloud_id = sites[0]["id"] if sites else "default"
            site_name = sites[0]["name"] if sites else "Jira Workspace"

            oauth_token_manager.save_connection(payload.org_id or "default_org", "jira", {
                "access_token": token_data["access_token"],
                "refresh_token": token_data.get("refresh_token"),
                "cloud_id": cloud_id,
                "workspace_name": site_name,
                "scope": token_data.get("scope")
            })

            return {
                "status": "success",
                "message": "Jira connected successfully via OAuth!",
                "provider": "jira",
                "workspace_name": site_name
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Jira OAuth Callback Exception: {str(e)}")
