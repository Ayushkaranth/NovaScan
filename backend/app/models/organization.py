from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime

class OrganizationBase(BaseModel):
    name: str
    slug: str # unique-url-friendly-name (e.g., "team-kdg")

class OrganizationCreate(OrganizationBase):
    pass

class Organization(OrganizationBase):
    id: str = Field(alias="_id")
    owner_id: str # This will be the HR user
    members: List[str] = [] 
    # New Field: assignment_map
    # Key: Manager_ID, Value: List of Employee_IDs
    assignments: Dict[str, List[str]] = {} 
    created_at: datetime = Field(default_factory=datetime.utcnow)