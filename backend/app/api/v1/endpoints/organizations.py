from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List, Dict

# Models
from app.models.organization import Organization, OrganizationCreate, OrganizationUpdate
from app.models.user import User

# Core & Utils
from app.api.v1.endpoints.auth import get_current_user
from app.core.database import get_database
from bson import ObjectId
from datetime import datetime
from pydantic import EmailStr, BaseModel

router = APIRouter()

# --- Helper Schema for Member Operations ---
class MemberAddRequest(BaseModel):
    email: EmailStr
    name: str
    role: str = "employee" # Options: "admin", "manager", "employee"

# 1. CREATE ORGANIZATION
@router.post("/", response_model=Organization)
async def create_organization(
    org_in: OrganizationCreate,
    current_user: User = Depends(get_current_user)
):
    """
    Creates a new Organization. The creator becomes the 'Owner' and first 'Admin'.
    """
    db = get_database()
    
    # Optional: Prevent user from creating multiple orgs
    # if current_user.current_org_id:
    #     raise HTTPException(status_code=400, detail="You are already in an organization.")

    new_org = {
        "_id": str(ObjectId()),
        "name": org_in.name,
        "slug": org_in.slug,
        "logo": org_in.logo,
        "website_url": org_in.website_url,
        "linkedin_url": org_in.linkedin_url,
        "owner_id": current_user.id,
        # Initialize Role Lists
        "admin_ids": [current_user.id], 
        "manager_ids": [],
        "employee_ids": [],
        "created_at": datetime.utcnow()
    }

    await db["organizations"].insert_one(new_org)

    # Update User: Set as Admin and link to this Org
    await db["users"].update_one(
        {"_id": current_user.id},
        {"$set": {"current_org_id": new_org["_id"], "role": "admin"}}
    )
    
    return new_org

