from fastapi import APIRouter, HTTPException, Depends
from app.core.database import get_database
from app.models.user import User
from app.api.v1.endpoints.auth import get_current_user
from bson import ObjectId

router = APIRouter()

@router.get("/{project_id}")
async def get_project_details(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    db = get_database()

    # Create a search query that looks for EITHER:
    # 1. The ID as a simple string (e.g., "my-project-id")
    # 2. The ID as a MongoDB ObjectId (e.g., ObjectId("65d4..."))
    search_criteria = [{"_id": project_id}]
    
    if ObjectId.is_valid(project_id):
        search_criteria.append({"_id": ObjectId(project_id)})

    # Execute the query
    project = await db["projects"].find_one({"$or": search_criteria})

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    return project