from fastapi import APIRouter, Request, BackgroundTasks
import json
import os
import logging
import httpx
from datetime import datetime
from dotenv import load_dotenv
from bson import ObjectId

from app.services.intelligence.llm_engine import analyze_code
from app.services.delivery.notion_bot import notion_bot  # Fixed Import
from app.core.database import get_database 
from app.services.delivery.email_service import send_manager_to_employee_alert
from app.core.config import settings
from slack_sdk import WebClient

# Load Environment Variables
load_dotenv()

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# --- HELPER: GET CREDENTIALS ---
async def get_org_credentials(org_id: str):
    try:
        db = get_database()
        query = {
            "$or": [
                {"_id": org_id},
                {"_id": ObjectId(org_id) if ObjectId.is_valid(org_id) else None}
            ]
        }
        org_data = await db["organizations"].find_one(query)
        
        if not org_data:
            logger.warning(f"⚠️ No organization found for ID: {org_id}")
            return None
            
        settings = org_data.get("settings", {})
        return {
            "github_token": settings.get("github_access_token"),
            "slack_token": settings.get("slack_bot_token"),
            "slack_channel": settings.get("slack_channel"),
            "jira_url": settings.get("jira_url"),
            "jira_email": settings.get("jira_email"),
            "jira_token": settings.get("jira_api_token"),
            "jira_project_key": settings.get("jira_project_key", "SCRUM")
        }
    except Exception as e:
        logger.error(f"❌ Error fetching org credentials: {e}")
        return None

# --- HELPER: SAVE SCAN TO DB ---
async def save_scan_to_db(org_id, repo, pr_id, risk_data, pr_url):
    try:
        db = get_database()
        collection = db.get_collection("scans")
        scan_record = {
            "org_id": str(org_id),
            "repo": repo,
            "pr_id": pr_id,
            "risk_score": risk_data.get("risk_score", 0),
            "is_risky": risk_data.get("is_risky", False),
            "summary": risk_data.get("reason", "No summary"),
            "timestamp": datetime.utcnow(),
            "pr_url": pr_url
        }
        await collection.insert_one(scan_record)
        logger.info("💾 Scan result saved to MongoDB")
    except Exception as e:
        logger.error(f"❌ DB Save Error: {e}")

# --- WEBHOOK HANDLER ---
@router.post("/github/{org_id}")
async def handle_github_webhook(org_id: str, request: Request):
    repo_name = "Unknown Repo"
    pr_number = 0
    pr_url = ""
    risk_analysis = {"risk_score": 0, "reason": "No analysis", "is_risky": False}

    try:
        body_content = await request.body()
        if not body_content:
            return {"status": "skipped", "message": "Empty body"}
        
        payload = await request.json()
        event_type = request.headers.get("X-GitHub-Event")

        if event_type == "pull_request" and payload.get("action") in ["opened", "synchronize", "reopened"]:
            creds = await get_org_credentials(org_id)
            if not creds:
                return {"status": "error", "message": "Organization not found."}

            pr = payload.get("pull_request")
            pr_number = pr.get("number")
            repo_name = payload.get("repository", {}).get("full_name")
            title = pr.get("title")
            body = pr.get("body", "") or ""
            diff_url = pr.get("diff_url")
            pr_url = pr.get("html_url")

            logger.info(f"✅ Processing PR #{pr_number} for Org: {org_id}")

            # Get Diff
            diff_text = ""
            if creds.get("github_token"):
                async with httpx.AsyncClient() as client:
                    resp = await client.get(diff_url, headers={"Authorization": f"token {creds['github_token']}"}, follow_redirects=True)
                    if resp.status_code == 200:
                        diff_text = resp.text

            # AI Analysis
            risk_analysis = await analyze_code(diff_text, {"title": title, "body": body})
            
            # Save to DB
            await save_scan_to_db(org_id, repo_name, pr_number, risk_analysis, pr_url)

            # Trigger Dispatch
            event_data = {
                "summary": f"PR #{pr_number} in {repo_name}",
                "title": title,
                "url": pr_url,
                "repo": repo_name,
                "pr_id": pr_number
            }
            await dispatch_notifications(creds, risk_analysis, event_data, org_id)

        return {"status": "processed"}

    except Exception as e:
        logger.error(f"❌ Error in webhook: {e}")
        return {"status": "error", "message": str(e)}

