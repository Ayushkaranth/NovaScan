from app.services.intelligence.risk_analyzer import analyze_risk
from app.services.intelligence.graph_manager import update_knowledge_graph
from app.services.delivery.notification_manager import dispatch_notifications
from app.core.database import get_database

async def process_event_intelligence(event_id: str):
    db = get_database()
    event = await db["events"].find_one({"_id": event_id})
    if not event: return

    # 1. Update Knowledge Graph (New!)
    await update_knowledge_graph(event)

    # 2. Analyze Risk
    analysis = await analyze_risk(event)
    
    # 3. Save Analysis
    await db["events"].update_one(
        {"_id": event_id},
        {"$set": {"analysis": analysis}}
    )

    # 4. Dispatch Notifications (New!)
    await dispatch_notifications(event["org_id"], analysis, event)