import httpx
import base64
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

async def create_jira_issue(
    summary: str,
    description: str,
    jira_url: Optional[str] = None,
    jira_email: Optional[str] = None,
    jira_token: Optional[str] = None,
    project_key: Optional[str] = "KAN"
) -> Optional[Dict[str, Any]]:
    """
    Creates an issue ticket in Jira via Jira REST API v3 using provided credentials.
    """
    if not (jira_url and jira_email and jira_token):
        logger.info("ℹ️ Jira credentials incomplete. Skipping Jira ticket creation.")
        return {"status": "skipped", "reason": "Credentials not provided"}

    clean_url = jira_url.rstrip("/")
    api_endpoint = f"{clean_url}/rest/api/3/issue"
    
    auth_str = f"{jira_email}:{jira_token}"
    b64_auth = base64.b64encode(auth_str.encode()).decode()

    headers = {
        "Authorization": f"Basic {b64_auth}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }

    payload = {
        "fields": {
            "project": {"key": project_key},
            "summary": summary[:250],
            "description": {
                "type": "doc",
                "version": 1,
                "content": [
                    {
                        "type": "paragraph",
                        "content": [{"type": "text", "text": description}]
                    }
                ]
            },
            "issuetype": {"name": "Task"}
        }
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(api_endpoint, headers=headers, json=payload)
            if response.status_code in [200, 201]:
                data = response.json()
                logger.info(f"✅ Jira ticket created: {data.get('key')}")
                return data
            else:
                logger.error(f"❌ Jira API error {response.status_code}: {response.text}")
                return None
    except Exception as e:
        logger.error(f"❌ Exception connecting to Jira: {e}")
        return None
