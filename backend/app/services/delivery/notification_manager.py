from app.services.delivery.slack_bot import send_alert as send_slack
from app.services.delivery.jira_bot import post_jira_comment
from app.services.delivery.notion_bot import notion_bot

async def dispatch_notifications(org_id: str, analysis: dict, event: dict):
    risk_score = analysis.get("risk_score", 0)
    is_risky = analysis.get("is_risky", False)
    pr_url = event.get("url", "#")
    notion_url = None

    if not is_risky:
        return

    # Step 1: Always Create Notion Documentation
    notion_res = await notion_bot.create_incident_report(
        analysis=analysis,
        event_summary=event["summary"],
        pr_url=pr_url
    )
    if notion_res:
        notion_url = notion_res.get("url")

    # Step 2: Send Slack Alert with the newly created Notion link
    await send_slack(org_id, analysis, event["summary"], pr_url, notion_url)

    # Step 3: Jira Logic
    if risk_score > 7 and event.get("source") == "jira":
        await post_jira_comment(
            org_id, 
            event["source_id"],
            f"⚠️ NovaScan High Risk Alert ({risk_score}/10): {analysis['reason']}"
        )