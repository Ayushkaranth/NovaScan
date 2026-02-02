from app.core.database import get_database
from app.workers.tasks import process_event_intelligence # <--- The Brain Connection
from bson import ObjectId
from datetime import datetime

async def process_slack_event(raw_event_id: str, payload: dict):
    db = get_database()
    
    raw_record = await db["raw_events"].find_one({"_id": ObjectId(raw_event_id)})
    if not raw_record:
        return

    org_id = raw_record["org_id"]
    event_body = payload.get("event", {})
    event_type = event_body.get("type")
    
    # Ignore bot messages to prevent infinite loops
    if event_body.get("bot_id") or event_body.get("subtype") == "bot_message":
        return

    standard_event = None

    try:
        # 1. Handle Standard Messages
        if event_type == "message" and "text" in event_body:
            text = event_body.get("text")
            channel = event_body.get("channel")
            user_id = event_body.get("user")
            
            standard_event = {
                "org_id": org_id,
                "source": "slack",
                "source_id": channel,
                "actor": user_id, 
                "action": "sent_message",
                "summary": f"Slack Msg: {text[:50]}...",
                "content": text,
                "meta": {
                    "channel_type": event_body.get("channel_type"),
                    "ts": event_body.get("ts"),
                    "thread_ts": event_body.get("thread_ts")
                },
                "created_at": datetime.utcnow()
            }

        # 2. Handle App Mentions (@LoopAI help)
        elif event_type == "app_mention":
            text = event_body.get("text")
            
            standard_event = {
                "org_id": org_id,
                "source": "slack",
                "source_id": event_body.get("channel"),
                "actor": event_body.get("user"),
                "action": "mentioned_bot",
                "summary": "User mentioned the bot",
                "content": text,
                "meta": {
                    "is_direct_command": True,
                    "ts": event_body.get("ts")
                },
                "created_at": datetime.utcnow()
            }

        # 3. Save & Trigger Brain
        if standard_event:
            standard_event["_id"] = str(ObjectId())
            await db["events"].insert_one(standard_event)
            
            print(f"✅ Parsed Slack Event: {standard_event['summary']}")
            
            # --- CRITICAL: Call the AI Worker ---
            await process_event_intelligence(standard_event["_id"])
            
            await db["raw_events"].update_one(
                {"_id": ObjectId(raw_event_id)},
                {"$set": {"status": "processed"}}
            )

    except Exception as e:
        print(f"❌ Error parsing Slack event: {e}")
        await db["raw_events"].update_one(
            {"_id": ObjectId(raw_event_id)},
            {"$set": {"status": "error", "error": str(e)}}
        )