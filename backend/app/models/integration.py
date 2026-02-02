from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime

class IntegrationBase(BaseModel):
    platform: str  # "github", "jira", "slack"
    is_active: bool = True
    config: Dict[str, Any] = {} # Stores "repos_to_watch", "slack_channel_id"

class IntegrationCreate(IntegrationBase):
    credentials: Dict[str, Any] # The sensitive tokens (Personal Access Token, Bot Token)

class IntegrationInDB(IntegrationBase):
    id: str = Field(alias="_id")
    org_id: str
    credentials: Dict[str, Any] # In a real prod app, we would encrypt this field
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_synced_at: Optional[datetime] = None
    status: str = "connected" # "connected", "error", "revoked"

class Integration(IntegrationBase):
    id: str = Field(alias="_id")
    org_id: str
    status: str
    created_at: datetime
    # NOTE: We purposefully DO NOT return 'credentials' here for security