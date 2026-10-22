import httpx
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from bson import ObjectId
from app.core.crypto import encrypt_key, decrypt_key
from app.core.config import settings
from app.core.database import get_database

logger = logging.getLogger(__name__)

SECRET_FIELDS = ("access_token", "refresh_token", "bot_token", "github_access_token")

# In-memory fallback for local development. Connections are separated by org,
# project, and provider just like the persistent records.
_oauth_vault: Dict[str, Dict[str, Dict[str, Dict[str, Any]]]] = {}


def _encrypt_payload(data: Dict[str, Any]) -> Dict[str, Any]:
    encrypted = data.copy()
    for field in SECRET_FIELDS:
        if encrypted.get(field):
            encrypted[field] = encrypt_key(str(encrypted[field]))
    return encrypted


def _decrypt_payload(data: Dict[str, Any]) -> Dict[str, Any]:
    decrypted = data.copy()
    for field in SECRET_FIELDS:
        if decrypted.get(field):
            decrypted[field] = decrypt_key(str(decrypted[field]))
    return decrypted


def _public_summary(data: Dict[str, Any]) -> Dict[str, Any]:
    connected_at = data.get("connected_at")
    return {
        "status": data.get("status", "connected"),
        "connected_at": connected_at.isoformat() if hasattr(connected_at, "isoformat") else connected_at,
        "workspace_name": data.get(
            "workspace_name",
            data.get("team_name", data.get("account_name", "Connected")),
        ),
        "scope": data.get("scope", "read-only"),
        "details": {
            key: data.get(key)
            for key in ("team_id", "cloud_id", "login", "site_url", "channel", "channel_id", "repository", "repository_id", "workspace_id", "parent_page_id", "parent_page_name", "parent_page_url")
            if data.get(key)
        } | ({"repository": data.get("repository_full_name"), "repository_id": data.get("repository_id")} if data.get("repository_full_name") else {}),
    }


