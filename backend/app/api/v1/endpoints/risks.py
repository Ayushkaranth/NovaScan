from fastapi import APIRouter, HTTPException, Depends, Query
from app.core.database import get_database
from app.models.user import User
from app.api.v1.endpoints.auth import get_current_user
from bson import ObjectId

router = APIRouter()

@router.get("/")
async def get_org_risks(
    project_id: str = Query(None, description="Optional Project ID"),
    limit: int = 50,
    current_user: User = Depends(get_current_user)
):
    db = get_database()
    org_id = current_user.current_org_id

    if not org_id:
        return []

    # If project_id is provided, filter by it
    filter_query = {"org_id": org_id}
    if project_id:
         # Resolve Project ID (ObjectId or String)
         if ObjectId.is_valid(project_id):
             filter_query["project_id"] = {"$in": [project_id, ObjectId(project_id)]}
         else:
             filter_query["project_id"] = project_id


    # Fetch risks (scans with issues)
    # We might need to aggregate to get project names if they aren't in the scan
    # For now, let's assume 'repo' field in scan is enough or we fetch recent scans
    
    # Simple find for now
    scans = await db["scans"].find(filter_query) \
        .sort("timestamp", -1) \
        .limit(limit) \
        .to_list(length=limit)

    # 🚨 CRITICAL FIX: Convert ObjectId to String for JSON serialization 🚨
    results = []
    for scan in scans:
        if "_id" in scan:
            scan["_id"] = str(scan["_id"])
        if "org_id" in scan:
             scan["org_id"] = str(scan["org_id"])
        
        # Enrich with project name if missing (Mock for speed if needed, or simple lookup)
        # Ideally scans have 'repo' field.
        results.append(scan)

    return results