# 2. ADD MEMBERS (Invite to Org)
@router.post("/members")
async def add_member_to_org(
    payload: MemberAddRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Adds a user to the Organization's global directory.
    Does NOT assign them to specific projects yet.
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only Admins can add members")
    
    db = get_database()
    org_id = current_user.current_org_id
    
    # 1. Find or Create User
    existing_user = await db["users"].find_one({"email": payload.email})
    
    if existing_user:
        user_id = existing_user["_id"]
        # Update User's context to this Org
        await db["users"].update_one(
            {"_id": user_id},
            {"$set": {"current_org_id": org_id, "role": payload.role}}
        )
    else:
        # Create Invite User (Placeholder)
        user_id = str(ObjectId())
        new_user = {
            "_id": user_id,
            "email": payload.email,
            "name": payload.name,
            "role": payload.role,
            "current_org_id": org_id,
            "created_at": datetime.utcnow()
        }
        await db["users"].insert_one(new_user)
    
    # 2. Add to specific Org List
    # Map role to database field
    list_map = {
        "admin": "admin_ids",
        "manager": "manager_ids",
        "employee": "employee_ids"
    }
    target_list = list_map.get(payload.role, "employee_ids")
    
    await db["organizations"].update_one(
        {"_id": org_id},
        {"$addToSet": {target_list: user_id}}
    )
    
    return {"status": "success", "message": f"User added as {payload.role}"}

# 3. REMOVE MEMBERS
@router.delete("/members/{user_id}")
async def remove_member_from_org(
    user_id: str,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only Admins can remove members")
    
    db = get_database()
    org_id = current_user.current_org_id
    
    # 1. Remove from Organization Lists
    await db["organizations"].update_one(
        {"_id": org_id},
        {"$pull": {
            "admin_ids": user_id,
            "manager_ids": user_id,
            "employee_ids": user_id
        }}
    )
    
    # 2. Unlink User
    await db["users"].update_one(
        {"_id": user_id},
        {"$unset": {"current_org_id": ""}, "$set": {"role": "user"}}
    )
    
    # 3. Remove from all Projects in this Org (Cleanup)
    # Note: We must check both singular manager_id and list employee_ids
    await db["projects"].update_many(
        {"organization_id": org_id},
        {
            "$pull": {"employee_ids": user_id},
            # If they were a manager, we might want to unset the manager_id 
            # or handle it manually. For now, we leave the manager field as is 
            # to avoid leaving a project without a manager field entirely.
        }
    )
    
    return {"status": "success", "message": "Member removed"}

# 4. DASHBOARD (/me)
@router.get("/me")
async def get_my_organization_details(current_user: User = Depends(get_current_user)):
    """
    Returns the 'Dashboard' view: 
    - Organization Details
    - List of Projects (filtered by role)
    - User Stats
    """
    db = get_database()
    
    if not current_user.current_org_id:
        return {"message": "User not part of any organization"}
        
    org = await db["organizations"].find_one({"_id": current_user.current_org_id})
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    # Determine which projects to show based on Role
    project_query = {"organization_id": current_user.current_org_id}
    
    if current_user.role == "manager":
        # FIXED: Changed from 'manager_ids' to 'manager_id' to match Project model
        project_query["manager_id"] = current_user.id
    elif current_user.role == "employee":
        # Mongo finds the ID if it exists inside the employee_ids array
        project_query["employee_ids"] = current_user.id
    
    # Admins see all (default query)

    projects = await db["projects"].find(project_query).to_list(100)
    
    # Calculate Stats
    stats = {
        "total_admins": len(org.get("admin_ids", [])),
        "total_managers": len(org.get("manager_ids", [])),
        "total_employees": len(org.get("employee_ids", [])),
        "active_projects": len(projects)
    }

    return {
        "organization": org,
        "role": current_user.role,
        "stats": stats,
        "projects": projects
    }

# 5. UPDATE ORGANIZATION DETAILS
@router.put("/{org_id}")
async def update_organization(
    org_id: str,
    org_update: OrganizationUpdate = Body(...),
    current_user: User = Depends(get_current_user)
):
    """
    Updates basic info: Name, Logo, URLs. 
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only Admins can update organization")

    db = get_database()
    
    # Validate ID matches current user's org
    if org_id != current_user.current_org_id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    # Clean payload (remove None values) using Pydantic V2 syntax
    # If using Pydantic V1 use: org_update.dict(exclude_unset=True)
    update_data = org_update.dict(exclude_unset=True)
    
    if not update_data:
         raise HTTPException(status_code=400, detail="No data provided")

    await db["organizations"].update_one(
        {"_id": org_id},
        {"$set": update_data}
    )

    return {"status": "success", "message": "Organization updated"}

# 6. Join an Organization (Optional)
class JoinOrgRequest(BaseModel):
    token: str  # The last 6 characters of the Org ID
    role: str = "employee" # User specifies their role (admin, manager, employee)

# 6. JOIN ORGANIZATION (User Initiated)
@router.post("/join/{org_id}")
async def join_organization(
    org_id: str,
    payload: JoinOrgRequest,
    current_user: User = Depends(get_current_user)
):
    """
    User joins an organization by providing the 'Special Token' 
    (which is the last 6 characters of the Organization ID).
    """
    db = get_database()

    # 1. Validate ObjectId format
    if not ObjectId.is_valid(org_id):
        raise HTTPException(status_code=400, detail="Invalid Organization ID format")
    
    # 2. Verify Token (Must be last 6 chars of the Org ID)
    # Example: If ID is "65d4...123456", token must be "123456"
    expected_token = str(org_id)[-6:]
    
    if payload.token != expected_token:
        raise HTTPException(status_code=403, detail="Invalid join token")

    # 3. Fetch Organization
    org = await db["organizations"].find_one({"_id": org_id})
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    # 4. Check if User is Already a Member
    # Collect all existing member IDs
    all_members = org.get("admin_ids", []) + org.get("manager_ids", []) + org.get("employee_ids", [])
    
    if current_user.id in all_members:
        raise HTTPException(status_code=400, detail="You are already a member of this organization")

    # 5. Determine which list to add them to
    target_list = "employee_ids" # Default
    if payload.role == "admin": 
        target_list = "admin_ids"
    elif payload.role == "manager": 
        target_list = "manager_ids"

    # 6. Update Organization (Add to role list)
    await db["organizations"].update_one(
        {"_id": org_id},
        {"$addToSet": {target_list: current_user.id}}
    )

    # 7. Update User Profile (Link to Org)
    await db["users"].update_one(
        {"_id": current_user.id},
        {"$set": {
            "current_org_id": org_id, 
            "role": payload.role
        }}
    )

    return {
        "status": "success", 
        "message": f"Successfully joined {org['name']} as {payload.role}"
    }