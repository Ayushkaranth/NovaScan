from fastapi import APIRouter, HTTPException, Depends
from app.core.database import get_database
from app.models.integration import Integration, IntegrationCreate, IntegrationInDB
from app.models.user import User
from app.api.v1.endpoints.auth import get_current_user
from bson import ObjectId
from datetime import datetime
import httpx

router = APIRouter()  # <--- THIS WAS MISSING OR NOT FOUND

# --- Helper: Verification Logic ---
async def verify_credentials(platform: str, creds: dict) -> bool:
    async with httpx.AsyncClient() as client:
        try:
            if platform == "github":
                resp = await client.get("https://api.github.com/user", headers={
                    "Authorization": f"Bearer {creds.get('access_token')}",
                    "Accept": "application/vnd.github.v3+json"
                })
                return resp.status_code == 200
            
            elif platform == "slack":
                resp = await client.post("https://slack.com/api/auth.test", headers={
                    "Authorization": f"Bearer {creds.get('bot_token')}"
                })
                return resp.json().get("ok") is True

            elif platform == "jira":
                domain = creds.get("domain", "").replace("https://", "").replace("/", "")
                email = creds.get("email")
                api_token = creds.get("api_token")
                url = f"https://{domain}/rest/api/3/myself"
                resp = await client.get(url, auth=(email, api_token))
                return resp.status_code == 200
                
        except Exception as e:
            print(f"Verification Error for {platform}: {e}")
            return False
    return False

# --- Endpoints ---

@router.post("/{platform}")
async def connect_integration(
    platform: str,
    integration_data: IntegrationCreate,
    current_user: User = Depends(get_current_user)
):
    db = get_database()
    
    if platform not in ["github", "jira", "slack"]:
        raise HTTPException(status_code=400, detail="Unsupported platform")

    # Verify Credentials
    is_valid = await verify_credentials(platform, integration_data.credentials)
    if not is_valid:
        raise HTTPException(status_code=400, detail=f"Invalid {platform} credentials. Connection failed.")

    # Save to Database
    new_integration = IntegrationInDB(
        _id=str(ObjectId()),
        org_id=current_user.current_org_id,
        platform=platform,
        credentials=integration_data.credentials,
        config=integration_data.config,
        created_at=datetime.utcnow()
    )
    
    await db["integrations"].update_one(
        {"org_id": current_user.current_org_id, "platform": platform},
        {"$set": new_integration.dict(by_alias=True)},
        upsert=True
    )

    return {"status": "success", "message": f"{platform} connected successfully"}

@router.get("/")
async def list_integrations(current_user: User = Depends(get_current_user)):
    db = get_database()
    integrations = await db["integrations"].find(
        {"org_id": current_user.current_org_id}
    ).to_list(length=10)
    
    return [Integration(**i) for i in integrations]