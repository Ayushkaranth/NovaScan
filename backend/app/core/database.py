import os
from motor.motor_asyncio import AsyncIOMotorClient
from redis import asyncio as aioredis
from app.core.config import settings

# --- MongoDB Setup ---
class Database:
    client: AsyncIOMotorClient = None
    db = None

db = Database()

async def connect_to_mongo():
    try:
        db.client = AsyncIOMotorClient(settings.MONGODB_URL)
        db.db = db.client[settings.DB_NAME]
        await db.client.admin.command('ping')
        print("[OK] Connected to MongoDB Atlas!")
    except Exception as e:
        print(f"[NOTICE] MongoDB Connection Error: {e}")
        print("[INFO] MongoDB Atlas is currently paused/unreachable. Running backend in in-memory BYOK mode.")
        db.client = None
        db.db = None

async def close_mongo_connection():
    if db.client:
        db.client.close()
        print("[INFO] MongoDB Connection Closed")

def get_database():
    return db.db

# --- Redis Setup (Upstash / Local Fallback) ---
redis_client = None

async def connect_to_redis():
    global redis_client
    redis_url = os.getenv("REDIS_URL", getattr(settings, "REDIS_URL", "redis://localhost:6379"))

    connection_kwargs = {"decode_responses": True}
    if redis_url.startswith("rediss://"):
        connection_kwargs["ssl_cert_reqs"] = "none"

    print(f"[INFO] Connecting to Redis at {redis_url}...")

    # Primary Attempt (Upstash / Configured URL)
    try:
        redis_client = aioredis.from_url(redis_url, **connection_kwargs)
        await redis_client.ping()
        print("[OK] Connected to Primary Redis!")
        return
    except Exception as primary_err:
        print(f"[NOTICE] Primary Redis Connection Failed ({primary_err}). Attempting local Redis fallback...")

    # Secondary Fallback Attempt (Local Redis)
    try:
        redis_client = aioredis.from_url("redis://localhost:6379", decode_responses=True)
        await redis_client.ping()
        print("[OK] Connected to Local Fallback Redis!")
        return
    except Exception as local_err:
        print(f"[NOTICE] Local Redis unavailable ({local_err}).")

    # Offline In-Memory Fallback Mode
    print("[INFO] Running backend in zero-dependency in-memory caching mode.")
    redis_client = None

async def close_redis_connection():
    global redis_client
    if redis_client:
        try:
            await redis_client.close()
            print("[INFO] Redis Connection Closed")
        except Exception:
            pass
