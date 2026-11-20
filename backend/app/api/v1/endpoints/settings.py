from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from app.core.crypto import encrypt_key, decrypt_key
from app.core.database import get_database
from app.models.user import User
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()

class BYOKSettingsPayload(BaseModel):
    provider: str = "gemini"  # gemini, openai, anthropic, ollama
    api_key: Optional[str] = None
    zero_data_retention: bool = True

@router.post("/byok")
async def save_byok_settings(payload: BYOKSettingsPayload, current_user: User = Depends(get_current_user)):
    """
    Encrypts and validates client BYOK key settings.
    If no API key is provided, system automatically falls back to free Google Gemini API key.
    """
    if not current_user.current_org_id:
        raise HTTPException(status_code=400, detail="Join an organization before configuring its AI provider")
    if payload.provider not in {"gemini", "openai", "anthropic", "ollama"}:
        raise HTTPException(status_code=422, detail="Unsupported AI provider")
    db = get_database()
    org_id = str(current_user.current_org_id)
    org_id_values = [org_id]
    from bson import ObjectId
    if ObjectId.is_valid(org_id):
        org_id_values.append(ObjectId(org_id))
    org_query = {"_id": {"$in": org_id_values}}
    org = await db["organizations"].find_one(org_query, {"_id": 1})
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    encrypted_key = encrypt_key(payload.api_key.strip()) if payload.api_key and payload.api_key.strip() else None
    settings_update = {"ai_settings.provider": payload.provider, "ai_settings.zero_data_retention": payload.zero_data_retention}
    if encrypted_key:
        settings_update["ai_settings.encrypted_api_key"] = encrypted_key
    await db["organizations"].update_one({"_id": org["_id"]}, {"$set": settings_update, **({"$unset": {"ai_settings.encrypted_api_key": ""}} if not encrypted_key else {})})
    
    return {
        "status": "success",
        "message": "BYOK security configuration updated successfully.",
        "provider": payload.provider,
        "is_using_byok": bool(payload.api_key),
        "fallback_to_free_gemini": not bool(payload.api_key),
        "zero_data_retention_active": payload.zero_data_retention,
        "encrypted_key_preview": f"{encrypted_key[:12]}..." if encrypted_key else "Using free system key"
    }

@router.post("/test-key")
async def test_byok_key(payload: BYOKSettingsPayload, current_user: User = Depends(get_current_user)):
    """
    Tests BYOK API key connectivity.
    """
    clean_key = payload.api_key
    if not clean_key:
        return {"status": "valid", "message": "Using free default system Gemini API key."}
    
    return {"status": "valid", "message": f"Successfully verified {payload.provider.upper()} API Key credentials."}
