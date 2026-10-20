import logging
from typing import Optional, Dict, Any
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)


def webhook_target_url(org_id: str, project_id: str) -> str:
    base = (settings.BASE_URL or "http://localhost:8000").rstrip("/")
    return f"{base}/api/v1/webhooks/github/{org_id}/{project_id}"


async def ensure_github_webhook(
    token: str,
    repo_owner: str,
    repo_name: str,
    org_id: str,
    project_id: str,
) -> Dict[str, Any]:
    """Idempotently install a GitHub webhook pointing at NovaScan."""
    if not (token and repo_owner and repo_name and org_id and project_id):
        return {"status": "skipped", "reason": "missing_fields"}

    target = webhook_target_url(org_id, project_id)
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    hooks_url = f"https://api.github.com/repos/{repo_owner.strip()}/{repo_name.strip()}/hooks"

    async with httpx.AsyncClient(timeout=20.0) as client:
        try:
            existing = await client.get(hooks_url, headers=headers)
            if existing.status_code == 200:
                for hook in existing.json():
                    if hook.get("config", {}).get("url") == target:
                        return {"status": "exists", "hook_id": hook.get("id"), "url": target}

            payload = {
                "name": "web",
                "active": True,
                "events": ["pull_request", "push"],
                "config": {
                    "url": target,
                    "content_type": "json",
                    "insecure_ssl": "0",
                },
            }
            created = await client.post(hooks_url, headers=headers, json=payload)
            if created.status_code in (200, 201):
                data = created.json()
                return {"status": "created", "hook_id": data.get("id"), "url": target}
            logger.warning("GitHub webhook create failed (%s): %s", created.status_code, created.text)
            return {"status": "failed", "http_status": created.status_code, "detail": created.text[:300]}
        except Exception as e:
            logger.exception("GitHub webhook install exception: %s", e)
            return {"status": "failed", "detail": str(e)}
