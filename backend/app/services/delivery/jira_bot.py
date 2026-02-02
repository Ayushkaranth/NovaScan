import httpx
import base64
from app.core.database import get_database

async def post_jira_comment(org_id: str, ticket_key: str, message: str):
    db = get_database()

    # 1. Get Credentials
    integration = await db["integrations"].find_one({
        "org_id": org_id, "platform": "jira"
    })
    if not integration:
        return

    creds = integration["credentials"]
    domain = creds["domain"].replace("https://", "").replace("/", "")
    email = creds["email"]
    api_token = creds["api_token"]

    # 2. Construct Auth Header (Basic Auth)
    auth_str = f"{email}:{api_token}"
    b64_auth = base64.b64encode(auth_str.encode()).decode()

    # 3. Call Jira API
    url = f"https://{domain}/rest/api/3/issue/{ticket_key}/comment"

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            url,
            headers={
                "Authorization": f"Basic {b64_auth}",
                "Content-Type": "application/json"
            },
            json={
                "body": {
                    "type": "doc",
                    "version": 1,
                    "content": [{
                        "type": "paragraph",
                        "content": [{"type": "text", "text": f"🚨 Loop AI Risk Alert: {message}"}]
                    }]
                }
            }
        )
        if resp.status_code == 201:
            print(f"✅ Commented on Jira Ticket {ticket_key}")
        else:
            print(f"❌ Failed to comment on Jira: {resp.text}")