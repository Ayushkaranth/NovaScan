from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class Notification(BaseModel):
    id: str = Field(alias="_id")
    user_id: str          # Recipient
    org_id: str           # Project related to
    title: str            # "New Project Assigned"
    message: str          
    type: str             # "assignment" or "risk_alert"
    is_read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)