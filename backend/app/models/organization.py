from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class OrganizationBase(BaseModel):
    name: str
    slug: str # unique-url-friendly-name (e.g., "team-kdg")

class OrganizationCreate(OrganizationBase):
    pass

class Organization(OrganizationBase):
    id: str = Field(alias="_id")
    owner_id: str
    members: List[str] = [] # List of User IDs
    created_at: datetime = Field(default_factory=datetime.utcnow)