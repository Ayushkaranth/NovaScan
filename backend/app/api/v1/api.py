from fastapi import APIRouter
from app.api.v1.endpoints import auth, organizations, integrations, webhooks, onboarding, notification, projects, risks

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(organizations.router, prefix="/organizations", tags=["Organizations"])
api_router.include_router(integrations.router, prefix="/integrations", tags=["Integrations"])
api_router.include_router(webhooks.router, prefix="/webhooks", tags=["Webhooks"])
api_router.include_router(onboarding.router, prefix="/onboarding", tags=["onboarding"])
api_router.include_router(notification.router, prefix="/notifications", tags=["notifications"]) # <--- Add this line
api_router.include_router(projects.router, prefix="/api/v1/projects", tags=["Projects"])
api_router.include_router(risks.router, prefix="/api/v1/risks", tags=["Risks"])
## api_router.include_router(organizations.router, prefix="/organizations", tags=["organizations"])