from fastapi import APIRouter, Request, HTTPException
from app.services.intelligence.llm_engine import analyze_code
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import os
import logging
import httpx
from dotenv import load_dotenv
from app.core.database import get_database 
from bson import ObjectId

# Load Environment Variables (Only for DB connection now)
load_dotenv()

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# --- HELPER: GET CREDENTIALS FROM DB ---
# async def get_org_credentials(org_id: str):
#     """
#     Fetches integration tokens (GitHub, Slack, Jira) from the user's database entry.
#     """
#     mongo_url = os.getenv("MONGODB_URL")
#     if not mongo_url:
#         logger.error("❌ MongoDB URL missing in .env")
#         return None

#     try:
#         client = AsyncIOMotorClient(mongo_url)
#         db = client.get_database("test") # CHANGE THIS if your DB name is different
        
#         # We assume you have a collection named 'organizations' or 'integrations'
#         # Adjust this query to match your actual Database Schema
#         org_data = await db.organizations.find_one({"_id": org_id})
        
#         if not org_data:
#             # Fallback: Try looking up by a string ID if ObjectId fails
#             from bson import ObjectId
#             try:
#                 org_data = await db.organizations.find_one({"_id": ObjectId(org_id)})
#             except:
#                 pass

#         if not org_data:
#             logger.warning(f"⚠️ No organization found for ID: {org_id}")
#             return None
            
#         # Extract the 'settings' or 'integrations' object
#         # structure depends on how your Frontend saves it. 
#         # Here is a generic guess based on common patterns:
#         settings = org_data.get("settings", {})
        
#         return {
#             "github_token": settings.get("github_access_token"),
#             "slack_token": settings.get("slack_bot_token"),
#             "slack_channel": settings.get("slack_channel"),
#             "jira_url": settings.get("jira_url"),
#             "jira_email": settings.get("jira_email"),
#             "jira_token": settings.get("jira_api_token"),
#             "jira_project_key": settings.get("jira_project_key", "SCRUM") # Default to SCRUM if missing
#         }
        
#     except Exception as e:
#         logger.error(f"❌ Error fetching org credentials: {e}")
#         return None

async def get_org_credentials(org_id: str):
    """
    Fetches tokens using the centralized get_database helper.
    """
    try:
        db = get_database() # This will now correctly use 'loop'
        
        # Use the "Safe Search" we discussed to handle both String and ObjectId
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
# async def save_scan_to_db(org_id, repo, pr_id, risk_data, pr_url):
#     mongo_url = os.getenv("MONGODB_URL")
#     try:
#         client = AsyncIOMotorClient(mongo_url)
#         db = client.get_database("test")
#         collection = db.get_collection("scans")
        
#         scan_record = {
#             "org_id": org_id,
#             "repo": repo,
#             "pr_id": pr_id,
#             "risk_score": risk_data.get("risk_score", 0),
#             "is_risky": risk_data.get("is_risky", False),
#             "summary": risk_data.get("reason", "No summary"),
#             "timestamp": datetime.utcnow(),
#             "pr_url": pr_url
#         }
#         await collection.insert_one(scan_record)
#         logger.info("💾 Scan result saved to MongoDB!")
#     except Exception as e:
#         logger.error(f"❌ DB Save Error: {e}")

async def save_scan_to_db(org_id, repo, pr_id, risk_data, pr_url):
    try:
        db = get_database() # This ensures scans go to the 'loop' database
        collection = db.get_collection("scans")
        
        scan_record = {
            "org_id": str(org_id), # Save as string to match our frontend query
            "repo": repo,
            "pr_id": pr_id,
            "risk_score": risk_data.get("risk_score", 0),
            "is_risky": risk_data.get("is_risky", False),
            "summary": risk_data.get("reason", "No summary"),
            "timestamp": datetime.utcnow(),
            "pr_url": pr_url
        }
        await collection.insert_one(scan_record)
        logger.info("💾 Scan result saved to MongoDB collection 'scans' in 'loop' database!")
    except Exception as e:
        logger.error(f"❌ DB Save Error: {e}")

