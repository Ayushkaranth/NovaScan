from fastapi import APIRouter, HTTPException, Depends, Query
from app.core.database import get_database
from app.models.user import User
from app.api.v1.endpoints.auth import get_current_user
from bson import ObjectId

router = APIRouter()

@router.get("/")
async def get_project_risks(
    project_id: str = Query(..., description="The Project ID"),
    limit: int = 20,
    current_user: User = Depends(get_current_user)
):
    db = get_database()
    
    # 1. DUAL LOOKUP: Check for String OR ObjectId
    search_criteria = [{"_id": project_id}]
    
    if ObjectId.is_valid(project_id):
        search_criteria.append({"_id": ObjectId(project_id)})

    project = await db["projects"].find_one({"$or": search_criteria})

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # 2. Fetch Scans using the Repo Name
    # (Scans are stored by repo name in the webhook, e.g., "ayush/novascan")
    repo_full_name = f"{project.get('repo_owner')}/{project.get('repo_name')}"
    
    print(f"Fetching risks for: {repo_full_name}")  # Debug log

    scans = await db["scans"].find({"repo": repo_full_name}) \
        .sort("timestamp", -1) \
        .limit(limit) \
        .to_list(length=limit)

    return scans