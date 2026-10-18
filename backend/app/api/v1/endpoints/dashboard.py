from fastapi import APIRouter, Depends
from app.models.user import User
from app.api.v1.endpoints.auth import get_current_user
from app.core.database import get_database

router = APIRouter()

@router.get("/stats")
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    db = get_database()
    org_id = current_user.current_org_id

    if not org_id:
        return {
            "total_risks": 0,
            "active_integrations": 0,
            "recent_activity": []
        }

    # 1. Count Total Risks
    total_risks = await db["events"].count_documents({
        "org_id": org_id, 
        "analysis.is_risky": True
    })

    # 2. Recent Activity
    recent_events = await db["events"].find(
        {"org_id": org_id}
    ).sort("created_at", -1).limit(5).to_list(length=5)

    # 3. Risk Distribution
    return {
        "total_risks": total_risks,
        "active_integrations": await db["integrations"].count_documents({"org_id": org_id}),
        "recent_activity": [
            {
                "summary": e.get("summary", "No summary available"),
                "risk_score": e.get("analysis", {}).get("risk_score", 0)
            } 
            for e in recent_events
        ]
    }