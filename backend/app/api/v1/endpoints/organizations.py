from fastapi import APIRouter, Depends, HTTPException
from app.models.organization import Organization, OrganizationCreate
from app.models.user import User
from app.api.v1.endpoints.auth import get_current_user
from app.core.database import get_database
from bson import ObjectId
from datetime import datetime
from typing import List, Optional, Dict

router = APIRouter()

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
        "owner_id": current_user.id,
        "members": [current_user.id],
        "created_at": datetime.utcnow()
    }
    await db["organizations"].insert_one(new_org)
    await db["users"].update_one(
        {"email": current_user.email},
        {"$set": {"current_org_id": new_org["_id"]}}
    )
    return new_org

@router.get("/me", response_model=Organization)
async def get_my_organization(current_user: User = Depends(get_current_user)):
    db = get_database()
    if not current_user.current_org_id:
        raise HTTPException(status_code=404, detail="User has no organization")
    org = await db["organizations"].find_one({"_id": current_user.current_org_id})
    if org:
        org["_id"] = str(org["_id"])
    return org

@router.get("/{org_id}/scans")
async def get_org_scans(org_id: str):
    db = get_database()
    # Query scans as string since that's how onboarding saves them
    scans = await db["scans"].find({"org_id": str(org_id)}).sort("timestamp", -1).to_list(10)
    for scan in scans:
        scan["_id"] = str(scan["_id"])
    return scans

@router.get("/list/all", response_model=List[Organization])
async def list_user_organizations(current_user: User = Depends(get_current_user)):
    """Lists all projects the user belongs to, with data cleaning for Pydantic"""
    db = get_database()
    projects = await db["organizations"].find({
        "$or": [
            {"members": current_user.id},
            {"owner_id": current_user.id}
        ]
    }).to_list(100)

    # Clean data to match the Organization model requirements
    for p in projects:
        p["_id"] = str(p["_id"])
        # Ensure 'slug' exists to avoid missing field error
        if "slug" not in p:
            p["slug"] = p.get("name", "project").lower().replace(" ", "-")
        # Ensure 'created_at' exists
        if "created_at" not in p:
            p["created_at"] = datetime.utcnow()
            
    return projects

@router.get("/my-dashboard")
async def get_dashboard_data(current_user: User = Depends(get_current_user)):
    db = get_database()
    
    # 1. Fetch Projects assigned to me
    # If Manager: projects where I am a key in assignments
    # If Employee: projects where I am in the list of a value in assignments
    query = {
        "$or": [
            {f"assignments.{current_user.id}": {"$exists": True}},
            {"members": current_user.id}
        ]
    }
    projects = await db["organizations"].find(query).to_list(100)
    
    # 2. Fetch Unread Notifications
    notifications = await db["notifications"].find({
        "user_id": current_user.id,
        "is_read": False
    }).sort("created_at", -1).to_list(20)
    
    return {
        "projects": projects,
        "notifications": notifications,
        "role": current_user.role # Ensure role is returned
    }

@router.delete("/{org_id}")
async def delete_organization(
    org_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Permanently deletes a project/organization.
    """
    db = get_database()

    # 1. Verify the project exists
    if not ObjectId.is_valid(org_id):
         raise HTTPException(status_code=400, detail="Invalid Project ID")
         
    org = await db["organizations"].find_one({"_id": ObjectId(org_id)})
    
    if not org:
        raise HTTPException(status_code=404, detail="Project not found")

    # 2. (Optional) Permission Check
    # Ensure only the owner or HR can delete (uncomment if needed)
    # if org.get("owner_id") != str(current_user.id) and current_user.role != "hr":
    #     raise HTTPException(status_code=403, detail="Not authorized to delete this project")

    # 3. Delete the Organization
    result = await db["organizations"].delete_one({"_id": ObjectId(org_id)})

    if result.deleted_count == 1:
        return {"status": "success", "message": f"Project '{org.get('name')}' deleted successfully"}
    
    raise HTTPException(status_code=500, detail="Failed to delete project")