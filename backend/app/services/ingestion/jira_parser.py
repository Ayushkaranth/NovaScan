from app.core.database import get_database
from app.workers.tasks import process_event_intelligence # <--- The Brain Connection
from bson import ObjectId
from datetime import datetime

async def process_jira_event(raw_event_id: str, payload: dict):
    db = get_database()
    
    raw_record = await db["raw_events"].find_one({"_id": ObjectId(raw_event_id)})
    if not raw_record:
        return

    org_id = raw_record["org_id"]
    event_type = payload.get("webhookEvent", "jira:issue_updated")
    
    standard_event = None

    try:
        issue = payload.get("issue", {})
        fields = issue.get("fields", {})
        key = issue.get("key") # e.g. "PROJ-123"
        
        # 1. Handle Issue Created
        if event_type == "jira:issue_created":
            standard_event = {
                "org_id": org_id,
                "source": "jira",
                "source_id": key,
                "actor": payload.get("user", {}).get("displayName", "Unknown"),
                "action": "ticket_created",
                "summary": f"New Ticket {key}: {fields.get('summary', '')}",
                "content": fields.get("description") or "No description.",
                "meta": {
                    "status": fields.get("status", {}).get("name"),
                    "priority": fields.get("priority", {}).get("name"),
                    "url": f"{payload.get('self', '').split('/rest')[0]}/browse/{key}"
                },
                "created_at": datetime.utcnow()
            }

        # 2. Handle Issue Updated (Status Changes)
        elif event_type == "jira:issue_updated":
            # Check changelog for status moves
            changelog = payload.get("changelog", {}).get("items", [])
            
            for change in changelog:
                if change["field"] == "status":
                    from_string = change["fromString"]
                    to_string = change["toString"]
                    
                    standard_event = {
                        "org_id": org_id,
                        "source": "jira",
                        "source_id": key,
                        "actor": payload.get("user", {}).get("displayName", "Unknown"),
                        "action": "status_change",
                        "summary": f"Moved {key} from {from_string} to {to_string}",
                        "content": f"Ticket status changed. This might impact dependencies.",
                        "meta": {
                            "previous_status": from_string,
                            "new_status": to_string,
                            "url": f"{payload.get('self', '').split('/rest')[0]}/browse/{key}"
                        },
                        "created_at": datetime.utcnow()
                    }
                    break 

        # 3. Save & Trigger Brain
        if standard_event:
            standard_event["_id"] = str(ObjectId())
            await db["events"].insert_one(standard_event)
            
            print(f"✅ Parsed Jira Event: {standard_event['summary']}")
            
            # --- CRITICAL: Call the AI Worker ---
            await process_event_intelligence(standard_event["_id"])
            
            await db["raw_events"].update_one(
                {"_id": ObjectId(raw_event_id)},
                {"$set": {"status": "processed"}}
            )

    except Exception as e:
        print(f"❌ Error parsing Jira event: {e}")
        await db["raw_events"].update_one(
            {"_id": ObjectId(raw_event_id)},
            {"$set": {"status": "error", "error": str(e)}}
        )