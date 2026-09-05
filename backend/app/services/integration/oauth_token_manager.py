import httpx
import logging
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from app.core.crypto import encrypt_key, decrypt_key
from app.core.config import settings

logger = logging.getLogger(__name__)

# In-memory tenant OAuth Vault (simulates persistent encrypted store per organization)
_oauth_vault: Dict[str, Dict[str, Any]] = {}

class OAuthTokenManager:
    """
    Enterprise Token Vault Manager.
    Encrypts OAuth access tokens and refresh tokens at rest with AES-256 (crypto.py).
    """

    def save_connection(self, org_id: str, provider: str, data: Dict[str, Any]):
        if org_id not in _oauth_vault:
            _oauth_vault[org_id] = {}
        
        # Encrypt sensitive tokens
        encrypted_data = data.copy()
        if "access_token" in encrypted_data:
            encrypted_data["access_token"] = encrypt_key(encrypted_data["access_token"])
        if "refresh_token" in encrypted_data:
            encrypted_data["refresh_token"] = encrypt_key(encrypted_data["refresh_token"])
        if "bot_token" in encrypted_data:
            encrypted_data["bot_token"] = encrypt_key(encrypted_data["bot_token"])

        encrypted_data["connected_at"] = datetime.utcnow().isoformat()
        encrypted_data["status"] = "connected"

        _oauth_vault[org_id][provider.lower()] = encrypted_data
        logger.info(f"✅ OAuth connection saved for provider '{provider}' under Org '{org_id}'")

    def get_connection(self, org_id: str, provider: str) -> Optional[Dict[str, Any]]:
        org_store = _oauth_vault.get(org_id, {})
        conn = org_store.get(provider.lower())
        if not conn:
            return None
        
        # Decrypt tokens in-memory for ephemeral HTTP request execution
        decrypted = conn.copy()
        if "access_token" in decrypted:
            decrypted["access_token"] = decrypt_key(decrypted["access_token"])
        if "refresh_token" in decrypted:
            decrypted["refresh_token"] = decrypt_key(decrypted["refresh_token"])
        if "bot_token" in decrypted:
            decrypted["bot_token"] = decrypt_key(decrypted["bot_token"])

        return decrypted

    def list_connections(self, org_id: str) -> Dict[str, Dict[str, Any]]:
        org_store = _oauth_vault.get(org_id, {})
        summary = {}
        for provider, data in org_store.items():
            summary[provider] = {
                "status": data.get("status", "connected"),
                "connected_at": data.get("connected_at"),
                "workspace_name": data.get("workspace_name", data.get("team_name", data.get("account_name", "Connected"))),
                "scope": data.get("scope", "read-only")
            }
        return summary

    async def refresh_jira_token_if_needed(self, org_id: str) -> Optional[str]:
        """
        Silently refreshes Atlassian Jira 3LO access token using stored refresh_token.
        """
        conn = self.get_connection(org_id, "jira")
        if not conn or not conn.get("refresh_token"):
            return None

        refresh_token = conn["refresh_token"]
        payload = {
            "grant_type": "refresh_token",
            "client_id": settings.JIRA_CLIENT_ID,
            "client_secret": settings.JIRA_CLIENT_SECRET,
            "refresh_token": refresh_token
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post("https://auth.atlassian.com/oauth/token", json=payload)
                if res.status_code == 200:
                    tokens = res.json()
                    conn["access_token"] = tokens.get("access_token")
                    if "refresh_token" in tokens:
                        conn["refresh_token"] = tokens.get("refresh_token")
                    self.save_connection(org_id, "jira", conn)
                    return tokens.get("access_token")
                logger.error(f"Failed to refresh Jira OAuth token: {res.text}")
                return None
        except Exception as e:
            logger.error(f"Exception refreshing Jira OAuth token: {e}")
            return None

oauth_token_manager = OAuthTokenManager()
