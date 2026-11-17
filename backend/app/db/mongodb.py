import logging
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import ASCENDING

from app.core.config import settings

logger = logging.getLogger(__name__)


class Database:
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None


db_instance = Database()


async def get_database() -> AsyncIOMotorDatabase:
    if db_instance.db is None:
        raise RuntimeError("Database is not initialized. Call init_db() first.")
    return db_instance.db


async def init_db() -> None:
    """Connect to MongoDB and ensure essential indexes."""
    logger.info("Connecting to MongoDB at %s", settings.MONGODB_URL)
    db_instance.client = AsyncIOMotorClient(settings.MONGODB_URL)
    db_instance.db = db_instance.client[settings.MONGODB_DB_NAME]
    
    # Ensure indexes
    try:
        users_col = db_instance.db["users"]
        await users_col.create_index([("email", ASCENDING)], unique=True)
        
        sessions_col = db_instance.db["refresh_sessions"]
        await sessions_col.create_index([("session_id", ASCENDING)], unique=True)
        await sessions_col.create_index([("user_id", ASCENDING)])
        await sessions_col.create_index([("expires_at", ASCENDING)], expireAfterSeconds=0)
        
        profiles_col = db_instance.db["profiles"]
        await profiles_col.create_index([(("user_id", ASCENDING))], unique=True)

        resumes_col = db_instance.db["resumes"]
        await resumes_col.create_index([(("user_id", ASCENDING)), ("created_at", ASCENDING)])

        analyses_col = db_instance.db["resume_analyses"]
        await analyses_col.create_index(
            [(("user_id", ASCENDING)), (("resume_id", ASCENDING)), ("created_at", -1)]
        )

        job_roles_col = db_instance.db["job_roles"]
        await job_roles_col.create_index([("slug", ASCENDING)], unique=True)
        await job_roles_col.create_index([("category", ASCENDING)])

        skill_gap_col = db_instance.db["skill_gap_analyses"]
        await skill_gap_col.create_index([("user_id", ASCENDING), ("created_at", -1)])

        roadmaps_col = db_instance.db["roadmaps"]
        await roadmaps_col.create_index([("user_id", ASCENDING), ("created_at", -1)])
        await roadmaps_col.create_index([("user_id", ASCENDING), ("status", ASCENDING)])

        interviews_col = db_instance.db["interviews"]
        await interviews_col.create_index([("user_id", ASCENDING), ("created_at", -1)])
        await interviews_col.create_index([("user_id", ASCENDING), ("status", ASCENDING)])

        messages_col = db_instance.db["interview_messages"]
        await messages_col.create_index(
            [("interview_id", ASCENDING), ("sequence", ASCENDING)], unique=True
        )
        await messages_col.create_index([("interview_id", ASCENDING), ("created_at", ASCENDING)])

        feedback_col = db_instance.db["interview_feedback"]
        await feedback_col.create_index([("interview_id", ASCENDING)], unique=True)
        await feedback_col.create_index([("user_id", ASCENDING), ("created_at", -1)])

        # Run idempotent seeders
        from app.db.seeds.job_roles import seed_job_roles
        await seed_job_roles(db_instance.db)

        logger.info("MongoDB indexes verified and seed data initialized successfully.")
    except Exception as e:
        logger.warning("Could not create MongoDB indexes automatically: %s", e)


async def close_db() -> None:
    """Close MongoDB connection."""
    if db_instance.client:
        logger.info("Closing MongoDB connection.")
        db_instance.client.close()
        db_instance.client = None
        db_instance.db = None

