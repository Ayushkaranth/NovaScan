from fastapi import APIRouter, Request, BackgroundTasks
import json
import os
import logging
import httpx
from datetime import datetime
from dotenv import load_dotenv
from bson import ObjectId

from app.services.intelligence.llm_engine import analyze_code
from app.services.delivery.notion_bot import notion_bot
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

# --- HELPER: GET CREDENTIALS (PROJECT-AWARE) ---
async def get_org_credentials(org_id: str, repo_full_name: str = None):
    """
    Fetches integration secrets.
    1. Tries to find the specific PROJECT by matching the Repo Name.
    2. Falls back to the ORGANIZATION settings if no project is found.
    """
    try:
        db = get_database()
        
        # 1. Try to find the specific PROJECT for this Repo & Org
        if repo_full_name:
            # Convert "Owner/Repo" -> "Repo" (e.g., "Ayushkaranth/NovaScan" -> "NovaScan")
            clean_repo_name = repo_full_name.split('/')[-1]
            
            project = await db["projects"].find_one({
                "organization_id": org_id,
                # Case-insensitive match to be safe
                "repo_name": {"$regex": f"^{clean_repo_name}$", "$options": "i"}
            })
            
            if project and project.get("settings"):
                settings_data = project.get("settings")
                logger.info(f"✅ Loaded credentials from Project: {project.get('name')}")
                return {
                    "github_token": settings_data.get("github_access_token"),
                    "slack_token": settings_data.get("slack_bot_token"),
                    "slack_channel": settings_data.get("slack_channel"),
                    "jira_url": settings_data.get("jira_url"),
                    "jira_email": settings_data.get("jira_email"),
                    "jira_token": settings_data.get("jira_api_token"),
                    "jira_project_key": settings_data.get("jira_project_key", "SCRUM"),
                    "notion_token": settings_data.get("notion_token"),
                    "notion_database_id": settings_data.get("notion_database_id")
                }

        # 2. Fallback: Check the Organization (Legacy)
        logger.info(f"⚠️ Project not found for {repo_full_name}. Checking Org settings...")
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
            
        settings_data = org_data.get("settings", {})
        return {
            "github_token": settings_data.get("github_access_token"),
            "slack_token": settings_data.get("slack_bot_token"),
            "slack_channel": settings_data.get("slack_channel"),
            "jira_url": settings_data.get("jira_url"),
            "jira_email": settings_data.get("jira_email"),
            "jira_token": settings_data.get("jira_api_token"),
            "jira_project_key": settings_data.get("jira_project_key", "SCRUM"),
            "notion_token": settings_data.get("notion_token"),
            "notion_database_id": settings_data.get("notion_database_id")
        }
    except Exception as e:
        logger.error(f"❌ Error fetching credentials: {e}")
        return None

# --- HELPER: SAVE SCAN TO DB (FIXED) ---
async def save_scan_to_db(org_id, repo, pr_id, risk_data, pr_url, pr_title="Untitled", pr_author="Unknown"):
    try:
        db = get_database()
        collection = db.get_collection("scans")
        scan_record = {
            "org_id": str(org_id),
            "repo": repo,
            "pr_id": pr_id,
            "pr_title": pr_title,     
            "author": pr_author,      
            "risk_score": risk_data.get("risk_score", 0),
            "is_risky": risk_data.get("is_risky", False),
            "summary": risk_data.get("reason", "No summary"),
            "timestamp": datetime.utcnow(),
            "pr_url": pr_url
        }
        await collection.insert_one(scan_record)
        logger.info(f"💾 Scan saved: {pr_title} by {pr_author}")
    except Exception as e:
        logger.error(f"❌ DB Save Error: {e}")

# --- WEBHOOK HANDLER ---
@router.post("/github/{org_id}")
async def handle_github_webhook(org_id: str, request: Request):
    try:
        body_content = await request.body()
        if not body_content:
            return {"status": "skipped", "message": "Empty body"}
        
        payload = await request.json()
        event_type = request.headers.get("X-GitHub-Event")

        if event_type == "pull_request" and payload.get("action") in ["opened", "synchronize", "reopened"]:
            
            # Extract PR Details
            pr = payload.get("pull_request")
            pr_number = pr.get("number")
            repo_full_name = payload.get("repository", {}).get("full_name") # "Owner/Repo"
            title = pr.get("title", "Untitled")
            user_login = pr.get("user", {}).get("login", "Unknown") 
            body = pr.get("body", "") or ""
            diff_url = pr.get("diff_url")
            pr_url = pr.get("html_url")

            logger.info(f"✅ Processing PR #{pr_number} ({repo_full_name}) for Org: {org_id}")

            # 1. Fetch Credentials (Passing Repo Name to find Project)
            creds = await get_org_credentials(org_id, repo_full_name)
            if not creds:
                logger.error("❌ No credentials found (Project or Org level).")
                return {"status": "error", "message": "Credentials not found."}

            # 2. Get Diff (With Fixed Headers)
            diff_text = ""
            if creds.get("github_token"):
                async with httpx.AsyncClient() as client:
                    headers = {
                        "Authorization": f"token {creds['github_token']}",
                        "Accept": "application/vnd.github.v3.diff" 
                    }
                    resp = await client.get(diff_url, headers=headers, follow_redirects=True)
                    if resp.status_code == 200:
                        diff_text = resp.text
                    else:
                        logger.error(f"❌ Failed to fetch diff: {resp.status_code}")

            # 3. AI Analysis
            risk_analysis = await analyze_code(diff_text, {"title": title, "body": body})
            
            # 4. Save to DB (Passing Title/Author)
            await save_scan_to_db(
                org_id, repo_full_name, pr_number, risk_analysis, pr_url, 
                pr_title=title, 
                pr_author=user_login
            )

            # 5. Trigger Dispatch
            event_data = {
                "summary": f"PR #{pr_number} in {repo_full_name}",
                "title": title,
                "url": pr_url,
                "repo": repo_full_name,
                "pr_id": pr_number
            }
            await dispatch_notifications(creds, risk_analysis, event_data, org_id)

        return {"status": "processed"}

    except Exception as e:
        logger.error(f"❌ Error in webhook: {e}")
        return {"status": "error", "message": str(e)}

