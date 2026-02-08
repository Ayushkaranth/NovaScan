from motor.motor_asyncio import AsyncIOMotorClient
from redis import asyncio as aioredis
from app.core.config import settings

# --- MongoDB Setup ---
class Database:
    client: AsyncIOMotorClient = None
    db = None

db = Database()

async def connect_to_mongo():
    db.client = AsyncIOMotorClient(settings.MONGODB_URL)
    db.db = db.client[settings.DB_NAME]
    # Verify connection
    try:
        await db.client.admin.command('ping')
        print("✅ Connected to MongoDB Atlas!")
    except Exception as e:
        print(f"❌ MongoDB Connection Failed: {e}")

async def close_mongo_connection():
    db.client.close()
    print("🔻 MongoDB Connection Closed")

def get_database():
    return db.db

# --- Redis Setup (Upstash) ---
redis_client = None

async def connect_to_redis():
    global redis_client
    try:
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        
        # 1. Prepare arguments based on environment
        connection_kwargs = {
            "decode_responses": True
        }

        # 2. Only add SSL options if the URL implies SSL (rediss://)
        # This fixes the "unexpected keyword argument" error locally
        if redis_url.startswith("rediss://"):
            connection_kwargs["ssl_cert_reqs"] = "none"

        print(f"🔌 Connecting to Redis at {redis_url}...")
        
        # 3. Create the client
        redis_client = redis.from_url(redis_url, **connection_kwargs)
        
        # 4. Test connection
        await redis_client.ping()
        print("✅ Connected to Redis!")
        
    except Exception as e:
        print(f"❌ Redis Connection Failed: {e}")
        # Don't crash the whole app for Redis, just log it
        redis_client = None
        
async def close_redis_connection():
    if redis_client:
        await redis_client.close()
        print("🔻 Redis Connection Closed")