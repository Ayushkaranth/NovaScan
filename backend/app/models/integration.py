from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

# --- 1. INPUT: Payload to Connect an Integration ---
class IntegrationConnectRequest(BaseModel):
    # Flexible dictionary to handle different platforms
    # GitHub: { "access_token": "..." }
    # Slack:  { "bot_token": "...", "channel": "..." }
    # Jira:   { "email": "...", "api_token": "...", "domain": "..." }
    # Notion: { "token": "...", "database_id": "..." }
    credentials: Dict[str, Any] 

# --- 2. OUTPUT: Status for Dashboard List ---
class IntegrationStatus(BaseModel):
    platform: str        # "github", "slack", "jira", "notion"
    is_connected: bool
    connected_at: Optional[datetime] = None
    details: Optional[Dict[str, Any]] = None # e.g., {"channel": "#dev-alerts"} or {"repo": "user/repo"}

class ProjectIntegrationsView(BaseModel):
    project_id: str
    integrations: List[IntegrationStatus]