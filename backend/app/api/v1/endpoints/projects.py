from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List, Optional
from bson import ObjectId
from datetime import datetime

from app.models.user import User
from app.api.v1.endpoints.auth import get_current_user
from app.core.database import get_database

router = APIRouter()

# 1. LIST PROJECTS (Filtered by User Role)
@router.get("/")
async def list_projects(
    limit: int = 100, 
    current_user: User = Depends(get_current_user)
):
    db = get_database()
    
    if not current_user.current_org_id:
        return []

    # Filter based on role
    query = {"organization_id": current_user.current_org_id}
    
    # Robust query for managers and employees
    if current_user.role == "manager":
        query["manager_id"] = current_user.id
    elif current_user.role == "employee":
        query["employee_ids"] = current_user.id
        
    projects = await db["projects"].find(query).limit(limit).to_list(limit)

    # 🚨 FIX: Convert ObjectIds to Strings
    results = []
    for p in projects:
        p["_id"] = str(p["_id"])
        if "organization_id" in p:
            p["organization_id"] = str(p["organization_id"])
        results.append(p)

    return results

# 2. GET SINGLE PROJECT
@router.get("/{project_id}")
async def get_project(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    db = get_database()

    # Allow lookup by String or ObjectId
    query = {"_id": project_id}
    if ObjectId.is_valid(project_id):
        query = {"$or": [{"_id": project_id}, {"_id": ObjectId(project_id)}]}

    project = await db["projects"].find_one(query)

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Security Check: Must belong to user's org
    # (We convert both to strings to be safe)
    if str(project.get("organization_id")) != str(current_user.current_org_id):
         raise HTTPException(status_code=403, detail="Access denied")

    # 🚨 FIX: Convert ObjectId to String to prevent 500 Crash
    project["_id"] = str(project["_id"])
    project["organization_id"] = str(project["organization_id"])

    return project

# 3. DELETE PROJECT
@router.delete("/{project_id}")
async def delete_project(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only Admins can delete projects")

    db = get_database()
    
    query = {"_id": project_id}
    if ObjectId.is_valid(project_id):
        query = {"_id": ObjectId(project_id)}

    result = await db["projects"].delete_one(query)

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")

    return {"status": "success", "message": "Project deleted"}