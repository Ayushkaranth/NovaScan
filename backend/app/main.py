from dotenv import load_dotenv
import os
load_dotenv()
print(f"✅ SLACK_CHANNEL Loaded: {os.getenv('SLACK_CHANNEL')}")
from contextlib import asynccontextmanager
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import connect_to_mongo, close_mongo_connection, connect_to_redis, close_redis_connection
from app.api.v1.api import api_router  # <--- THIS WAS MISSING
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In development, allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to DBs
    await connect_to_mongo()
    await connect_to_redis()
    yield
    # Shutdown: Close connections
    await close_mongo_connection()
    await close_redis_connection()

app = FastAPI(
    title=settings.PROJECT_NAME,
    lifespan=lifespan,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS Middleware (Crucial for when we build the Frontend next)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins (React, Postman, etc.)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- WIRE UP THE ROUTES ---
# This connects /auth, /integrations, /webhooks to the main app
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {"message": "Loop AI Backend is Running 🚀"}