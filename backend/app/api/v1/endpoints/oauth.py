from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from urllib.parse import urlencode, quote
import logging
import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from jose import jwt, JWTError

from app.core.config import settings
from app.core.database import get_database
from app.models.user import User
from app.api.v1.endpoints.auth import get_current_user
from app.services.integration.oauth_token_manager import oauth_token_manager
from app.services.integration.github_webhooks import ensure_github_webhook
from app.services.integration.github_app import github_app_configured, authorize_installation, create_repository_token

logger = logging.getLogger(__name__)
router = APIRouter()

GITHUB_SCOPES = "repo read:user admin:repo_hook"
SLACK_SCOPES = "channels:history,channels:read,chat:write,team:read,incoming-webhook"
JIRA_SCOPES = "read:jira-work write:jira-work read:jira-user offline_access"


class OAuthCallbackPayload(BaseModel):
    code: Optional[str] = None
    state: Optional[str] = None
    org_id: Optional[str] = None
    installation_id: Optional[str] = None
    provider: Optional[str] = None


def _frontend_result_url(
    status: str,
    provider: str,
    message: str,
    project_id: Optional[str] = None,
    return_to: str = "project",
) -> str:
    params = {"status": status, "provider": provider, "message": message}
    if project_id:
        if return_to == "new":
            params["project_id"] = project_id
            return f"{settings.FRONTEND_URL.rstrip('/')}/projects/new?{urlencode(params)}"
        if return_to == "settings":
            return f"{settings.FRONTEND_URL.rstrip('/')}/projects/{quote(project_id, safe='')}/settings?{urlencode(params)}"
        return f"{settings.FRONTEND_URL.rstrip('/')}/projects/{quote(project_id, safe='')}?{urlencode(params)}"
    return f"{settings.FRONTEND_URL.rstrip('/')}/projects/new?{urlencode(params)}"


def _project_id_from_state(state: Optional[str]) -> Optional[str]:
    if not state:
        return None
    try:
        return _decode_state(state).get("project_id")
    except HTTPException:
        return None


def _return_to_from_state(state: Optional[str]) -> str:
    if not state:
        return "project"
    try:
        return_to = _decode_state(state).get("return_to")
        return return_to if return_to in ("new", "settings") else "project"
    except HTTPException:
        return "project"


def _encode_state(
    org_id: str,
    user_id: str,
    provider: str,
    project_id: Optional[str] = None,
    return_to: str = "project",
    github_mode: Optional[str] = None,
) -> str:
    payload = {
        "org_id": org_id,
        "user_id": user_id,
        "provider": provider,
        "project_id": project_id,
        "return_to": return_to if return_to in ("project", "new", "settings") else "project",
        "exp": datetime.utcnow() + timedelta(minutes=20),
    }
    if github_mode:
        payload["github_mode"] = github_mode
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")


def _decode_state(state: str) -> Dict[str, Any]:
    try:
        return jwt.decode(state, settings.SECRET_KEY, algorithms=["HS256"])
    except JWTError as e:
        raise HTTPException(status_code=400, detail=f"Invalid or expired OAuth state: {e}")


async def _validated_callback_state(state: Optional[str], provider: str) -> Dict[str, Any]:
    if not state:
        raise HTTPException(status_code=400, detail="Missing OAuth state")
    claims = _decode_state(state)
    if claims.get("provider") != provider or not claims.get("org_id") or not claims.get("user_id"):
        raise HTTPException(status_code=400, detail="OAuth state does not match this provider")
    project_id = claims.get("project_id")
    if not project_id:
        raise HTTPException(status_code=400, detail="OAuth state is missing its project")
    db = get_database()
    if db is not None:
        from app.services.integration.oauth_token_manager import _find_project
        project = await _find_project(db, project_id)
        if not project or str(project.get("organization_id")) != str(claims["org_id"]):
            raise HTTPException(status_code=403, detail="The selected project does not belong to this organization")
    return claims


