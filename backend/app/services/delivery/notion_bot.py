import httpx
from datetime import datetime
import logging
from typing import Optional, Dict, Any, List

logger = logging.getLogger(__name__)

class NotionBot:
    def __init__(self):
        self.base_url = "https://api.notion.com/v1"

    def _get_headers(self, token: str):
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Notion-Version": "2022-06-28"
        }

    def _get_risk_label(self, score: int) -> str:
        if score >= 8: return "Critical"
        if score >= 6: return "High"
        if score >= 4: return "Medium"
        return "Low"

    def _rich_text(self, text: Any) -> List[dict]:
        content = str(text or "Not provided.")
        return [{"type": "text", "text": {"content": content[index:index + 1900]}} for index in range(0, len(content), 1900)]

    async def create_incident_report(
        self,
        analysis: dict,
        event_summary: str,
        pr_url: str,
        notion_token: str,
        database_id: Optional[str] = None,
        parent_page_id: Optional[str] = None,
        report_context: Optional[Dict[str, Any]] = None,
    ):
        """Create a detailed NovaScan audit page in a selected page or legacy database."""
        if not notion_token or not (parent_page_id or database_id):
            logger.warning("Notion credentials or report destination missing; skipping report")
            return None

        analysis = analysis or {}
        context = report_context or {}
        risk_score = int(analysis.get("risk_score", 0) or 0)
        title = f"NovaScan Audit: {event_summary}"[:1800]
        created_at = datetime.utcnow().isoformat()
        recommendations = analysis.get("recommendations") or analysis.get("action_needed") or "Review the flagged change with the project team."
        if isinstance(recommendations, str):
            recommendations = [recommendations]
        elif not isinstance(recommendations, list):
            recommendations = [str(recommendations)]

        def heading(text: str, level: int = 2) -> dict:
            key = f"heading_{level}"
            return {"object": "block", "type": key, key: {"rich_text": self._rich_text(text)}}

        def paragraphs(text: Any) -> List[dict]:
            return [{"object": "block", "type": "paragraph", "paragraph": {"rich_text": chunk}}
                    for chunk in self._rich_text(text)]

        children = [{
            "object": "block", "type": "callout", "callout": {
                "rich_text": self._rich_text(f"NovaScan risk audit | {self._get_risk_label(risk_score)} | Score {risk_score}/10"),
                "icon": {"type": "emoji", "emoji": "\U0001F4CB"},
                "color": "red_background" if risk_score >= 7 else "orange_background",
            }
        }, heading("Executive risk assessment"), *paragraphs(analysis.get("reason") or analysis.get("summary")), heading("Recommended actions")]
        for item in recommendations:
            children.append({"object": "block", "type": "bulleted_list_item", "bulleted_list_item": {"rich_text": self._rich_text(item)}})
        for key, label in (("impact", "Potential impact"), ("affected_areas", "Affected areas"), ("evidence", "Evidence"), ("additional_recommendations", "Additional recommendations")):
            value = analysis.get(key)
            if value:
                children.append(heading(label, 3))
                for item in value if isinstance(value, list) else [value]:
                    children.append({"object": "block", "type": "bulleted_list_item", "bulleted_list_item": {"rich_text": self._rich_text(item)}})
        children.extend([
            heading("Event details"),
            *paragraphs(f"Repository: {context.get('repo') or 'Unknown'}"),
            *paragraphs(f"Pull request: #{context.get('pr_id') or 'N/A'} | {context.get('title') or event_summary}"),
            *paragraphs(f"Author: {context.get('author') or 'Unknown'}"),
            *paragraphs(f"Detected at (UTC): {created_at}"),
        ])
        if isinstance(pr_url, str) and pr_url.startswith("http"):
            children.append({"object": "block", "type": "paragraph", "paragraph": {"rich_text": [{"type": "text", "text": {"content": "Open source pull request", "link": {"url": pr_url}}}]}})

        if parent_page_id:
            payload = {
                "parent": {"page_id": parent_page_id},
                "properties": {"title": {"title": [{"type": "text", "text": {"content": title}}]}},
                "children": children[:100],
            }
        else:
            payload = {
                "parent": {"database_id": database_id},
                "properties": {
                    "Name": {"title": [{"text": {"content": title}}]},
                    "Risk Level": {"select": {"name": self._get_risk_label(risk_score)}},
                    "Risk Score": {"number": risk_score},
                    "Status": {"status": {"name": "In Progress"}},
                    "Source PR": {"url": pr_url if isinstance(pr_url, str) and pr_url.startswith("http") else "https://github.com"},
                    "Detected At": {"date": {"start": created_at}},
                },
                "children": children[:100],
            }

        try:
            async with httpx.AsyncClient(timeout=25.0) as client:
                response = await client.post(f"{self.base_url}/pages", headers=self._get_headers(notion_token), json=payload)
                if response.status_code not in (200, 201):
                    logger.error("Notion audit page creation failed (%s): %s", response.status_code, response.text[:500])
                    return None
                return response.json()
        except Exception as exc:
            logger.error("Notion audit page creation failed: %s", exc)
            return None

    async def create_meeting_mom_page(self, mom_data: Dict[str, Any], notion_token: str, database_id: str):
        """
        Creates a structured Meeting Minutes (MOM) page in Notion from Google Meet analysis.
        """
        if not notion_token or not database_id:
            logger.info("ℹ️ Notion credentials not provided. Skipping Notion publishing.")
            return None

        title = mom_data.get("meeting_title", "Google Meet Session Minutes")
        summary = mom_data.get("executive_summary", "Meeting minutes summary.")
        decisions = mom_data.get("key_decisions", [])

        payload = {
            "parent": {"database_id": database_id},
            "properties": {
                "Name": {"title": [{"text": {"content": f"MOM: {title}"}}]},
                "Status": {"status": {"name": "Done"}},
                "Detected At": {"date": {"start": datetime.utcnow().isoformat()}}
            },
            "children": [
                {
                    "object": "block",
                    "type": "callout",
                    "callout": {
                        "rich_text": [{"text": {"content": f"Google Meet AI Transcription & Minutes"}}],
                        "icon": {"emoji": "📝"},
                        "color": "green_background"
                    }
                },
                {
                    "object": "block",
                    "type": "heading_2",
                    "heading_2": {"rich_text": [{"text": {"content": "📌 Executive Summary"}}]}
                },
                {
                    "object": "block",
                    "type": "paragraph",
                    "paragraph": {"rich_text": [{"text": {"content": summary}}]}
                },
                {
                    "object": "block",
                    "type": "heading_3",
                    "heading_3": {"rich_text": [{"text": {"content": "✅ Key Decisions"}}]}
                }
            ]
        }

        for dec in decisions:
            payload["children"].append({
                "object": "block",
                "type": "bulleted_list_item",
                "bulleted_list_item": {"rich_text": [{"text": {"content": str(dec)}}]}
            })

        try:
            async with httpx.AsyncClient() as client:
                res = await client.post(f"{self.base_url}/pages", headers=self._get_headers(notion_token), json=payload)
                if res.status_code == 200:
                    return res.json()
                logger.error(f"Notion MOM publish error: {res.text}")
                return None
        except Exception as e:
            logger.error(f"Notion MOM Exception: {e}")
            return None

notion_bot = NotionBot()
