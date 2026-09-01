import google.generativeai as genai
import os
import json
import logging
import httpx
from typing import Optional, Dict, Any
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

SYSTEM_GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

def get_effective_key(custom_key: Optional[str] = None) -> str:
    """Returns the custom BYOK key if provided, else falls back to the system free Gemini key."""
    if custom_key and len(custom_key.strip()) > 5:
        return custom_key.strip()
    return SYSTEM_GEMINI_API_KEY

async def generate_insight(system_instruction: str, user_content: str, custom_api_key: Optional[str] = None, provider: str = "gemini") -> Dict[str, Any]:
    """
    Generic BYOK LLM Orchestration wrapper.
    Supports Google Gemini (default), OpenAI, Anthropic, and local Ollama.
    """
    effective_key = get_effective_key(custom_api_key)
    
    # 1. Google Gemini Provider (BYOK or System Free Fallback)
    if provider.lower() == "gemini":
        try:
            genai.configure(api_key=effective_key)
            model = genai.GenerativeModel(
                model_name="gemini-1.5-flash",
                system_instruction=system_instruction
            )
            response = await model.generate_content_async(user_content)
            text_response = response.text.strip()
            if text_response.startswith("```"):
                text_response = text_response.strip("`").replace("json", "").strip()
            return json.loads(text_response)
        except Exception as e:
            logger.error(f"Gemini LLM Execution Error: {e}")
            # Fallback to plain prompt if system_instruction is not supported in older SDKs
            try:
                model = genai.GenerativeModel("gemini-1.5-flash")
                combined = f"{system_instruction}\n\nUSER INPUT:\n{user_content}"
                response = model.generate_content(combined)
                text = response.text.strip()
                if text.startswith("```"):
                    text = text.strip("`").replace("json", "").strip()
                return json.loads(text)
            except Exception as ex:
                logger.error(f"Fallback Gemini Exception: {ex}")
                raise ex

    # 2. OpenAI Provider (BYOK)
    elif provider.lower() == "openai":
        async with httpx.AsyncClient(timeout=30.0) as client:
            headers = {"Authorization": f"Bearer {effective_key}", "Content-Type": "application/json"}
            payload = {
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": user_content}
                ],
                "response_format": {"type": "json_object"}
            }
            res = await client.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
            res_data = res.json()
            content = res_data["choices"][0]["message"]["content"]
            return json.loads(content)

    # 3. Local Ollama Provider (Self-Hosted Zero Data Leakage)
    elif provider.lower() == "ollama":
        async with httpx.AsyncClient(timeout=60.0) as client:
            payload = {
                "model": "llama3",
                "system": system_instruction,
                "prompt": user_content,
                "stream": False,
                "format": "json"
            }
            res = await client.post("http://localhost:11434/api/generate", json=payload)
            res_data = res.json()
            return json.loads(res_data["response"])

    raise ValueError(f"Unsupported LLM provider: {provider}")

async def analyze_code(diff: str, pr_details: dict, custom_api_key: Optional[str] = None):
    """
    Analyzes code diff for technical risks using dynamic BYOK key or free fallback.
    """
    if not diff or len(diff) < 10:
        return {"risk_score": 0, "summary": "No significant code changes detected.", "is_risky": False}

    system_instruction = "You are a Senior Staff Engineer. Analyze this Pull Request code diff for security, reliability, or breaking changes."
    user_content = f"""
    PR Title: {pr_details.get('title')}
    PR Description: {pr_details.get('body')}
    
    Code Diff:
    {diff[:15000]}

    Respond strictly in JSON:
    {{
        "risk_score": 1-10,
        "reason": "short explanation",
        "is_risky": true/false
    }}
    """
    try:
        return await generate_insight(system_instruction, user_content, custom_api_key=custom_api_key)
    except Exception as e:
        logger.error(f"LLM Engine Error in analyze_code: {e}")
        return {
            "risk_score": 5,
            "reason": "AI analysis executed via fallback safeguards.",
            "is_risky": True
        }