def _require_admin_or_manager(user: User):
    if user.role not in ("admin", "manager", "hr"):
        raise HTTPException(status_code=403, detail="Only admins and managers can connect integrations")
    if not user.current_org_id:
        raise HTTPException(status_code=400, detail="Join an organization before connecting integrations")


def _require_client(provider: str, client_id: Optional[str], client_secret: Optional[str]):
    if not (client_id and client_secret):
        env_map = {
            "github": "GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET",
            "slack": "SLACK_CLIENT_ID and SLACK_CLIENT_SECRET",
            "jira": "JIRA_CLIENT_ID and JIRA_CLIENT_SECRET",
        }
        raise HTTPException(
            status_code=503,
            detail=f"{provider.title()} OAuth is not configured on the server. Set {env_map.get(provider, 'client credentials')} in the backend .env.",
        )


async def _validate_project_scope(user: User, project_id: Optional[str]):
    if not project_id:
        raise HTTPException(status_code=422, detail="A project_id is required for project-scoped OAuth")
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Project-scoped OAuth requires the database")
    from app.services.integration.oauth_token_manager import _find_project
    project = await _find_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if str(project.get("organization_id")) != str(user.current_org_id):
        raise HTTPException(status_code=403, detail="Project does not belong to your organization")


async def _live_check(provider: str, conn: Dict[str, Any]) -> Dict[str, Any]:
    summary = {
        "status": conn.get("status", "not_connected") if conn else "not_connected",
        "live": False,
        "workspace_name": None,
        "scope": None,
        "connected_at": None,
        "details": {},
    }
    if not conn:
        return summary

    connected_at = conn.get("connected_at")
    summary["connected_at"] = connected_at.isoformat() if hasattr(connected_at, "isoformat") else connected_at
    summary["workspace_name"] = conn.get("workspace_name") or conn.get("team_name")
    summary["scope"] = conn.get("scope")
    summary["details"] = {
        k: conn.get(k)
        for k in ("team_id", "cloud_id", "login", "site_url", "channel", "channel_id")
        if conn.get(k)
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            if provider == "github":
                installation_id = conn.get("installation_id")
                repository_id = conn.get("repository_id")
                repository_full_name = conn.get("repository_full_name")
                if conn.get("mode") == "github_app_repository" and installation_id and repository_id and repository_full_name:
                    token = await create_repository_token(installation_id, repository_id)
                    summary["details"]["repository"] = repository_full_name
                    summary["details"]["repository_id"] = repository_id
                    owner, _, name = repository_full_name.partition("/")
                    res = await client.get(
                        f"https://api.github.com/repos/{quote(owner, safe='')}/{quote(name, safe='')}",
                        headers={"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json"},
                    )
                    summary["live"] = res.status_code == 200 and str(res.json().get("id")) == str(repository_id)
                    return summary
                token = conn.get("access_token")
                if not token:
                    return summary
                res = await client.get(
                    "https://api.github.com/user",
                    headers={"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json"},
                )
                summary["live"] = res.status_code == 200
                if res.status_code == 200:
                    user = res.json()
                    summary["workspace_name"] = user.get("login") or summary["workspace_name"]
                    summary["details"]["login"] = user.get("login")
            elif provider == "slack":
                token = conn.get("bot_token") or conn.get("access_token")
                if not token:
                    return summary
                res = await client.post(
                    "https://slack.com/api/auth.test",
                    headers={"Authorization": f"Bearer {token}"},
                )
                data = res.json()
                summary["live"] = bool(data.get("ok"))
                if data.get("ok"):
                    summary["workspace_name"] = data.get("team") or summary["workspace_name"]
                    summary["details"]["team_id"] = data.get("team_id")
            elif provider == "jira":
                token = conn.get("access_token")
                if not token:
                    return summary
                res = await client.get(
                    "https://api.atlassian.com/oauth/token/accessible-resources",
                    headers={"Authorization": f"Bearer {token}", "Accept": "application/json"},
                )
                summary["live"] = res.status_code == 200
                if res.status_code == 200:
                    sites = res.json() or []
                    if sites:
                        summary["workspace_name"] = sites[0].get("name") or summary["workspace_name"]
                        summary["details"]["cloud_id"] = sites[0].get("id")
                        summary["details"]["site_url"] = sites[0].get("url")
    except Exception as e:
        logger.warning("Live OAuth check failed for %s: %s", provider, e)
        summary["live"] = False

    if not summary["live"] and summary["status"] == "connected":
        summary["status"] = "expired"
    return summary


async def _after_save(org_id: str, provider: str, project_id: Optional[str]):
    applied = []
    webhook = None
    if project_id:
        result = await oauth_token_manager.apply_to_project(org_id, project_id, provider)
        applied = result.get("applied") or []
        if provider == "github":
            db = get_database()
            if db is not None:
                from app.services.integration.oauth_token_manager import _find_project
                project = await _find_project(db, project_id)
                conn = await oauth_token_manager.get_connection(org_id, project_id, "github")
                token = (conn or {}).get("access_token")
                if project and token and (conn or {}).get("mode") != "github_app_repository":
                    webhook = await ensure_github_webhook(
                        token,
                        project.get("repo_owner") or "",
                        project.get("repo_name") or "",
                        org_id,
                        project_id,
                    )
    return {"applied": applied, "webhook": webhook}


# ---------- Status ----------
@router.get("/configuration")
async def get_oauth_configuration(current_user: User = Depends(get_current_user)):
    if not current_user.current_org_id:
        raise HTTPException(status_code=400, detail="User is not part of an organization")
    return {
        "configured": {
            "github": github_app_configured() or bool(settings.GITHUB_CLIENT_ID and settings.GITHUB_CLIENT_SECRET),
            "slack": bool(settings.SLACK_CLIENT_ID and settings.SLACK_CLIENT_SECRET),
            "jira": bool(settings.JIRA_CLIENT_ID and settings.JIRA_CLIENT_SECRET),
        }
    }


@router.get("/status")
async def get_oauth_status(
    live: bool = Query(True),
    project_id: str = Query(...),
    current_user: User = Depends(get_current_user),
):
    org_id = current_user.current_org_id
    if not org_id:
        raise HTTPException(status_code=400, detail="User is not part of an organization")

    await _validate_project_scope(current_user, project_id)
    stored = await oauth_token_manager.list_connections(org_id, project_id)
    connections = {}
    for provider in ("github", "slack", "jira"):
        if live:
            if provider == "jira":
                await oauth_token_manager.refresh_jira_token_if_needed(org_id, project_id)
            conn = await oauth_token_manager.get_connection(org_id, project_id, provider)
            connections[provider] = await _live_check(provider, conn)
        else:
            connections[provider] = stored.get(provider, {"status": "not_connected", "live": False})

    configured = {
        "github": github_app_configured() or bool(settings.GITHUB_CLIENT_ID and settings.GITHUB_CLIENT_SECRET),
        "slack": bool(settings.SLACK_CLIENT_ID and settings.SLACK_CLIENT_SECRET),
        "jira": bool(settings.JIRA_CLIENT_ID and settings.JIRA_CLIENT_SECRET),
    }

    return {
        "status": "success",
        "org_id": org_id,
        "configured": configured,
        "connections": connections,
        "project_id": project_id,
    }


# ---------- Authorize (returns URL; frontend redirects) ----------
@router.get("/github/authorize")
async def get_github_auth_url(
    project_id: str = Query(...),
    return_to: str = Query("project"),
    current_user: User = Depends(get_current_user),
):
    _require_admin_or_manager(current_user)
    if github_app_configured():
        await _validate_project_scope(current_user, project_id)
        db = get_database()
        from app.services.integration.oauth_token_manager import _find_project
        project = await _find_project(db, project_id)
        if not project or not (project.get("repo_owner") and project.get("repo_name")):
            raise HTTPException(status_code=422, detail="Set this project's GitHub owner and repository before connecting")
        state = _encode_state(current_user.current_org_id, current_user.id, "github", project_id, return_to, github_mode="github_app")
        params = {"state": state}
        return {
            "provider": "github",
            "auth_url": f"https://github.com/apps/{quote(settings.GITHUB_APP_SLUG, safe='')}/installations/new?{urlencode(params)}",
            "redirect_uri": settings.github_redirect,
            "repository": f"{project['repo_owner']}/{project['repo_name']}",
            "access": "selected repository only",
        }

    _require_client("github", settings.GITHUB_CLIENT_ID, settings.GITHUB_CLIENT_SECRET)
    await _validate_project_scope(current_user, project_id)
    state = _encode_state(current_user.current_org_id, current_user.id, "github", project_id, return_to)
    params = {
        "client_id": settings.GITHUB_CLIENT_ID,
        "redirect_uri": settings.github_redirect,
        "scope": GITHUB_SCOPES,
        "state": state,
        "allow_signup": "false",
    }
    return {
        "provider": "github",
        "auth_url": f"https://github.com/login/oauth/authorize?{urlencode(params)}",
        "redirect_uri": settings.github_redirect,
        "scopes": GITHUB_SCOPES.split(),
    }


@router.get("/slack/authorize")
async def get_slack_auth_url(
    project_id: str = Query(...),
    return_to: str = Query("project"),
    current_user: User = Depends(get_current_user),
):
    _require_admin_or_manager(current_user)
    _require_client("slack", settings.SLACK_CLIENT_ID, settings.SLACK_CLIENT_SECRET)
    await _validate_project_scope(current_user, project_id)
    state = _encode_state(current_user.current_org_id, current_user.id, "slack", project_id, return_to)
    params = {
        "client_id": settings.SLACK_CLIENT_ID,
        "scope": SLACK_SCOPES,
        "redirect_uri": settings.slack_redirect,
        "state": state,
    }
    return {
        "provider": "slack",
        "auth_url": f"https://slack.com/oauth/v2/authorize?{urlencode(params)}",
        "redirect_uri": settings.slack_redirect,
        "scopes": SLACK_SCOPES.split(","),
    }


@router.get("/jira/authorize")
async def get_jira_auth_url(
    project_id: str = Query(...),
    return_to: str = Query("project"),
    current_user: User = Depends(get_current_user),
):
    _require_admin_or_manager(current_user)
    _require_client("jira", settings.JIRA_CLIENT_ID, settings.JIRA_CLIENT_SECRET)
    await _validate_project_scope(current_user, project_id)
    state = _encode_state(current_user.current_org_id, current_user.id, "jira", project_id, return_to)
    params = {
        "audience": "api.atlassian.com",
        "client_id": settings.JIRA_CLIENT_ID,
        "scope": JIRA_SCOPES,
        "redirect_uri": settings.jira_redirect,
        "state": state,
        "response_type": "code",
        "prompt": "consent",
    }
    return {
        "provider": "jira",
        "auth_url": f"https://auth.atlassian.com/authorize?{urlencode(params, quote_via=quote)}",
        "redirect_uri": settings.jira_redirect,
        "scopes": JIRA_SCOPES.split(),
    }


# ---------- Provider GET callbacks (browser land here) ----------
@router.get("/github/callback")
async def github_callback_redirect(
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None,
    installation_id: Optional[str] = None,
):
    if error:
        return RedirectResponse(_frontend_result_url("error", "github", error, _project_id_from_state(state), _return_to_from_state(state)), status_code=302)
    try:
        result = await _exchange_github_for_state(code=code, state=state, installation_id=installation_id)
        return RedirectResponse(
            _frontend_result_url("success", "github", result["message"], result.get("project_id"), _return_to_from_state(state)),
            status_code=302,
        )
    except HTTPException as e:
        return RedirectResponse(_frontend_result_url("error", "github", str(e.detail), _project_id_from_state(state), _return_to_from_state(state)), status_code=302)
    except Exception as e:
        logger.exception("GitHub OAuth callback failed")
        return RedirectResponse(_frontend_result_url("error", "github", str(e), _project_id_from_state(state), _return_to_from_state(state)), status_code=302)


@router.get("/slack/callback")
async def slack_callback_redirect(code: Optional[str] = None, state: Optional[str] = None, error: Optional[str] = None):
    if error:
        return RedirectResponse(_frontend_result_url("error", "slack", error, _project_id_from_state(state), _return_to_from_state(state)), status_code=302)
    try:
        result = await _exchange_slack(code=code, state=state)
        return RedirectResponse(
            _frontend_result_url("success", "slack", result["message"], result.get("project_id"), _return_to_from_state(state)),
            status_code=302,
        )
    except HTTPException as e:
        return RedirectResponse(_frontend_result_url("error", "slack", str(e.detail), _project_id_from_state(state), _return_to_from_state(state)), status_code=302)
    except Exception as e:
        logger.exception("Slack OAuth callback failed")
        return RedirectResponse(_frontend_result_url("error", "slack", str(e), _project_id_from_state(state), _return_to_from_state(state)), status_code=302)


@router.get("/jira/callback")
async def jira_callback_redirect(code: Optional[str] = None, state: Optional[str] = None, error: Optional[str] = None):
    if error:
        return RedirectResponse(_frontend_result_url("error", "jira", error, _project_id_from_state(state), _return_to_from_state(state)), status_code=302)
    try:
        result = await _exchange_jira(code=code, state=state)
        return RedirectResponse(
            _frontend_result_url("success", "jira", result["message"], result.get("project_id"), _return_to_from_state(state)),
            status_code=302,
        )
    except HTTPException as e:
        return RedirectResponse(_frontend_result_url("error", "jira", str(e.detail), _project_id_from_state(state), _return_to_from_state(state)), status_code=302)
    except Exception as e:
        logger.exception("Jira OAuth callback failed")
        return RedirectResponse(_frontend_result_url("error", "jira", str(e), _project_id_from_state(state), _return_to_from_state(state)), status_code=302)


# ---------- POST callbacks (frontend-hosted redirect URI fallback) ----------
@router.post("/github/callback")
async def handle_github_callback(payload: OAuthCallbackPayload):
    return await _exchange_github_for_state(code=payload.code, state=payload.state, installation_id=payload.installation_id)


@router.post("/slack/callback")
async def handle_slack_callback(payload: OAuthCallbackPayload):
    return await _exchange_slack(code=payload.code, state=payload.state)


@router.post("/jira/callback")
async def handle_jira_callback(payload: OAuthCallbackPayload):
    return await _exchange_jira(code=payload.code, state=payload.state)


@router.delete("/{provider}")
async def disconnect_provider(
    provider: str,
    project_id: str = Query(...),
    current_user: User = Depends(get_current_user),
):
    _require_admin_or_manager(current_user)
    if provider not in ("github", "slack", "jira"):
        raise HTTPException(status_code=400, detail="Unsupported provider")
    await _validate_project_scope(current_user, project_id)
    deleted = await oauth_token_manager.delete_connection(current_user.current_org_id, project_id, provider)
    db = get_database()
    if db is not None:
        from app.services.integration.oauth_token_manager import _find_project
        project = await _find_project(db, project_id)
        cleanup_fields = {
            "github": ("settings.github_access_token", "settings.github_login", "settings.github_repository"),
            "slack": ("settings.slack_bot_token", "settings.slack_channel", "settings.slack_team_id"),
            "jira": ("settings.jira_oauth_access_token", "settings.jira_refresh_token", "settings.jira_cloud_id", "settings.jira_api_token", "settings.jira_email"),
        }[provider]
        if project:
            await db["projects"].update_one(
                {"_id": project["_id"]},
                {"$unset": {field: "" for field in cleanup_fields}},
            )
    return {"status": "success", "deleted": deleted, "provider": provider, "project_id": project_id}


# ---------- Exchanges ----------
async def _exchange_github_app(code: Optional[str], state: Optional[str], installation_id: Optional[str] = None):
    """Verify the GitHub App installation and save a project-specific repo grant."""
    claims = await _validated_callback_state(state, "github")
    org_id = claims["org_id"]
    project_id = claims.get("project_id")
    if not github_app_configured():
        raise HTTPException(status_code=503, detail="GitHub App is not fully configured on the server")
    if not code or not installation_id:
        raise HTTPException(
            status_code=400,
            detail="GitHub did not complete the app installation and user authorization. Enable user authorization during installation in the GitHub App settings.",
        )
    db = get_database()
    from app.services.integration.oauth_token_manager import _find_project
    project = await _find_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    expected_repo = f"{project.get('repo_owner', '').strip()}/{project.get('repo_name', '').strip()}"
    try:
        verified = await authorize_installation(installation_id, code, expected_repo)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    login = verified["login"]
    await oauth_token_manager.save_connection(org_id, project_id, "github", {
        "scope": "repository-scoped: contents:read, pull_requests:read",
        "login": login,
        "workspace_name": login,
        "account_name": verified.get("account_name") or login,
        "installation_id": str(installation_id),
        "repository_id": verified["repository_id"],
        "repository_full_name": verified["repository_full_name"],
        "mode": "github_app_repository",
    })
    extra = await _after_save(org_id, "github", project_id)
    return {
        "status": "success",
        "provider": "github",
        "workspace_name": login,
        "project_id": project_id,
        "message": f"GitHub connected to {verified['repository_full_name']} (selected repository only)",
        **extra,
    }


async def _exchange_github(code: Optional[str], state: Optional[str], installation_id: Optional[str] = None):
    """Legacy GitHub OAuth App fallback, retained for old signed authorization states."""
    claims = await _validated_callback_state(state, "github")
    org_id = claims["org_id"]
    project_id = claims.get("project_id")
    _require_client("github", settings.GITHUB_CLIENT_ID, settings.GITHUB_CLIENT_SECRET)
    if not code:
        raise HTTPException(status_code=400, detail="Missing GitHub authorization code")

    async with httpx.AsyncClient(timeout=20.0) as client:
        token_res = await client.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json"},
            json={
                "client_id": settings.GITHUB_CLIENT_ID,
                "client_secret": settings.GITHUB_CLIENT_SECRET,
                "code": code,
                "redirect_uri": settings.github_redirect,
            },
        )
        token_data = token_res.json()
        access_token = token_data.get("access_token")
        if not access_token:
            raise HTTPException(
                status_code=400,
                detail=f"GitHub token exchange failed: {token_data.get('error_description') or token_data.get('error') or 'provider rejected the authorization code'}",
            )
        user_res = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"Bearer {access_token}", "Accept": "application/vnd.github+json"},
        )
        gh_user = user_res.json() if user_res.status_code == 200 else {}

    login = gh_user.get("login") or "GitHub"
    await oauth_token_manager.save_connection(org_id, project_id, "github", {
        "access_token": access_token,
        "token_type": token_data.get("token_type", "bearer"),
        "scope": token_data.get("scope") or GITHUB_SCOPES,
        "login": login,
        "workspace_name": login,
        "account_name": gh_user.get("name") or login,
        "installation_id": installation_id,
        "mode": "oauth_app",
    })
    extra = await _after_save(org_id, "github", project_id)
    return {
        "status": "success",
        "provider": "github",
        "workspace_name": login,
        "project_id": project_id,
        "message": f"GitHub connected as {login}",
        **extra,
    }


