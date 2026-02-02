from app.services.delivery.slack_bot import send_alert as send_slack
from app.services.delivery.jira_bot import post_jira_comment

async def dispatch_notifications(org_id: str, analysis: dict, event: dict):
    """
    Decides where to send alerts based on Risk Score.
    """
    risk_score = analysis.get("risk_score", 0)

    # Rule 1: Always send Slack DM for any risk
    if analysis["is_risky"]:
        await send_slack(org_id, analysis, event["summary"])

    # Rule 2: If Risk is HIGH (>7) and it's related to a Jira Ticket, comment on it
    if risk_score > 7 and event["source"] == "jira":
        await post_jira_comment(
            org_id, 
            event["source_id"], # The Ticket Key
            analysis["reason"]
        )

    # Rule 3: If it's a GitHub PR but linked to a Jira ticket (via Graph), alert Jira too
    # (Future implementation using Graph Manager)