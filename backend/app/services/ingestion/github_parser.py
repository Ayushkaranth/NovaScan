from app.core.database import get_database
from app.models.event import Event
from app.workers.tasks import process_event_intelligence  # <--- The Brain Connection
from bson import ObjectId
from datetime import datetime

async def process_github_event(raw_event_id: str, payload: dict):
    db = get_database()
    
    # 1. Fetch Raw Record to get Org ID
    raw_record = await db["raw_events"].find_one({"_id": ObjectId(raw_event_id)})
    if not raw_record:
        return

    org_id = raw_record["org_id"]
    event_type = raw_record["event_type"]
    
    standard_event = None
    
    try:
        # --- LOGIC: Handle Pull Requests ---
        if event_type == "pull_request":
            pr = payload["pull_request"]
            action = payload["action"]
            
            if action in ["opened", "edited", "closed", "synchronize"]:
                standard_event = {
                    "org_id": org_id,
                    "source": "github",
                    "source_id": str(pr["number"]),
                    "actor": payload["sender"]["login"],
                    "action": f"pr_{action}",
                    "summary": f"PR #{pr['number']}: {pr['title']}",
                    "content": pr["body"] or "No description provided.",
                    "meta": {
                        "repo": payload["repository"]["full_name"],
                        "url": pr["html_url"],
                        "merged": pr.get("merged", False),
                        "diff_url": pr.get("diff_url"),
                        "state": pr["state"]
                    },
                    "created_at": datetime.utcnow()
                }

        # --- LOGIC: Handle Code Pushes ---
        elif event_type == "push":
            commits = payload.get("commits", [])
            if not commits:
                return

            # Combine all commit messages into one analysis block
            commit_messages = [f"- {c['message']} (Files: {', '.join(c.get('modified', []))})" for c in commits]
            full_content = "\n".join(commit_messages)
            
            standard_event = {
                "org_id": org_id,
                "source": "github",
                "source_id": payload["head_commit"]["id"][:7],
                "actor": payload["sender"]["login"],
                "action": "pushed_code",
                "summary": f"Pushed {len(commits)} commits to {payload['ref'].replace('refs/heads/', '')}",
                "content": full_content,
                "meta": {
                    "repo": payload["repository"]["full_name"],
                    "url": payload["head_commit"]["url"],
                    "branch": payload['ref']
                },
                "created_at": datetime.utcnow()
            }

        # 3. Save & Trigger Brain
        if standard_event:
            # Assign a new ID for the standardized event
            standard_event["_id"] = str(ObjectId())
            
            # Insert into 'events' collection
            await db["events"].insert_one(standard_event)
            
            print(f"✅ Parsed GitHub Event: {standard_event['summary']}")

            # --- CRITICAL: Call the AI Worker ---
            # This sends the event ID to the background task to run Gemini analysis
            await process_event_intelligence(standard_event["_id"])
            
            # Mark raw event as done
            await db["raw_events"].update_one(
                {"_id": ObjectId(raw_event_id)},
                {"$set": {"status": "processed"}}
            )

    except Exception as e:
        print(f"❌ Error parsing GitHub event: {e}")
        await db["raw_events"].update_one(
            {"_id": ObjectId(raw_event_id)},
            {"$set": {"status": "error", "error": str(e)}}
        )