# --- ALERT DISPATCHER ---
# async def dispatch_notifications(creds, risk_data, event_data):
    # """
    # Handles the logic for where to send alerts based on the risk score.
    # """
    # notion_url = None

    # # Step 1: Always Create Notion Documentation (Persistence)
    # # We do this first so we can include the link in Slack
    # notion_res = await notion_bot.create_incident_report(
    #     analysis=risk_data,
    #     event_summary=event_data["summary"],
    #     pr_url=event_data["url"]
    # )
    # if notion_res:
    #     notion_url = notion_res.get("url")
    #     logger.info(f"📄 Notion report created: {notion_url}")

    # # Step 2: Send Alerts only if risk is significant
    # if risk_data.get("risk_score", 0) > 5:
    #     # Slack Alert
    #     if creds.get("slack_token") and creds.get("slack_channel"):
    #         # Pass notion_url to Slack alert for the direct link button
    #         await send_slack_alert(creds, event_data["repo"], event_data["pr_id"], risk_data, notion_url)
        
    #     # Jira Ticket
    #     if creds.get("jira_url") and creds.get("jira_token"):
    #         create_jira_ticket(
    #             creds, 
    #             event_data["repo"], 
    #             event_data["pr_id"], 
    #             event_data["title"], 
    #             risk_data, 
    #             event_data["url"],
    #             notion_url # Optional: Link to Notion in Jira description
    #         )

async def dispatch_notifications(creds, risk_data, event_data, org_id: str):
    """
    Handles the logic for where to send alerts based on the risk score,
    now including dynamic Manager-to-Employee Gmail alerts.
    """
    db = get_database()
    notion_url = None

    # --- STEP 1: ROBUST ORGANIZATION LOOKUP ---
    query = {
        "$or": [
            {"_id": org_id},
            {"_id": ObjectId(org_id) if ObjectId.is_valid(org_id) else None}
        ]
    }
    org = await db["organizations"].find_one(query)
    
    if not org:
        logger.warning(f"⚠️ Organization {org_id} not found for dispatch")
        return

    # Fetch Manager Identity
    manager = await db["users"].find_one({"_id": org.get("manager_id")})
    manager_name = manager.get("full_name", "Project Manager") if manager else "Project Manager"
    manager_email = manager.get("email") if manager else settings.SMTP_USER

    # --- STEP 1.5: UNIVERSAL EMPLOYEE LOOKUP (THE FIX) ---
    # We search for BOTH the String ID and the ObjectId to ensure we find the user
    raw_ids = org.get("employee_ids", [])
    search_ids = []

    for uid in raw_ids:
        # 1. Always add the raw ID (Matches if DB has String)
        search_ids.append(uid)
        
        # 2. If it looks like an ObjectId, add that version too (Matches if DB has ObjectId)
        if isinstance(uid, str) and ObjectId.is_valid(uid):
            search_ids.append(ObjectId(uid))

    # Search users using the "Universal List"
    employees = await db["users"].find({"_id": {"$in": search_ids}}).to_list(length=100)
    employee_emails = [emp["email"] for emp in employees]
    
    # Log success for verification
    if employee_emails:
        logger.info(f"👥 Found {len(employee_emails)} employees for email dispatch.")
    else:
        logger.warning(f"⚠️ No employee emails found. Raw IDs: {raw_ids} -> Search List: {search_ids}")

    # Step 2: Create Notion Documentation
    notion_res = await notion_bot.create_incident_report(
        analysis=risk_data,
        event_summary=event_data["summary"],
        pr_url=event_data["url"]
    )
    if notion_res:
        notion_url = notion_res.get("url")
        logger.info(f"📄 Notion report created: {notion_url}")

    # Step 3: Send Alerts if risk is significant (> 5)
    risk_score = risk_data.get("risk_score", 0)
    
    if risk_score > 5:
        # Slack Alert
        if creds.get("slack_token") and creds.get("slack_channel"):
            await send_slack_alert(creds, event_data["repo"], event_data["pr_id"], risk_data, notion_url)
        
        # Jira Ticket
        if creds.get("jira_url") and creds.get("jira_token"):
            create_jira_ticket(
                creds, 
                event_data["repo"], 
                event_data["pr_id"], 
                event_data["title"], 
                risk_data, 
                event_data["url"],
                notion_url
            )

    # Step 4: High Risk Gmail Alert (Manager -> Employees)
    # Triggered specifically for high-priority risks
    if risk_score >= 6:
        await send_manager_to_employee_alert(
            manager_name=manager_name,
            manager_email=manager_email,
            employee_emails=employee_emails,
            project_name=org.get("name", "Unknown Project"),
            risk_data=risk_data,
            pr_url=event_data["url"]
        )
        
