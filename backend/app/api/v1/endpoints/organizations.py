from fastapi import APIRouter, Depends, HTTPException, Body, Query
from typing import List, Dict, Optional
from pydantic import EmailStr, BaseModel
from datetime import datetime
from bson import ObjectId
import re

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
    project_id: Optional[str] = None

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
    if current_user.role not in ("admin", "hr"):
        raise HTTPException(status_code=403, detail="Only admins and HR can add organization members")
    role = payload.role.strip().lower()
    if role not in ("admin", "manager", "hr", "employee"):
        raise HTTPException(status_code=422, detail="Role must be admin, manager, HR, or employee")
    if current_user.role == "hr" and role == "admin":
        raise HTTPException(status_code=403, detail="HR cannot grant admin access")
    
    db = get_database()
    org_id = current_user.current_org_id

    project = None
    if payload.project_id:
        project_query = {"_id": payload.project_id}
        if ObjectId.is_valid(payload.project_id):
            project_query = {"$or": [{"_id": payload.project_id}, {"_id": ObjectId(payload.project_id)}]}
        project = await db["projects"].find_one(project_query)
        if not project or str(project.get("organization_id")) != str(org_id):
            raise HTTPException(status_code=404, detail="Project not found in your organization")
    
    # Find or Create User
    existing_user = await db["users"].find_one({"email": payload.email})
    
    if existing_user:
        if existing_user.get("current_org_id") and str(existing_user.get("current_org_id")) != str(org_id):
            raise HTTPException(status_code=409, detail="This account already belongs to another organization")
        user_id = existing_user["_id"]
        await db["users"].update_one(
            {"_id": user_id},
            {"$set": {"current_org_id": org_id, "role": role, "full_name": payload.name.strip()},
             "$unset": {"name": ""}}
        )
    else:
        user_id = str(ObjectId())
        new_user = {
            "_id": user_id,
            "email": payload.email,
            "full_name": payload.name.strip(),
            "role": role,
            "current_org_id": org_id,
            "created_at": datetime.utcnow()
        }
        await db["users"].insert_one(new_user)
    
    # Add to specific Org List
    list_map = {"admin": "admin_ids", "manager": "manager_ids", "hr": "employee_ids", "employee": "employee_ids"}
    target_list = list_map[role]
    
    membership_id_values = [user_id, str(user_id)]
    await db["organizations"].update_one(
        {"_id": org_id},
        {"$pull": {"admin_ids": {"$in": membership_id_values}, "manager_ids": {"$in": membership_id_values}, "employee_ids": {"$in": membership_id_values}}}
    )
    await db["organizations"].update_one(
        {"_id": org_id},
        {"$addToSet": {target_list: user_id}}
    )
    if project is not None:
        await db["projects"].update_one(
            {"_id": project["_id"]},
            {"$addToSet": {"employee_ids": str(user_id)}}
        )
    
    return {"status": "success", "message": f"User added as {role}", "user_id": str(user_id)}

