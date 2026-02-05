from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime

# Shared properties
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    is_active: bool = True
    
    model_config = ConfigDict(populate_by_name=True)

# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str
    role: str = "employee"

# Properties to receive via API on update
class UserUpdate(UserBase):
    password: Optional[str] = None

# Properties stored in DB
class UserInDB(UserBase):
    id: str = Field(alias="_id") 
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    current_org_id: Optional[str] = None
    # We add a global role field (default to employee)
    role: str = "employee" # "hr", "manager", "employee"

# Properties to return to client
class User(UserBase):
    id: str = Field(alias="_id")
    current_org_id: Optional[str] = None
    role: str = "employee"