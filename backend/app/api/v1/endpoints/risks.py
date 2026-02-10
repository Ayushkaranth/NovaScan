from fastapi import APIRouter, HTTPException, Depends, Query
from app.core.database import get_database
from app.models.user import User
from app.api.v1.endpoints.auth import get_current_user
from bson import ObjectId

router = APIRouter()

# GET /api/v1/risks?project_id=...
@router.get("/")
async def get_project_risks(
    project_id: str = Query(..., description="The Project ID to fetch scans for"),
    limit: int = 20,
    current_user: User = Depends(get_current_user)
):
    """
    Returns the scan/risk history for a specific project.
    It works by:
    1. Looking up the Project to get the Repo Name (e.g. 'owner/repo')
    2. Querying the 'scans' collection for that Repo.
    """
    db = get_database()

    # 1. Get Project to find the Repo Name
    project = await db["projects"].find_one({
        "$or": [{"_id": project_id}, {"_id": ObjectId(project_id) if ObjectId.is_valid(project_id) else "dummy"}]
    })

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Construct the full repo name as stored in Webhooks (e.g., "ayush/novascan")
    repo_full_name = f"{project.get('repo_owner')}/{project.get('repo_name')}"

    # 2. Query the 'scans' collection (This is where webhooks.py saves data)
    cursor = db["scans"].find({"repo": repo_full_name}) \
        .sort("timestamp", -1) \
        .limit(limit)
    
    scans = await cursor.to_list(length=limit)

    return scans