from fastapi import APIRouter, HTTPException, Depends
from app.core.database import get_database
from app.models.user import User
from app.api.v1.endpoints.auth import get_current_user
from bson import ObjectId

router = APIRouter()

# GET /api/v1/projects/{project_id}
@router.get("/{project_id}")
async def get_project_details(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Fetches a single project by ID.
    """
    db = get_database()

    # Validate ID
    if not ObjectId.is_valid(project_id):
        raise HTTPException(status_code=400, detail="Invalid Project ID")

    # Find Project
    project = await db["projects"].find_one({"_id": project_id})
    
    if not project:
        # Fallback: Try searching by ObjectId if string search fails
        project = await db["projects"].find_one({"_id": ObjectId(project_id)})

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Access Control (Optional: Check if user is in org)
    # if project["organization_id"] != current_user.current_org_id: ...

    return project