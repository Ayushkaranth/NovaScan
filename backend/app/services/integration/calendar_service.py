from datetime import datetime
from typing import List, Dict, Optional
from app.core.database import get_database
from bson import ObjectId

class CalendarService:
    @property
    def collection(self):
        return get_database()["calendar_events"]

    async def create_event(self, project_id: str, title: str, start_time: datetime, end_time: Optional[datetime] = None, description: str = "", attendees: List[str] = []):
        """
        Creates a calendar event and stores it in the database.
        In a real production app, this would also push to Google Calendar via API.
        """
        event = {
            "project_id": project_id,
            "title": title,
            "start_time": start_time,
            "end_time": end_time or start_time,
            "description": description,
            "attendees": attendees,
            "created_at": datetime.utcnow()
        }
        result = await self.collection.insert_one(event)
        return str(result.inserted_id)

    async def get_project_events(self, project_id: str) -> List[Dict]:
        """
        Retrieves all calendar events for a specific project.
        """
        cursor = self.collection.find({"project_id": project_id}).sort("start_time", 1)
        events = await cursor.to_list(length=100)
        
        # Convert ObjectId to string for JSON serialization
        results = []
        for event in events:
            event["id"] = str(event.pop("_id"))
            results.append(event)
            
        return results

calendar_service = CalendarService()
