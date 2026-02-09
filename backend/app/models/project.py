from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

# --- 1. Frontend Payload Model (Matches your UI) ---
class ProjectCreateRequest(BaseModel):
    name: str
    
    # GitHub Data
    repo_owner: str
    repo_name: str
    github_token: str
    
    # Integrations
    slack_token: Optional[str] = None
    slack_channel: Optional[str] = None
    jira_url: Optional[str] = None
    jira_email: Optional[str] = None
    jira_token: Optional[str] = None
    notion_token: Optional[str] = None
    notion_database_id: Optional[str] = None
    
    # Team (Sent as IDs)
    manager_id: str
    employee_ids: List[str] = []

# --- 2. Database Model (Structured) ---
class ProjectIntegrations(BaseModel):
    github_access_token: str
    slack_bot_token: Optional[str] = None
    slack_channel: Optional[str] = None
    jira_url: Optional[str] = None
    jira_email: Optional[str] = None
    jira_api_token: Optional[str] = None
    jira_project_key: str = "SCRUM"
    notion_token: Optional[str] = None
    notion_database_id: Optional[str] = None

class Project(BaseModel):
    id: str = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    organization_id: str
    name: str
    slug: str
    
    # Repo Info
    repo_owner: str
    repo_name: str
    
    # Team Assignments
    manager_id: str
    employee_ids: List[str] = []
    
    # Settings
    settings: ProjectIntegrations
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}