async def _exchange_github_for_state(code: Optional[str], state: Optional[str], installation_id: Optional[str] = None):
    # Route using the signed state so in-flight legacy OAuth sessions continue
    # through their original exchange even after the GitHub App is enabled.
    claims = _decode_state(state) if state else {}
    if claims.get("github_mode") == "github_app":
        return await _exchange_github_app(code, state, installation_id)
    return await _exchange_github(code, state, installation_id)


async def _exchange_slack(code: Optional[str], state: Optional[str]):
    claims = await _validated_callback_state(state, "slack")
    org_id = claims["org_id"]
    project_id = claims.get("project_id")
    _require_client("slack", settings.SLACK_CLIENT_ID, settings.SLACK_CLIENT_SECRET)
    if not code:
        raise HTTPException(status_code=400, detail="Missing Slack authorization code")

    async with httpx.AsyncClient(timeout=20.0) as client:
        res = await client.post(
            "https://slack.com/api/oauth.v2.access",
            data={
                "client_id": settings.SLACK_CLIENT_ID,
                "client_secret": settings.SLACK_CLIENT_SECRET,
                "code": code,
                "redirect_uri": settings.slack_redirect,
            },
        )
        data = res.json()
        if not data.get("ok"):
            raise HTTPException(status_code=400, detail=f"Slack OAuth error: {data.get('error')}")

    team = data.get("team") or {}
    incoming = data.get("incoming_webhook") or {}
    bot_token = data.get("access_token")
    workspace = team.get("name") or "Slack workspace"

    await oauth_token_manager.save_connection(org_id, project_id, "slack", {
        "bot_token": bot_token,
        "access_token": bot_token,
        "team_name": workspace,
        "workspace_name": workspace,
        "team_id": team.get("id"),
        "bot_user_id": data.get("bot_user_id"),
        "scope": data.get("scope") or SLACK_SCOPES,
        "channel": incoming.get("channel"),
        "channel_id": incoming.get("channel_id"),
        "incoming_webhook_url": incoming.get("url"),
    })
    extra = await _after_save(org_id, "slack", project_id)
    return {
        "status": "success",
        "provider": "slack",
        "workspace_name": workspace,
        "project_id": project_id,
        "message": f"Slack connected: {workspace}",
        **extra,
    }


