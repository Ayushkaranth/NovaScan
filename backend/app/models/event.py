from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Dict, Any

class Event(BaseModel):
    id: str = Field(alias="_id")
    org_id: str
    source: str         # "github" or "jira"
    source_id: str      # The specific PR ID (e.g., "PR-123") or Ticket Key ("PROJ-45")
    actor: str          # Who did it? (e.g., "ayush-dev")
    action: str         # "opened_pr", "pushed_code", "updated_ticket"
    summary: str        # Short title (e.g., "Fix payment bug")
    content: str        # The detailed body, diff, or description
    meta: Dict[str, Any] = {} # Extra links (url, repo_name, status)
    created_at: datetime