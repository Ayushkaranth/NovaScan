from fastapi import APIRouter, HTTPException, BackgroundTasks, Header, Body
from typing import Dict, Any, Optional
from pydantic import BaseModel
from app.services.intelligence.meeting_analyzer import analyze_meeting_transcript
from app.services.delivery.notion_bot import notion_bot
from app.services.delivery.jira_service import create_jira_issue
from app.core.crypto import decrypt_key

router = APIRouter()

class GMeetTranscriptPayload(BaseModel):
    title: Optional[str] = "Google Meet Synchronization Session"
    transcript: Any  # Accepts list of dialogue, raw text string, or VTT payload
    byok_api_key: Optional[str] = None
    llm_provider: Optional[str] = "gemini"
    notion_token: Optional[str] = None
    notion_database_id: Optional[str] = None
    jira_url: Optional[str] = None
    jira_email: Optional[str] = None
    jira_token: Optional[str] = None
    jira_project_key: Optional[str] = "KAN"

@router.post("/transcript")
async def process_gmeet_transcript(payload: GMeetTranscriptPayload):
    """
    Ingests a Google Meet transcript payload (from free third-party extensions, webhooks, or UI upload).
    Processes analysis in-memory for Zero Data Retention (ZDR) compliance.
    """
    try:
        # Decrypt keys if encrypted
        clean_llm_key = decrypt_key(payload.byok_api_key) if payload.byok_api_key else None
        clean_notion_token = decrypt_key(payload.notion_token) if payload.notion_token else None
        clean_jira_token = decrypt_key(payload.jira_token) if payload.jira_token else None

        # 1. Execute AI Meeting Intelligence Analysis (In-Memory Zero Data Retention)
        analysis_result = await analyze_meeting_transcript(
            raw_payload=payload.transcript if payload.transcript else payload.title,
            custom_api_key=clean_llm_key,
            provider=payload.llm_provider or "gemini"
        )

        # Override title if provided explicitly
        if payload.title and payload.title != "Google Meet Synchronization Session":
            analysis_result["meeting_title"] = payload.title

        created_jira_tickets = []
        notion_mom_status = "skipped"

        # 2. Dispatch Action Items to Jira if credentials provided
        action_items = analysis_result.get("action_items", [])
        if payload.jira_url and payload.jira_email and clean_jira_token:
            for item in action_items:
                summary = f"[{analysis_result['meeting_title']}] {item.get('task_title', 'Action Item')}"
                desc = f"Assignee: {item.get('assignee', 'Unassigned')}\nPriority: {item.get('priority', 'Medium')}\n\nDescription: {item.get('description', '')}"
                ticket_res = await create_jira_issue(
                    summary=summary,
                    description=desc,
                    jira_url=payload.jira_url,
                    jira_email=payload.jira_email,
                    jira_token=clean_jira_token,
                    project_key=payload.jira_project_key or "KAN"
                )
                if ticket_res and "key" in ticket_res:
                    created_jira_tickets.append(ticket_res.get("key"))

        # 3. Publish MOM Page to Notion if credentials provided
        if clean_notion_token and payload.notion_database_id:
            mom_res = await notion_bot.create_meeting_mom_page(
                mom_data=analysis_result,
                notion_token=clean_notion_token,
                database_id=payload.notion_database_id
            )
            if mom_res:
                notion_mom_status = "published"

        return {
            "status": "success",
            "message": "Google Meet transcript analyzed with Zero Data Retention (ZDR)",
            "meeting_title": analysis_result.get("meeting_title"),
            "executive_summary": analysis_result.get("executive_summary"),
            "key_decisions": analysis_result.get("key_decisions"),
            "technical_risks": analysis_result.get("technical_risks"),
            "action_items_count": len(action_items),
            "created_jira_tickets": created_jira_tickets,
            "notion_mom_status": notion_mom_status,
            "notion_mom_markdown": analysis_result.get("notion_mom_markdown")
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process transcript: {str(e)}")
