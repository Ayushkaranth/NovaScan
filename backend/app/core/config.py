from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Loop AI"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    MONGODB_URL: str
    DB_NAME: str
    REDIS_URL: str
    
    # AI
    GEMINI_API_KEY: str

    # --- External Integrations (Fix for your error) ---
    # These match the variables in your .env file
    TEST_GITHUB_TOKEN: Optional[str] = None
    TEST_JIRA_URL: Optional[str] = None
    TEST_SLACK_TOKEN: Optional[str] = None
    NOTION_TOKEN: str
    NOTION_DATABASE_ID: str

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore" # This tells Pydantic to ignore any other extra .env vars safely

settings = Settings()