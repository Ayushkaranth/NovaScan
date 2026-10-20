import httpx
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime
from bson import ObjectId
from app.core.crypto import encrypt_key, decrypt_key
from app.core.config import settings
from app.core.database import get_database

logger = logging.getLogger(__name__)

SECRET_FIELDS = ("access_token", "refresh_token", "bot_token", "github_access_token")

# In-memory fallback when Mongo is unavailable
_oauth_vault: Dict[str, Dict[str, Any]] = {}


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
    return {
        "status": data.get("status", "connected"),
        "connected_at": data.get("connected_at"),
        "workspace_name": data.get(
            "workspace_name",
            data.get("team_name", data.get("account_name", "Connected")),
        ),
        "scope": data.get("scope", "read-only"),
        "details": {
            k: data.get(k)
            for k in ("team_id", "cloud_id", "login", "site_url", "channel", "channel_id")
            if data.get(k)
        },
    }


class OAuthTokenManager:
    """
    Org-scoped OAuth vault. Tokens are encrypted at rest in MongoDB
    (`oauth_connections`) with an in-memory fallback for local/dev.
    """

    async def save_connection(self, org_id: str, provider: str, data: Dict[str, Any]) -> Dict[str, Any]:
        if not org_id:
            raise ValueError("org_id is required to save an OAuth connection")

        provider = provider.lower()
        payload = _encrypt_payload(data)
        payload["org_id"] = org_id
        payload["provider"] = provider
        payload["connected_at"] = datetime.utcnow()
        payload["status"] = "connected"
        payload["updated_at"] = datetime.utcnow()

        db = get_database()
        if db is not None:
            await db["oauth_connections"].update_one(
                {"org_id": org_id, "provider": provider},
                {"$set": payload},
                upsert=True,
            )
        else:
            _oauth_vault.setdefault(org_id, {})[provider] = payload

        logger.info("OAuth connection saved for provider '%s' under org '%s'", provider, org_id)
        return _public_summary(data | {"status": "connected", "connected_at": payload["connected_at"].isoformat()})

    async def get_connection(self, org_id: str, provider: str) -> Optional[Dict[str, Any]]:
        if not org_id:
            return None
        provider = provider.lower()
        raw = None
        db = get_database()
        if db is not None:
            raw = await db["oauth_connections"].find_one({"org_id": org_id, "provider": provider})
        if not raw:
            raw = _oauth_vault.get(org_id, {}).get(provider)
        if not raw:
            return None
        decrypted = _decrypt_payload(raw)
        decrypted.pop("_id", None)
        return decrypted

    async def list_connections(self, org_id: str) -> Dict[str, Dict[str, Any]]:
        summary: Dict[str, Dict[str, Any]] = {}
        if not org_id:
            return summary

        db = get_database()
        docs: List[Dict[str, Any]] = []
        if db is not None:
            docs = await db["oauth_connections"].find({"org_id": org_id}).to_list(20)
        else:
            docs = list(_oauth_vault.get(org_id, {}).values())

        for data in docs:
            provider = data.get("provider")
            if provider:
                public = _public_summary(data)
                connected_at = data.get("connected_at")
                if hasattr(connected_at, "isoformat"):
                    public["connected_at"] = connected_at.isoformat()
                summary[provider] = public
        return summary

    async def delete_connection(self, org_id: str, provider: str) -> bool:
        provider = provider.lower()
        db = get_database()
        deleted = False
        if db is not None:
            result = await db["oauth_connections"].delete_one({"org_id": org_id, "provider": provider})
            deleted = result.deleted_count > 0
        if org_id in _oauth_vault and provider in _oauth_vault[org_id]:
            del _oauth_vault[org_id][provider]
            deleted = True
        return deleted

    async def apply_to_project(self, org_id: str, project_id: str, provider: Optional[str] = None) -> Dict[str, Any]:
        """Copy decrypted org OAuth credentials into project.settings (without exposing them in the response)."""
        db = get_database()
        if db is None:
            return {"applied": []}

        project = await _find_project(db, project_id)
        if not project:
            return {"applied": [], "error": "project_not_found"}
        if str(project.get("organization_id")) != str(org_id):
            return {"applied": [], "error": "project_access_denied"}

        providers = [provider.lower()] if provider else ["github", "slack", "jira"]
        set_fields: Dict[str, Any] = {}
        applied: List[str] = []

        for p in providers:
            conn = await self.get_connection(org_id, p)
            if not conn or conn.get("status") != "connected":
                continue
            if p == "github":
                token = conn.get("access_token") or conn.get("github_access_token")
                if token:
                    set_fields["settings.github_login"] = conn.get("login")
                    applied.append("github")
            elif p == "slack":
                token = conn.get("bot_token") or conn.get("access_token")
                if token:
                    if conn.get("channel") or conn.get("channel_id"):
                        set_fields["settings.slack_channel"] = conn.get("channel_id") or conn.get("channel")
                    set_fields["settings.slack_team_id"] = conn.get("team_id")
                    applied.append("slack")
            elif p == "jira":
                token = conn.get("access_token")
                if token:
                    set_fields["settings.jira_cloud_id"] = conn.get("cloud_id")
                    if conn.get("site_url"):
                        set_fields["settings.jira_url"] = conn.get("site_url")
                    applied.append("jira")

        if set_fields:
            query = {"_id": project["_id"]}
            await db["projects"].update_one(query, {"$set": set_fields})

        return {"applied": applied, "project_id": str(project["_id"])}

    async def credentials_for_org(self, org_id: str) -> Dict[str, Any]:
        """Decrypted credentials used by webhooks / project creation."""
        out: Dict[str, Any] = {}
        gh = await self.get_connection(org_id, "github")
        if gh:
            out["github_token"] = gh.get("access_token") or gh.get("github_access_token")
            out["github_login"] = gh.get("login")
        slack = await self.get_connection(org_id, "slack")
        if slack:
            out["slack_token"] = slack.get("bot_token") or slack.get("access_token")
            out["slack_channel"] = slack.get("channel_id") or slack.get("channel")
            out["slack_team_id"] = slack.get("team_id")
        jira = await self.get_connection(org_id, "jira")
        if jira:
            out["jira_oauth_token"] = jira.get("access_token")
            out["jira_refresh_token"] = jira.get("refresh_token")
            out["jira_cloud_id"] = jira.get("cloud_id")
            out["jira_url"] = jira.get("site_url")
        return out

    async def refresh_jira_token_if_needed(self, org_id: str) -> Optional[str]:
        conn = await self.get_connection(org_id, "jira")
        if not conn or not conn.get("refresh_token"):
            return conn.get("access_token") if conn else None

        if not (settings.JIRA_CLIENT_ID and settings.JIRA_CLIENT_SECRET):
            return conn.get("access_token")

        payload = {
            "grant_type": "refresh_token",
            "client_id": settings.JIRA_CLIENT_ID,
            "client_secret": settings.JIRA_CLIENT_SECRET,
            "refresh_token": conn["refresh_token"],
        }
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post("https://auth.atlassian.com/oauth/token", json=payload)
                if res.status_code != 200:
                    logger.error("Failed to refresh Jira OAuth token: %s", res.text)
                    return conn.get("access_token")
                tokens = res.json()
                conn["access_token"] = tokens.get("access_token")
                if tokens.get("refresh_token"):
                    conn["refresh_token"] = tokens["refresh_token"]
                await self.save_connection(org_id, "jira", conn)
                return tokens.get("access_token")
        except Exception as e:
            logger.error("Exception refreshing Jira OAuth token: %s", e)
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