# 3. REMOVE MEMBERS
@router.delete("/members/{user_id}")
async def remove_member_from_org(
    user_id: str,
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ("admin", "hr", "manager"):
        raise HTTPException(status_code=403, detail="You do not have permission to remove organization members")
    
    db = get_database()
    org_id = current_user.current_org_id

    id_query = {"$or": [{"_id": user_id}]}
    if ObjectId.is_valid(user_id):
        id_query["$or"].append({"_id": ObjectId(user_id)})
    target_user = await db["users"].find_one(id_query)
    if not target_user or str(target_user.get("current_org_id")) != str(org_id):
        raise HTTPException(status_code=404, detail="Organization member not found")
    if current_user.role == "manager" and target_user.get("role") != "employee":
        raise HTTPException(status_code=403, detail="Managers can remove employee members only")

    target_id = target_user["_id"]
    id_values = [target_id, str(target_id)]
    
    await db["organizations"].update_one(
        {"_id": org_id},
        {"$pull": {"admin_ids": {"$in": id_values}, "manager_ids": {"$in": id_values}, "employee_ids": {"$in": id_values}}}
    )
    
    await db["users"].update_one(
        {"_id": target_id},
        {"$unset": {"current_org_id": ""}, "$set": {"role": "user"}}
    )
    
    # Cleanup from projects
    await db["projects"].update_many(
        {"organization_id": org_id},
        {"$pull": {"employee_ids": {"$in": id_values}}}
    )
    
    return {"status": "success", "message": "Member removed"}

# 4. DASHBOARD (/me) - 🚨 FIXED 🚨
@router.get("/me")
async def get_my_organization_details(current_user: User = Depends(get_current_user)):
    db = get_database()
    
    if not current_user.current_org_id:
        return {"organization": None, "role": current_user.role, "stats": {}, "projects": []}
        
    # Robust Lookup (String OR ObjectId)
    org_query = {"_id": current_user.current_org_id}
    if ObjectId.is_valid(current_user.current_org_id):
        org_query = {"$or": [
            {"_id": current_user.current_org_id},
            {"_id": ObjectId(current_user.current_org_id)}
        ]}

    org = await db["organizations"].find_one(org_query)
    
    if not org:
        return {"organization": None, "role": current_user.role, "stats": {}, "projects": []}

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
async def get_organization_members(
    search: Optional[str] = Query(default=None, min_length=1, max_length=100),
    member_ids: Optional[str] = Query(default=None, max_length=20000),
    limit: int = Query(default=1000, ge=1, le=2000),
    current_user: User = Depends(get_current_user),
):
    db = get_database()
    
    if not current_user.current_org_id:
        raise HTTPException(status_code=400, detail="No organization found")

    org = await db["organizations"].find_one({"_id": current_user.current_org_id})
    # Fallback lookup
    if not org and ObjectId.is_valid(current_user.current_org_id):
         org = await db["organizations"].find_one({"_id": ObjectId(current_user.current_org_id)})

    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    role_lists = (
        ("admin", org.get("admin_ids", [])),
        ("manager", org.get("manager_ids", [])),
        ("employee", org.get("employee_ids", [])),
    )
    role_by_id = {}
    raw_member_ids = []
    for role, ids in role_lists:
        for member_id in ids:
            key = str(member_id)
            role_by_id[key] = role
            raw_member_ids.append(member_id)
            if ObjectId.is_valid(key):
                raw_member_ids.append(ObjectId(key))

    # MongoDB distinguishes a string ID from an ObjectId with the same text.
    # Keep both forms in the query; deduplicating by str(value) silently
    # discarded the string form used by existing NovaScan user documents.
    unique_ids = []
    seen_typed_ids = set()
    for value in raw_member_ids:
        typed_key = (type(value).__name__, str(value))
        if typed_key not in seen_typed_ids:
            seen_typed_ids.add(typed_key)
            unique_ids.append(value)
    if member_ids:
        requested_ids = {value.strip() for value in member_ids.split(",") if value.strip()}
        unique_ids = [value for value in unique_ids if str(value) in requested_ids]
    user_query = {"_id": {"$in": unique_ids}}
    if search and search.strip():
        pattern = re.escape(search.strip())
        user_query["$or"] = [
            {"full_name": {"$regex": pattern, "$options": "i"}},
            {"name": {"$regex": pattern, "$options": "i"}},
            {"email": {"$regex": pattern, "$options": "i"}},
            {"role": {"$regex": pattern, "$options": "i"}},
        ]
    result_limit = min(limit, 50) if search else limit
    user_cursor = db["users"].find(
        user_query,
        {"_id": 1, "name": 1, "full_name": 1, "email": 1, "role": 1,
         "profile_image": 1, "picture": 1, "avatar": 1, "current_org_id": 1}
    ).sort([("full_name", 1), ("email", 1)]).limit(result_limit + (1 if search else 0))
    users = await user_cursor.to_list(length=result_limit + (1 if search else 0))
    has_more = bool(search and len(users) > result_limit)
    if has_more:
        users = users[:result_limit]

    organization_id = str(org["_id"])
    project_org_ids = [organization_id]
    if ObjectId.is_valid(organization_id):
        project_org_ids.append(ObjectId(organization_id))
    org_projects = await db["projects"].find(
        {"organization_id": {"$in": project_org_ids}},
        {"_id": 1, "name": 1, "manager_id": 1, "employee_ids": 1}
    ).to_list(length=1000)

    project_assignments: Dict[str, List[Dict[str, str]]] = {}
    for project in org_projects:
        project_id = str(project.get("_id", ""))
        project_info = {"id": project_id, "name": project.get("name") or "Untitled project"}
        assigned_ids = [project.get("manager_id"), *(project.get("employee_ids") or [])]
        for assigned_id in assigned_ids:
            if assigned_id is not None:
                project_assignments.setdefault(str(assigned_id), []).append(project_info)

    members = []
    seen = set()
    org_name = org.get("name") or ""
    for user in users:
        user_id = str(user.get("_id", ""))
        if not user_id or user_id in seen:
            continue
        seen.add(user_id)
        assignments = project_assignments.get(user_id, [])
        member = {
            "_id": user_id,
            "employee_id": f"#{user_id[-6:].upper()}" if len(user_id) >= 6 else f"#{user_id.upper()}",
            "name": user.get("full_name") or user.get("name") or "",
            "email": user.get("email") or "",
            "role": user.get("role") if user.get("role") in ("admin", "manager", "hr", "employee") else role_by_id.get(user_id, "employee"),
            "profile_image": user.get("profile_image") or user.get("picture") or user.get("avatar"),
            "organization_name": org_name,
            "projects": assignments,
            "project": ", ".join(item["name"] for item in assignments),
        }
        members.append(member)

    return {"members": members, "organization_name": org_name, "has_more": has_more}
