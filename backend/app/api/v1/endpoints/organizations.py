from fastapi import APIRouter, Depends, HTTPException
from app.models.organization import Organization, OrganizationCreate
from app.models.user import User
from app.api.v1.endpoints.auth import get_current_user
from app.core.database import get_database
from bson import ObjectId
from datetime import datetime
from typing import List

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