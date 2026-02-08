from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class OrganizationBase(BaseModel):
    name: str
    slug: str 

# --- NEW: Explicit Settings Model ---
class OrganizationSettings(BaseModel):
    github_access_token: Optional[str] = None
    slack_bot_token: Optional[str] = None
    slack_channel: Optional[str] = None
    jira_url: Optional[str] = None
    jira_email: Optional[str] = None
    jira_api_token: Optional[str] = None
    jira_project_key: Optional[str] = "SCRUM"
    
    # ✅ Notion Fields Added
    notion_token: Optional[str] = None
    notion_database_id: Optional[str] = None

class OrganizationCreate(OrganizationBase):
    pass

class Organization(OrganizationBase):
    id: str = Field(alias="_id")
    owner_id: str 
    members: List[str] = [] 
    
    # ✅ Manager/Employee tracking for Webhooks
    manager_id: Optional[str] = None
    employee_ids: List[str] = []

    assignments: Dict[str, List[str]] = {} 
    
    # ✅ Settings Field Added
    settings: OrganizationSettings = Field(default_factory=OrganizationSettings)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)