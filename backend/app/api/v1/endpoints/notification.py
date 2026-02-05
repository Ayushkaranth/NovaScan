from fastapi import APIRouter, Depends
from app.api.v1.endpoints.auth import get_current_user
from app.models.user import User
from app.core.database import get_database
from typing import List

# --- ADD THIS LINE ---
router = APIRouter() 

@router.get("/my-notifications")
async def get_my_notifications(current_user: User = Depends(get_current_user)):
    db = get_database()
    notifications = await db["notifications"].find(
        {"user_id": current_user.id}
    ).sort("created_at", -1).to_list(20)
    
    for n in notifications:
        n["_id"] = str(n["_id"])
        
    return notifications