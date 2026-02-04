import httpx
from app.core.database import get_database

async def send_alert(org_id: str, analysis: dict, event_summary: str, pr_url: str, notion_url: str = None):
    db = get_database()
    integration = await db["integrations"].find_one({"org_id": org_id, "platform": "slack"})
    if not integration: return

    channel_id = integration.get("config", {}).get("slack_channel_id")
    bot_token = integration["credentials"]["bot_token"]

    blocks = [
        {
            "type": "header",
            "text": {"type": "plain_text", "text": "🚨 NovaScan Risk Alert"}
        },
        {
            "type": "section",
            "text": {"type": "mrkdwn", "text": f"*Analysis:*\n{analysis['reason']}"}
        },
        {
            "type": "actions",
            "elements": []
        }
    ]

    # Add the automated Notion Report link
    if notion_url:
        blocks[2]["elements"].append({
            "type": "button",
            "text": {"type": "plain_text", "text": "📄 View Notion Report"},
            "url": notion_url,
            "style": "primary"
        })

    # Add GitHub link
    blocks[2]["elements"].append({
        "type": "button",
        "text": {"type": "plain_text", "text": "View PR"},
        "url": pr_url
    })

    message = {"channel": channel_id, "blocks": blocks}

    async with httpx.AsyncClient() as client:
        await client.post(
            "https://slack.com/api/chat.postMessage",
            headers={"Authorization": f"Bearer {bot_token}"},
            json=message
        )