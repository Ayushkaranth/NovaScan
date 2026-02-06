import google.generativeai as genai
import os
import json
import logging
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env file
# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load API Key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    logger.error("❌ GEMINI_API_KEY is missing from environment variables!")

genai.configure(api_key=GEMINI_API_KEY)

# Use the stable model
MODEL_NAME = "gemini-2.5-flash-lite" 

async def analyze_code(diff: str, pr_details: dict):
    """
    Analyzes a code diff for risks using Google Gemini.
    """
    # 1. Input Validation
    if not diff or len(diff) < 10:
        return {"risk_score": 0, "summary": "No significant code changes detected.", "is_risky": False}

    # 2. Construct Prompt
    prompt = f"""
    You are a Senior Staff Engineer. Analyze this Pull Request.
    
    PR Title: {pr_details.get('title')}
    PR Description: {pr_details.get('body')}
    
    Code Diff:
    {diff[:15000]}  # Truncate to avoid token limits

    Identify 1 major risk (Security, Performance, or Reliability).
    If no major risk, say "Low Risk".

    Respond ONLY in this JSON format:
    {{
        "risk_score": <number 1-10>,
        "reason": "<short explanation>",
        "is_risky": <boolean true/false>
    }}
    """

    try:
        # 3. Call AI
        model = genai.GenerativeModel(MODEL_NAME)
        response = model.generate_content(prompt)
        
        # 4. Cleanup Response (Remove markdown formatting if AI adds it)
        text_response = response.text.strip()
        if text_response.startswith("```"):
            text_response = text_response.strip("`").replace("json", "").strip()

        return json.loads(text_response)

    except Exception as e:
        # 5. Safety Net (Handle Errors)
        logger.error(f"❌ LLM Engine Error: {str(e)}")
        return {
            "risk_score": 5, 
            "reason": "AI Analysis temporarily unavailable. Manual review recommended.", 
            "is_risky": True 
        }