async def _exchange_jira(code: Optional[str], state: Optional[str]):
    claims = await _validated_callback_state(state, "jira")
    org_id = claims["org_id"]
    project_id = claims.get("project_id")
    _require_client("jira", settings.JIRA_CLIENT_ID, settings.JIRA_CLIENT_SECRET)
    if not code:
        raise HTTPException(status_code=400, detail="Missing Jira authorization code")

    async with httpx.AsyncClient(timeout=20.0) as client:
        token_res = await client.post(
            "https://auth.atlassian.com/oauth/token",
            json={
                "grant_type": "authorization_code",
                "client_id": settings.JIRA_CLIENT_ID,
                "client_secret": settings.JIRA_CLIENT_SECRET,
                "code": code,
                "redirect_uri": settings.jira_redirect,
            },
        )
        token_data = token_res.json()
        access_token = token_data.get("access_token")
        if not access_token:
            raise HTTPException(status_code=400, detail=f"Jira token exchange failed: {token_data.get('error_description') or token_data.get('error') or 'provider rejected the authorization code'}")

        sites_res = await client.get(
            "https://api.atlassian.com/oauth/token/accessible-resources",
            headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json"},
        )
        sites = sites_res.json() if sites_res.status_code == 200 else []
        site = sites[0] if isinstance(sites, list) and sites else {}

    site_name = site.get("name") or "Jira Cloud"
    await oauth_token_manager.save_connection(org_id, project_id, "jira", {
        "access_token": access_token,
        "refresh_token": token_data.get("refresh_token"),
        "token_type": token_data.get("token_type", "bearer"),
        "expires_in": token_data.get("expires_in"),
        "access_token_expires_at": datetime.utcnow() + timedelta(seconds=int(token_data["expires_in"])) if token_data.get("expires_in") else None,
        "scope": token_data.get("scope") or JIRA_SCOPES,
        "cloud_id": site.get("id"),
        "site_url": site.get("url"),
        "workspace_name": site_name,
    })
    extra = await _after_save(org_id, "jira", project_id)
    return {
        "status": "success",
        "provider": "jira",
        "workspace_name": site_name,
        "project_id": project_id,
        "message": f"Jira connected: {site_name}",
        **extra,
    }
