from slack_sdk import WebClient
import logging

logger = logging.getLogger(__name__)

async def broadcast_team_assignment(token: str, channel: str, org_name: str, manager_id: str, employee_ids: list):
    """Sends a public announcement to the Slack channel about the new team."""
    client = WebClient(token=token)
    
    # We use a simple message format as requested
    employee_count = len(employee_ids)
    msg_text = f"🏗️ *New Team Assignment for {org_name}*"
    
    blocks = [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn", 
                "text": f"{msg_text}\n\n*Manager:* User_{manager_id[:5]} has joined the team!\n*Team:* {employee_count} employees have been assigned to this project."
            }
        },
        {
            "type": "context",
            "elements": [{"type": "mrkdwn", "text": "Check your NovaScan Dashboard for full details."}]
        }
    ]

    try:
        client.chat_postMessage(channel=channel, text=msg_text, blocks=blocks)
    except Exception as e:
        logger.error(f"❌ Slack Broadcast Error: {e}")