class OAuthTokenManager:
    """Project-scoped encrypted OAuth token vault."""

    async def save_connection(self, org_id: str, project_id: str, provider: str, data: Dict[str, Any]) -> Dict[str, Any]:
        if not org_id or not project_id:
            raise ValueError("org_id and project_id are required to save an OAuth connection")

        provider = provider.lower()
        payload = _encrypt_payload(data)
        now = datetime.utcnow()
        payload.update({
            "org_id": str(org_id),
            "project_id": str(project_id),
            "provider": provider,
            "connected_at": now,
            "status": "connected",
            "updated_at": now,
        })

        db = get_database()
        if db is not None:
            update = {"$set": payload}
            if provider == "github" and payload.get("mode") == "github_app_repository":
                # Remove any previously stored broad OAuth token when upgrading
                # this project connection to a GitHub App installation.
                update["$unset"] = {"access_token": "", "github_access_token": "", "token_type": ""}
            # A reconnect through the legacy OAuth App clears dormant GitHub App metadata.
            if provider == "github" and payload.get("mode") == "oauth_app":
                update["$unset"] = {"repository_id": "", "repository_full_name": ""}
            await db["oauth_connections"].update_one(
                {"org_id": str(org_id), "project_id": str(project_id), "provider": provider},
                update,
                upsert=True,
            )
        else:
            _oauth_vault.setdefault(str(org_id), {}).setdefault(str(project_id), {})[provider] = payload

        logger.info("OAuth connection saved for provider '%s' on project '%s'", provider, project_id)
        return _public_summary(payload)

    async def get_connection(self, org_id: str, project_id: str, provider: str) -> Optional[Dict[str, Any]]:
        if not org_id or not project_id:
            return None
        org_id, project_id, provider = str(org_id), str(project_id), provider.lower()
        raw = None
        db = get_database()
        if db is not None:
            raw = await db["oauth_connections"].find_one({
                "org_id": org_id,
                "project_id": project_id,
                "provider": provider,
            })
        if not raw:
            raw = _oauth_vault.get(org_id, {}).get(project_id, {}).get(provider)
        if not raw:
            return None
        decrypted = _decrypt_payload(raw)
        decrypted.pop("_id", None)
        return decrypted

    async def list_connections(self, org_id: str, project_id: str) -> Dict[str, Dict[str, Any]]:
        if not org_id or not project_id:
            return {}
        org_id, project_id = str(org_id), str(project_id)
        db = get_database()
        if db is not None:
            docs: List[Dict[str, Any]] = await db["oauth_connections"].find({
                "org_id": org_id,
                "project_id": project_id,
            }).to_list(20)
        else:
            docs = list(_oauth_vault.get(org_id, {}).get(project_id, {}).values())
        return {
            data["provider"]: _public_summary(data)
            for data in docs
            if data.get("provider")
        }

    async def delete_connection(self, org_id: str, project_id: str, provider: str) -> bool:
        org_id, project_id, provider = str(org_id), str(project_id), provider.lower()
        db = get_database()
        deleted = False
        if db is not None:
            result = await db["oauth_connections"].delete_one({
                "org_id": org_id,
                "project_id": project_id,
                "provider": provider,
            })
            deleted = result.deleted_count > 0
        project_vault = _oauth_vault.get(org_id, {}).get(project_id, {})
        if provider in project_vault:
            del project_vault[provider]
            deleted = True
        return deleted

    async def delete_project_connections(self, org_id: str, project_id: str) -> None:
        org_id, project_id = str(org_id), str(project_id)
        db = get_database()
        if db is not None:
            await db["oauth_connections"].delete_many({"org_id": org_id, "project_id": project_id})
        _oauth_vault.get(org_id, {}).pop(project_id, None)

    async def apply_to_project(self, org_id: str, project_id: str, provider: Optional[str] = None) -> Dict[str, Any]:
        """Copy non-secret connection metadata to one project only."""
        db = get_database()
        if db is None:
            return {"applied": []}
        project = await _find_project(db, project_id)
        if not project:
            return {"applied": [], "error": "project_not_found"}
        if str(project.get("organization_id")) != str(org_id):
            return {"applied": [], "error": "project_access_denied"}

        provider_names = [provider.lower()] if provider else ["github", "slack", "jira", "notion"]
        set_fields: Dict[str, Any] = {}
        applied: List[str] = []
        for name in provider_names:
            conn = await self.get_connection(org_id, project_id, name)
            if not conn or conn.get("status") != "connected":
                continue
            if name == "github" and conn.get("mode") == "github_app_repository" and conn.get("installation_id") and conn.get("repository_id"):
                set_fields["settings.github_repository"] = conn.get("repository_full_name")
                set_fields["settings.github_login"] = conn.get("login")
                applied.append(name)
            if name == "github" and (conn.get("access_token") or conn.get("github_access_token")):
                set_fields["settings.github_login"] = conn.get("login")
                applied.append(name)
            elif name == "slack" and (conn.get("bot_token") or conn.get("access_token")):
                if conn.get("channel") or conn.get("channel_id"):
                    set_fields["settings.slack_channel"] = conn.get("channel_id") or conn.get("channel")
                set_fields["settings.slack_team_id"] = conn.get("team_id")
                applied.append(name)
            elif name == "jira" and conn.get("access_token"):
                set_fields["settings.jira_cloud_id"] = conn.get("cloud_id")
                if conn.get("site_url"):
                    set_fields["settings.jira_url"] = conn.get("site_url")
                applied.append(name)
            elif name == "notion" and conn.get("access_token") and conn.get("parent_page_id"):
                set_fields["settings.notion_parent_page_id"] = conn.get("parent_page_id")
                applied.append(name)

        if set_fields:
            await db["projects"].update_one({"_id": project["_id"]}, {"$set": set_fields})
        return {"applied": applied, "project_id": str(project["_id"])}

    async def credentials_for_project(self, org_id: str, project_id: str) -> Dict[str, Any]:
        """Return decrypted credentials authorized for this exact project."""
        out: Dict[str, Any] = {}
        github = await self.get_connection(org_id, project_id, "github")
        if github:
            if github.get("mode") == "github_app_repository" and github.get("installation_id") and github.get("repository_id"):
                from app.services.integration.github_app import create_repository_token
                out["github_token"] = await create_repository_token(github["installation_id"], github["repository_id"])
            else:
                out["github_token"] = github.get("access_token") or github.get("github_access_token")
            out["github_login"] = github.get("login")
        slack = await self.get_connection(org_id, project_id, "slack")
        if slack:
            out["slack_token"] = slack.get("bot_token") or slack.get("access_token")
            out["slack_channel"] = slack.get("channel_id") or slack.get("channel")
            out["slack_team_id"] = slack.get("team_id")
        await self.refresh_jira_token_if_needed(org_id, project_id)
        jira = await self.get_connection(org_id, project_id, "jira")
        if jira:
            out["jira_oauth_token"] = jira.get("access_token")
            out["jira_refresh_token"] = jira.get("refresh_token")
            out["jira_cloud_id"] = jira.get("cloud_id")
            out["jira_url"] = jira.get("site_url")
        await self.refresh_notion_token_if_needed(org_id, project_id)
        notion = await self.get_connection(org_id, project_id, "notion")
        if notion:
            out["notion_token"] = notion.get("access_token")
            out["notion_refresh_token"] = notion.get("refresh_token")
            out["notion_parent_page_id"] = notion.get("parent_page_id")
            out["notion_parent_page_name"] = notion.get("parent_page_name")
            out["notion_parent_page_url"] = notion.get("parent_page_url")
            out["notion_workspace_id"] = notion.get("workspace_id")
        return out

    async def refresh_jira_token_if_needed(self, org_id: str, project_id: str) -> Optional[str]:
        conn = await self.get_connection(org_id, project_id, "jira")
        if not conn or not conn.get("refresh_token"):
            return conn.get("access_token") if conn else None
        expires_at = conn.get("access_token_expires_at")
        if expires_at:
            if isinstance(expires_at, str):
                try:
                    expires_at = datetime.fromisoformat(expires_at)
                except ValueError:
                    expires_at = None
            if expires_at and expires_at > datetime.utcnow() + timedelta(seconds=60):
                return conn.get("access_token")
        if not (settings.JIRA_CLIENT_ID and settings.JIRA_CLIENT_SECRET):
            return conn.get("access_token")

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post("https://auth.atlassian.com/oauth/token", json={
                    "grant_type": "refresh_token",
                    "client_id": settings.JIRA_CLIENT_ID,
                    "client_secret": settings.JIRA_CLIENT_SECRET,
                    "refresh_token": conn["refresh_token"],
                })
                if res.status_code != 200:
                    logger.error("Failed to refresh Jira OAuth token: %s", res.text)
                    return conn.get("access_token")
                tokens = res.json()
                conn["access_token"] = tokens.get("access_token")
                if tokens.get("refresh_token"):
                    conn["refresh_token"] = tokens["refresh_token"]
                expires_in = tokens.get("expires_in")
                if expires_in:
                    conn["expires_in"] = expires_in
                    conn["access_token_expires_at"] = datetime.utcnow() + timedelta(seconds=int(expires_in))
                await self.save_connection(org_id, project_id, "jira", conn)
                return tokens.get("access_token")
        except Exception as exc:
            logger.error("Exception refreshing Jira OAuth token: %s", exc)
            return conn.get("access_token")

    async def refresh_notion_token_if_needed(self, org_id: str, project_id: str) -> Optional[str]:
        conn = await self.get_connection(org_id, project_id, "notion")
        if not conn or not conn.get("refresh_token"):
            return conn.get("access_token") if conn else None
        expires_at = conn.get("access_token_expires_at")
        if not expires_at:
            return conn.get("access_token")
        if isinstance(expires_at, str):
            try:
                expires_at = datetime.fromisoformat(expires_at)
            except ValueError:
                expires_at = None
        if expires_at and expires_at > datetime.utcnow() + timedelta(seconds=60):
            return conn.get("access_token")
        if not (settings.NOTION_CLIENT_ID and settings.NOTION_CLIENT_SECRET):
            return conn.get("access_token")

        try:
            import base64
            basic = base64.b64encode(f"{settings.NOTION_CLIENT_ID}:{settings.NOTION_CLIENT_SECRET}".encode()).decode()
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(
                    "https://api.notion.com/v1/oauth/token",
                    headers={"Authorization": f"Basic {basic}", "Content-Type": "application/json", "Accept": "application/json"},
                    json={"grant_type": "refresh_token", "refresh_token": conn["refresh_token"]},
                )
            if response.status_code != 200:
                logger.warning("Failed to refresh Notion OAuth token (%s)", response.status_code)
                return conn.get("access_token")
            tokens = response.json()
            conn["access_token"] = tokens.get("access_token")
            conn["refresh_token"] = tokens.get("refresh_token") or conn["refresh_token"]
            expires_in = tokens.get("expires_in")
            if expires_in:
                conn["access_token_expires_at"] = datetime.utcnow() + timedelta(seconds=int(expires_in))
            await self.save_connection(org_id, project_id, "notion", conn)
            return conn.get("access_token")
        except Exception as exc:
            logger.warning("Exception refreshing Notion OAuth token: %s", exc)
            return conn.get("access_token")


async def _find_project(db, project_id: str) -> Optional[Dict[str, Any]]:
    if not project_id:
        return None
    doc = await db["projects"].find_one({"_id": project_id})
    if doc:
        return doc
    if ObjectId.is_valid(project_id):
        return await db["projects"].find_one({"_id": ObjectId(project_id)})
    return None


oauth_token_manager = OAuthTokenManager()
