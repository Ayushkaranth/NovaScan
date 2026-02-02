from app.core.database import get_database
from datetime import datetime

async def update_knowledge_graph(event: dict):
    """
    Extracts entities (Users, Files, Tickets) and creates edges in the DB.
    """
    db = get_database()
    org_id = event["org_id"]

    nodes = []
    edges = []

    # 1. Create Node for the Actor
    nodes.append({
        "id": event["actor"],
        "type": "User",
        "org_id": org_id
    })

    # 2. Create Node for the Source (PR or Ticket)
    nodes.append({
        "id": event["source_id"],
        "type": event["source"], # "github" or "jira"
        "org_id": org_id
    })

    # 3. Create Edge: Actor -> ACTED_ON -> Source
    edges.append({
        "from": event["actor"],
        "to": event["source_id"],
        "relation": event["action"],
        "timestamp": datetime.utcnow()
    })

    # Save to a dedicated 'graph_nodes' and 'graph_edges' collection
    # This allows us to query: "Who touched this file recently?"
    if nodes:
        for node in nodes:
            await db["graph_nodes"].update_one(
                {"id": node["id"]}, {"$set": node}, upsert=True
            )

    if edges:
        await db["graph_edges"].insert_many(edges)
        print(f"🕸️ Graph Updated: {event['actor']} -> {event['action']} -> {event['source_id']}")