async def dispatch_notifications(creds, risk_data, event_data, org_id: str):
    """
    Handles alerts. Now uses the 'creds' dictionary which contains the correct tokens.
    """
    db = get_database()
    notion_url = None

    # Lookup Org just for Manager Info (Tokens are already in 'creds')
    query = {"$or": [{"_id": org_id}, {"_id": ObjectId(org_id) if ObjectId.is_valid(org_id) else None}]}
    org = await db["organizations"].find_one(query)
    
    manager_name = "Project Manager"
    manager_email = settings.SMTP_USER # Default
    
    if org:
        manager = await db["users"].find_one({"_id": org.get("manager_id")})
        if manager:
            manager_name = manager.get("full_name", "Project Manager")
            manager_email = manager.get("email")

    # --- 1. Create Notion Report ---
    if creds.get("notion_token") and creds.get("notion_database_id"):
        notion_res = await notion_bot.create_incident_report(
            analysis=risk_data,
            event_summary=event_data["summary"],
            pr_url=event_data["url"],
            notion_token=creds.get("notion_token"),
            database_id=creds.get("notion_database_id")
        )
        if notion_res:
            notion_url = notion_res.get("url")
            logger.info(f"📄 Notion report created: {notion_url}")
    else:
        logger.info("ℹ️ Notion skipped (Tokens missing in Project settings)")

    # --- 2. Send Alerts (> 5) ---
    risk_score = risk_data.get("risk_score", 0)
    
    if risk_score > 5:
        # Slack
        if creds.get("slack_token") and creds.get("slack_channel"):
            await send_slack_alert(creds, event_data["repo"], event_data["pr_id"], risk_data, notion_url, org_id)
        
        # Jira
        if creds.get("jira_url") and creds.get("jira_token"):
            create_jira_ticket(creds, event_data["repo"], event_data["pr_id"], event_data["title"], risk_data, event_data["url"], notion_url)

    # --- 3. High Risk Email ---
    if risk_score >= 6:
        # Simple lookup for now
        employees = [] # Add your employee lookup logic here if needed
        # await send_manager_to_employee_alert(...) 
        pass 
        
async def send_slack_alert(creds, repo, pr_id, risk_data, notion_url, org_id):
    client = WebClient(token=creds["slack_token"])
    main_text = f"🚨 NovaScan Risk Alert: PR #{pr_id} in {repo}"

    blocks = [
        {"type": "header", "text": {"type": "plain_text", "text": "🚨 NovaScan Risk Alert"}},
        {"type": "section", "text": {"type": "mrkdwn", "text": f"*Repo:* {repo} | *PR:* #{pr_id}\n*Score:* {risk_data.get('risk_score')}/10\n*Reason:* {risk_data.get('reason')}"}}
    ]

    action_elements = []
    if notion_url:
        action_elements.append({"type": "button", "text": {"type": "plain_text", "text": "📄 View Notion Report"}, "url": notion_url, "style": "primary"})
    else:
        action_elements.append({"type": "button", "text": {"type": "plain_text", "text": "📝 Generate Report Manually"}, "style": "danger", "action_id": "trigger_notion_pm", "value": f"{org_id}|https://github.com/{repo}/pull/{pr_id}"})

    if action_elements:
        blocks.append({"type": "actions", "elements": action_elements})

    try:
        client.chat_postMessage(channel=creds["slack_channel"], text=main_text, blocks=blocks)
        logger.info("✅ Slack alert sent")
    except Exception as e:
        logger.error(f"❌ Slack Error: {e}")

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

# --- INTERACTIVE HANDLER ---
@router.post("/slack/actions")
async def handle_slack_interactive(request: Request, background_tasks: BackgroundTasks):
    try:
        form_data = await request.form()
        payload = json.loads(form_data["payload"])
        action = payload["actions"][0]
        
        if action["action_id"] == "trigger_notion_pm":
            raw_value = action["value"]
            if "|" not in raw_value: return {"status": "error"}
            org_id, pr_url = raw_value.split("|", 1)
            
            # Use REPO NAME from URL to find credentials
            repo_name_from_url = pr_url.split("github.com/")[1].split("/pull")[0]
            creds = await get_org_credentials(org_id, repo_name_from_url)
            
            if not creds: return {"status": "error"}

            background_tasks.add_task(
                notion_bot.create_incident_report,
                analysis={"reason": f"Manual Trigger by {payload['user']['username']}", "risk_score": 8},
                event_summary="Developer Initiated Report",
                pr_url=pr_url,
                notion_token=creds.get("notion_token"),
                database_id=creds.get("notion_database_id")
            )
            return {"status": "ok"}
    except Exception as e:
        logger.error(f"❌ Error handling Slack interaction: {e}")
        return {"status": "error"}
    return {"status": "ok"}