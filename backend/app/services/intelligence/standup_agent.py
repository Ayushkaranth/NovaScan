import google.generativeai as genai
import os
import json
import logging
from typing import List, Dict
from app.models.user import User

# Configure Logging
logger = logging.getLogger(__name__)

# Load API Key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

MODEL_NAME = "gemini-2.5-flash-lite"

async def analyze_standup(transcript: str, members: List[User], project_name: str) -> Dict:
    """
    Analyzes a standup transcript to identify speakers, action items, events, and blockers.
    """
    if not GEMINI_API_KEY:
        logger.error("❌ GEMINI_API_KEY is missing!")
        return {"error": "AI Service Unavailable"}

    # Create a mapping string for the LLM
    member_list_str = "\n".join([f"- {u.full_name} (ID: {u.id}, Email: {u.email})" for u in members])

    prompt = f"""
    You are an AI Project Manager. Analyze this Daily Standup Transcript for project "{project_name}".
    
    Match speakers in the text to these Team Members:
    {member_list_str}
    
    TRANSCRIPT:
    {transcript}
    
    ---------------------------------------------------
    
    Task:
    1. Identify who is speaking. Map names in text to the provided Team Members.
    2. Extract 'tasks' (Action Items). Assign to the correct User ID.
    3. Extract 'events' (Deadlines, Meetings). accurate dates/times if mentioned.
    4. Extract 'blockers' (Who is stuck and why).
    5. Generate a 'summary' (Markdown format) for Slack.
    
    Output JSON ONLY:
    {{
        "tasks": [
            {{ "title": "...", "description": "...", "assignee_id": "<User ID from list>", "assignee_name": "..." }}
        ],
        "events": [
            {{ "title": "...", "date": "YYYY-MM-DD or 'Today'", "time": "HH:MM", "description": "..." }}
        ],
        "blockers": [
            {{ "user_id": "<User ID>", "user_name": "...", "issue": "..." }}
        ],
        "summary": "### 🚀 Daily Standup Summary - {project_name}\\n\\n**Highlights**... "
    }}
    """
    
    try:
        model = genai.GenerativeModel(MODEL_NAME)
        response = model.generate_content(prompt)
        
        text_response = response.text.strip()
        if text_response.startswith("```"):
            text_response = text_response.strip("`").replace("json", "").strip()
            
        return json.loads(text_response)
        
    except Exception as e:
        logger.error(f"❌ Standup Analysis Failed: {e}")
        return {"error": str(e)}
