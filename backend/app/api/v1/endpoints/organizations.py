from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List, Dict, Optional
from pydantic import EmailStr, BaseModel
from datetime import datetime
from bson import ObjectId

# Models
from app.models.organization import Organization, OrganizationCreate, OrganizationUpdate
from app.models.user import User

# Core & Utils
from app.api.v1.endpoints.auth import get_current_user
from app.core.database import get_database

router = APIRouter()

# --- Helper Schema ---
class MemberAddRequest(BaseModel):
    email: EmailStr
    name: str
    role: str = "employee"

class JoinOrgRequest(BaseModel):
    token: str 
    role: str = "employee"

# 1. CREATE ORGANIZATION
@router.post("/", response_model=Organization)
async def create_organization(
    org_in: OrganizationCreate,
    current_user: User = Depends(get_current_user)
):
    db = get_database()
    
    new_org = {
        "_id": str(ObjectId()),
        "name": org_in.name,
        "slug": org_in.slug,
        "logo": org_in.logo,
        "website_url": org_in.website_url,
        "linkedin_url": org_in.linkedin_url,
        "owner_id": current_user.id,
        "admin_ids": [current_user.id], 
        "manager_ids": [],
        "employee_ids": [],
        "created_at": datetime.utcnow()
    }

    await db["organizations"].insert_one(new_org)

    # Update User
    await db["users"].update_one(
        {"_id": current_user.id},
        {"$set": {"current_org_id": new_org["_id"], "role": "admin"}}
    )
    
    return new_org

# 2. ADD MEMBERS
@router.post("/members")
async def add_member_to_org(
    payload: MemberAddRequest,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only Admins can add members")
    
    db = get_database()
    org_id = current_user.current_org_id
    
    # Find or Create User
    existing_user = await db["users"].find_one({"email": payload.email})
    
    if existing_user:
        user_id = existing_user["_id"]
        await db["users"].update_one(
            {"_id": user_id},
            {"$set": {"current_org_id": org_id, "role": payload.role}}
        )
    else:
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
    
    # Add to specific Org List
    list_map = {"admin": "admin_ids", "manager": "manager_ids", "employee": "employee_ids"}
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
    
    await db["organizations"].update_one(
        {"_id": org_id},
        {"$pull": {
            "admin_ids": user_id,
            "manager_ids": user_id,
            "employee_ids": user_id
        }}
    )
    
    await db["users"].update_one(
        {"_id": user_id},
        {"$unset": {"current_org_id": ""}, "$set": {"role": "user"}}
    )
    
    # Cleanup from projects
    await db["projects"].update_many(
        {"organization_id": org_id},
        {"$pull": {"employee_ids": user_id}}
    )
    
    return {"status": "success", "message": "Member removed"}

# 4. DASHBOARD (/me) - 🚨 FIXED 🚨
@router.get("/me")
async def get_my_organization_details(current_user: User = Depends(get_current_user)):
    db = get_database()
    
    if not current_user.current_org_id:
        return {"message": "User not part of any organization"}
        
    # Robust Lookup (String OR ObjectId)
    org_query = {"_id": current_user.current_org_id}
    if ObjectId.is_valid(current_user.current_org_id):
        org_query = {"$or": [
            {"_id": current_user.current_org_id},
            {"_id": ObjectId(current_user.current_org_id)}
        ]}

    org = await db["organizations"].find_one(org_query)
    
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    # 1. Convert Org ID to String (Prevents Crash)
    org["_id"] = str(org["_id"])

    # Determine projects based on Role
    project_query = {"organization_id": str(org["_id"])} # Ensure matching type
    
    if current_user.role == "manager":
        project_query["manager_id"] = current_user.id
    elif current_user.role == "employee":
        project_query["employee_ids"] = current_user.id
    
    projects = await db["projects"].find(project_query).to_list(100)
    
    # 2. Convert Project IDs to Strings (Prevents Crash)
    for p in projects:
        p["_id"] = str(p["_id"])
        p["organization_id"] = str(p["organization_id"])

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

# 5. UPDATE ORGANIZATION
@router.put("/{org_id}")
async def update_organization(
    org_id: str,
    org_update: OrganizationUpdate = Body(...),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only Admins can update organization")

    db = get_database()
    
    if org_id != current_user.current_org_id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    update_data = org_update.dict(exclude_unset=True)
    
    if not update_data:
         raise HTTPException(status_code=400, detail="No data provided")

    await db["organizations"].update_one(
        {"_id": org_id},
        {"$set": update_data}
    )

    return {"status": "success", "message": "Organization updated"}

# 6. JOIN ORGANIZATION
@router.post("/join/{org_id}")
async def join_organization(
    org_id: str,
    payload: JoinOrgRequest,
    current_user: User = Depends(get_current_user)
):
    db = get_database()

    if not ObjectId.is_valid(org_id):
        raise HTTPException(status_code=400, detail="Invalid Organization ID format")
    
    # Simple Token Check (Last 6 chars of ID)
    expected_token = str(org_id)[-6:]
    
    if payload.token != expected_token:
        raise HTTPException(status_code=403, detail="Invalid join token")

    org = await db["organizations"].find_one({"_id": org_id})
    if not org: # Try ObjectId if string fail
        org = await db["organizations"].find_one({"_id": ObjectId(org_id)})
        if not org:
             raise HTTPException(status_code=404, detail="Organization not found")
    
    # Get the real ID string from the found doc
    real_org_id = str(org["_id"])

    # Check already member
    all_members = org.get("admin_ids", []) + org.get("manager_ids", []) + org.get("employee_ids", [])
    if current_user.id in all_members:
        raise HTTPException(status_code=400, detail="You are already a member")

    target_list = "employee_ids"
    if payload.role == "admin": target_list = "admin_ids"
    elif payload.role == "manager": target_list = "manager_ids"

    await db["organizations"].update_one(
        {"_id": org["_id"]}, # Use the original ID format from DB
        {"$addToSet": {target_list: current_user.id}}
    )

    await db["users"].update_one(
        {"_id": current_user.id},
        {"$set": {
            "current_org_id": real_org_id, 
            "role": payload.role
        }}
    )

    return {"status": "success", "message": f"Successfully joined {org['name']}"}

# 7. MEMBER LIST
@router.get("/members/list")
async def get_organization_members(current_user: User = Depends(get_current_user)):
    db = get_database()
    
    if not current_user.current_org_id:
        raise HTTPException(status_code=400, detail="No organization found")

    org = await db["organizations"].find_one({"_id": current_user.current_org_id})
    # Fallback lookup
    if not org and ObjectId.is_valid(current_user.current_org_id):
         org = await db["organizations"].find_one({"_id": ObjectId(current_user.current_org_id)})

    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    all_member_ids = org.get("admin_ids", []) + org.get("manager_ids", []) + org.get("employee_ids", [])
    
    users = await db["users"].find(
        {"_id": {"$in": all_member_ids}},
        {"_id": 1, "name": 1, "email": 1, "role": 1}
    ).to_list(length=1000)

    return {"members": users}