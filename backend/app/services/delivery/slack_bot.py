import httpx
from app.core.database import get_database

async def send_alert(org_id: str, analysis: dict, event_summary: str):
    """
    Sends a formatted alert to the Organization's configured Slack Channel.
    """
    if not analysis["is_risky"]:
        return # Don't spam if it's safe

    db = get_database()

    # 1. Find the API Keys for this Org
    integration = await db["integrations"].find_one({
        "org_id": org_id, 
        "platform": "slack"
    })
    
    if not integration:
        print(f"⚠️ No Slack integration found for Org {org_id}")
        return

    # 2. Get the specific channel to alert (stored in config)
    # Defaulting to general if not set, but in a real app, user sets this.
    channel_id = integration.get("config", {}).get("slack_channel_id")
    bot_token = integration["credentials"]["bot_token"]

    if not channel_id:
        print("⚠️ No channel configured for alerts.")
        return

    # 3. Construct the Message (Block Kit)
    message = {
        "channel": channel_id,
        "text": f"🚨 Risk Detected: {analysis['reason']}",
        "blocks": [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": "🚨 Loop AI Risk Alert",
                    "emoji": True
                }
            },
            {
                "type": "section",
                "fields": [
                    {"type": "mrkdwn", "text": f"*Event:*\n{event_summary}"},
                    {"type": "mrkdwn", "text": f"*Risk Score:*\n{analysis['risk_score']}/10"}
                ]
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*Analysis:*\n{analysis['reason']}\n\n*Suggestion:*\n{analysis['action_needed']}"
                }
            },
            {
                "type": "context",
                "elements": [{"type": "mrkdwn", "text": "🤖 Powered by Loop AI Core"}]
            }
        ]
    }

    # 4. Send to Slack
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://slack.com/api/chat.postMessage",
            headers={"Authorization": f"Bearer {bot_token}"},
            json=message
        )
        
        if resp.json().get("ok"):
            print("✅ Alert sent to Slack!")
        else:
            print(f"❌ Failed to send alert: {resp.text}")