# --- MAIN WEBHOOK HANDLER ---
@router.post("/github/{org_id}")
async def handle_github_webhook(org_id: str, request: Request):
    try:
        payload = await request.json()
        event_type = request.headers.get("X-GitHub-Event")

        if event_type == "pull_request" and payload.get("action") in ["opened", "synchronize", "reopened"]:
            
            # 1. FETCH CREDENTIALS FOR THIS USER
            creds = await get_org_credentials(org_id)
            if not creds:
                return {"status": "error", "message": "Organization not found or no credentials."}

            pr = payload.get("pull_request")
            pr_number = pr.get("number")
            repo_name = payload.get("repository", {}).get("full_name")
            title = pr.get("title")
            body = pr.get("body", "") or ""
            diff_url = pr.get("diff_url")
            pr_url = pr.get("html_url")

            logger.info(f"✅ Processing PR #{pr_number} for Org: {org_id}")

            # 2. GET DIFF (Using User's GitHub Token)
            diff_text = ""
            if creds["github_token"]:
                async with httpx.AsyncClient() as client:
                    resp = await client.get(diff_url, headers={"Authorization": f"token {creds['github_token']}"}, follow_redirects=True)
                    if resp.status_code == 200:
                        diff_text = resp.text
            else:
                logger.warning("⚠️ No GitHub Token for this user. Analysis limited.")

            # 3. AI ANALYSIS
            risk_analysis = await analyze_code(diff_text, {"title": title, "body": body})
            
            # 4. SAVE TO DB (So Dashboard sees it)
            await save_scan_to_db(org_id, repo_name, pr_number, risk_analysis, pr_url)

            # 5. ALERTS (Using User's Slack/Jira credentials)
            if risk_analysis.get("risk_score", 0) > 5:
                # Slack
                if creds["slack_token"] and creds["slack_channel"]:
                    await send_slack_alert(creds, repo_name, pr_number, risk_analysis)
                
                # Jira
                if creds["jira_url"] and creds["jira_token"]:
                    create_jira_ticket(creds, repo_name, pr_number, title, risk_analysis, pr_url)

        return {"status": "processed"}

    except Exception as e:
        logger.error(f"❌ Error in webhook: {e}")
        return {"status": "error", "message": str(e)}

# --- ALERT FUNCTIONS (Now accept 'creds') ---
async def send_slack_alert(creds, repo, pr_id, risk_data):
    try:
        from slack_sdk import WebClient
        client = WebClient(token=creds["slack_token"])
        text = f"🚨 *Loop Risk Alert: HIGH*\n*Repo:* {repo} | *PR:* #{pr_id}\n*Score:* {risk_data.get('risk_score')}/10\n*Reason:* {risk_data.get('reason')}"
        client.chat_postMessage(channel=creds["slack_channel"], text=text)
        logger.info(f"✅ Slack alert sent to #{creds['slack_channel']}")
    except Exception as e:
        logger.error(f"❌ Slack Error: {e}")

def create_jira_ticket(creds, repo, pr_id, pr_title, risk_data, pr_url):
    try:
        from jira import JIRA
        jira = JIRA(server=creds["jira_url"], basic_auth=(creds["jira_email"], creds["jira_token"]))
        
        issue_dict = {
            'project': {'key': creds["jira_project_key"]}, 
            'summary': f"[Risk Detected] PR #{pr_id}: {pr_title}",
            'description': f"Risk Score: {risk_data.get('risk_score')}/10\nReason: {risk_data.get('reason')}\nLink: {pr_url}",
            'issuetype': {'name': 'Task'},
        }
        jira.create_issue(fields=issue_dict)
        logger.info(f"🎫 Jira Ticket Created in Project {creds['jira_project_key']}")
    except Exception as e:
        logger.error(f"❌ Jira Error: {e}")