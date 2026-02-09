from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

# --- Helper for ObjectId ---
class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate
    @classmethod
    def validate(cls, v, values=None): # Updated signature for V2 compatibility
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)
    @classmethod
    def __get_pydantic_json_schema__(cls, core_schema, handler):
        return {"type": "string"}

# --- Base Model ---
class OrganizationBase(BaseModel):
    name: str
    slug: str
    logo: Optional[str] = None
    website_url: Optional[str] = None
    linkedin_url: Optional[str] = None

# --- Create Model ---
class OrganizationCreate(OrganizationBase):
    pass

# --- Update Model (This was missing) ---
class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    logo: Optional[str] = None
    website_url: Optional[str] = None
    linkedin_url: Optional[str] = None

# --- DB Model ---
class Organization(OrganizationBase):
    id: str = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    owner_id: str  
    
    # Global User Directory
    admin_ids: List[str] = []
    manager_ids: List[str] = []
    employee_ids: List[str] = []
    
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        # FIXED: Updated for Pydantic V2
        populate_by_name = True
        json_encoders = {ObjectId: str}