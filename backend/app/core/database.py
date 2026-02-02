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
    redis_client = aioredis.from_url(
        settings.REDIS_URL, 
        decode_responses=True,
        ssl_cert_reqs=None # Required for some Upstash connections
    )
    try:
        await redis_client.ping()
        print("✅ Connected to Upstash Redis!")
    except Exception as e:
        print(f"❌ Redis Connection Failed: {e}")

async def close_redis_connection():
    if redis_client:
        await redis_client.close()
        print("🔻 Redis Connection Closed")