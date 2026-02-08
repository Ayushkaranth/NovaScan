import httpx
from datetime import datetime
import logging

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
        if score >= 8: return "Critical 🔴"
        if score >= 6: return "High 🟠"
        if score >= 4: return "Medium 🟡"
        return "Low 🟢"

    async def create_incident_report(self, analysis: dict, event_summary: str, pr_url: str, notion_token: str, database_id: str):
        """
        Creates a structured Post-Mortem page using USER-PROVIDED credentials.
        """
        if not notion_token or not database_id:
            logger.warning("⚠️ Notion credentials missing for this organization. Skipping report.")
            return None

        risk_score = analysis.get("risk_score", 0)
        
        payload = {
            "parent": {"database_id": database_id},
            "properties": {
                "Name": {"title": [{"text": {"content": f"NovaScan Alert: {event_summary}"}}]},
                "Risk Level": {"select": {"name": self._get_risk_label(risk_score)}},
                "Risk Score": {"number": risk_score},
                "Status": {"status": {"name": "In Progress"}},
                "Source PR": {"url": pr_url},
                "Detected At": {"date": {"start": datetime.utcnow().isoformat()}}
            },
            "children": [
                {
                    "object": "block",
                    "type": "callout",
                    "callout": {
                        "rich_text": [{"text": {"content": "Automated NovaScan Intelligence Report"}}],
                        "icon": {"emoji": "🤖"},
                        "color": "blue_background"
                    }
                },
                {
                    "object": "block",
                    "type": "heading_2",
                    "heading_2": {"rich_text": [{"text": {"content": "🔍 Intelligence Summary"}}]}
                },
                {
                    "object": "block",
                    "type": "paragraph",
                    "paragraph": {"rich_text": [{"text": {"content": analysis.get("reason", "No analysis available.")}}]}
                }
            ]
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/pages", 
                    headers=self._get_headers(notion_token), 
                    json=payload
                )
                
                if response.status_code != 200:
                    logger.error(f"❌ Notion API Error: {response.text}")
                    return None
                
                return response.json()
        except Exception as e:
            logger.error(f"❌ Notion Connection Error: {e}")
            return None

notion_bot = NotionBot()