async def send_slack_alert(creds, repo, pr_id, risk_data, notion_url=None):
    client = WebClient(token=creds["slack_token"])
    main_text = f"🚨 NovaScan Risk Alert: PR #{pr_id} in {repo}"

    # Start with just the Header and Section
    blocks = [
        {
            "type": "header",
            "text": {"type": "plain_text", "text": "🚨 NovaScan Risk Alert"}
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "type": "mrkdwn", "text": f"*Repo:* {repo} | *PR:* #{pr_id}\n*Score:* {risk_data.get('risk_score')}/10\n*Reason:* {risk_data.get('reason')}"
                }
        }
    ]

    # ONLY append the entire actions block if there is a URL
    if notion_url:
        blocks.append({
            "type": "actions",
            "elements": [
                {
                    "type": "button",
                    "text": {"type": "plain_text", "text": "📄 View Notion Report"},
                    "url": notion_url,
                    "style": "primary"
                }
            ]
        })

    client.chat_postMessage(channel=creds["slack_channel"], text=main_text, blocks=blocks)

def create_jira_ticket(creds, repo, pr_id, pr_title, risk_data, pr_url, notion_url=None):
    try:
        from jira import JIRA
        jira = JIRA(server=creds["jira_url"], basic_auth=(creds["jira_email"], creds["jira_token"]))
        
        desc = f"Risk Score: {risk_data.get('risk_score')}/10\nReason: {risk_data.get('reason')}\nPR Link: {pr_url}"
        if notion_url:
            desc += f"\nDetailed Report: {notion_url}"

        issue_dict = {
            'project': {'key': creds["jira_project_key"]}, 
            'summary': f"[Risk Detected] PR #{pr_id}: {pr_title}",
            'description': desc,
            'issuetype': {'name': 'Task'},
        }
        jira.create_issue(fields=issue_dict)
        logger.info(f"🎫 Jira Ticket Created")
    except Exception as e:
        logger.error(f"❌ Jira Error: {e}")

@router.post("/slack/actions")
async def handle_slack_interactive(request: Request, background_tasks: BackgroundTasks):
    form_data = await request.form()
    payload = json.loads(form_data["payload"])
    action = payload["actions"][0]
    
    if action["action_id"] == "trigger_notion_pm":
        pr_url = action["value"]
        background_tasks.add_task(
            notion_bot.create_incident_report,
            analysis={"reason": "Manual Trigger from Slack", "risk_score": 8},
            event_summary="Developer Initiated Report",
            pr_url=pr_url
        )
    return {"status": "ok"}