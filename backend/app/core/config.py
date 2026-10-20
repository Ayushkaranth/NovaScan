from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "NovaScan AI"
    API_V1_STR: str = "/api/v1"
    
    # Environment Base URLs
    FRONTEND_URL: str = "http://localhost:3000"
    BASE_URL: str = "http://localhost:8000"
    
    # Security
    SECRET_KEY: str = "novascan_secret_jwt_key_2026"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    ENCRYPTION_SECRET_KEY: Optional[str] = "novascan_master_aes256_key"
    
    # Database
    MONGODB_URL: str = "mongodb://localhost:27017"
    DB_NAME: str = "novascan"
    REDIS_URL: str = "redis://localhost:6379"
    
    # AI Fallback Key
    GEMINI_API_KEY: Optional[str] = None

    # --- Enterprise OAuth 2.0 Connectors Settings ---
    # GitHub App variables are parked until the production deployment team is ready.
    # Uncomment these together when enabling the repository-scoped GitHub App flow:
    # GITHUB_APP_ID: Optional[str] = None
    # GITHUB_APP_SLUG: Optional[str] = None
    # GITHUB_APP_PRIVATE_KEY: Optional[str] = None
    # GITHUB_APP_CLIENT_ID: Optional[str] = None
    # GITHUB_APP_CLIENT_SECRET: Optional[str] = None
    # GITHUB_WEBHOOK_SECRET: Optional[str] = None
    # The existing GitHub OAuth App credentials remain active for now.
    GITHUB_CLIENT_ID: Optional[str] = None
    GITHUB_CLIENT_SECRET: Optional[str] = None
    GITHUB_APP_NAME: Optional[str] = "novascan-ai-app"
    GITHUB_REDIRECT_URI: Optional[str] = None

    SLACK_CLIENT_ID: Optional[str] = None
    SLACK_CLIENT_SECRET: Optional[str] = None
    SLACK_REDIRECT_URI: Optional[str] = None

    JIRA_CLIENT_ID: Optional[str] = None
    JIRA_CLIENT_SECRET: Optional[str] = None
    JIRA_REDIRECT_URI: Optional[str] = None

    @property
    def github_redirect(self) -> str:
        return self.GITHUB_REDIRECT_URI or f"{self.BASE_URL.rstrip('/')}/api/v1/oauth/github/callback"

    @property
    def slack_redirect(self) -> str:
        return self.SLACK_REDIRECT_URI or f"{self.BASE_URL.rstrip('/')}/api/v1/oauth/slack/callback"

    @property
    def jira_redirect(self) -> str:
        return self.JIRA_REDIRECT_URI or f"{self.BASE_URL.rstrip('/')}/api/v1/oauth/jira/callback"

    # Legacy & Token Integrations
    TEST_GITHUB_TOKEN: Optional[str] = None
    TEST_JIRA_URL: Optional[str] = None
    TEST_SLACK_TOKEN: Optional[str] = None
    NOTION_TOKEN: Optional[str] = None
    NOTION_DATABASE_ID: Optional[str] = None

    RESEND_API_KEY: Optional[str] = None
    SMTP_USER: str = "onboarding@resend.dev"

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

settings = Settings()
