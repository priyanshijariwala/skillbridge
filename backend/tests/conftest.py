from pathlib import Path
from typing import AsyncGenerator
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import settings
from app.db.mongodb import get_database
from app.main import app
from app.storage.local_storage import LocalStorage
from app.storage.storage_factory import get_storage

TEST_DB_NAME = "skillbridge_test"


@pytest_asyncio.fixture
async def test_db_client() -> AsyncGenerator[AsyncIOMotorClient, None]:
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    yield client
    client.close()


@pytest_asyncio.fixture
async def test_db(test_db_client: AsyncIOMotorClient) -> AsyncGenerator[AsyncIOMotorDatabase, None]:
    db = test_db_client[TEST_DB_NAME]
    test_collections = (
        "users",
        "refresh_sessions",
        "profiles",
        "resumes",
        "resume_analyses",
        "job_roles",
        "skill_gap_analyses",
        "roadmaps",
        "interviews",
        "interview_messages",
        "interview_feedback",
        "chat_conversations",
        "chat_messages",
        "coding_problems",
        "code_submissions",
        "coding_assessments",
        "notifications",
        "notification_preferences",
        "email_logs",
    )
    for col in test_collections:
        await db[col].delete_many({})
    await db["users"].create_index("email", unique=True)
    await db["refresh_sessions"].create_index("session_id", unique=True)
    await db["profiles"].create_index("user_id", unique=True)
    await db["resume_analyses"].create_index([("user_id", 1), ("resume_id", 1), ("created_at", -1)])
    await db["job_roles"].create_index("slug", unique=True)
    await db["skill_gap_analyses"].create_index([("user_id", 1), ("created_at", -1)])
    await db["roadmaps"].create_index([("user_id", 1), ("created_at", -1)])
    await db["interviews"].create_index([("user_id", 1), ("created_at", -1)])
    await db["interview_messages"].create_index([("interview_id", 1), ("sequence", 1)], unique=True)
    await db["interview_feedback"].create_index("interview_id", unique=True)
    await db["chat_conversations"].create_index([("user_id", 1), ("last_message_at", -1)])
    await db["chat_messages"].create_index([("conversation_id", 1), ("created_at", 1)])
    await db["coding_problems"].create_index("slug", unique=True)
    await db["code_submissions"].create_index([("user_id", 1), ("created_at", -1)])
    await db["notifications"].create_index([("user_id", 1), ("created_at", -1)])
    await db["notifications"].create_index([("user_id", 1), ("is_read", 1)])
    await db["notification_preferences"].create_index("user_id", unique=True)
    await db["email_logs"].create_index([("user_id", 1), ("created_at", -1)])
    await db["coding_assessments"].create_index([("user_id", 1), ("created_at", -1)])

    from app.db.seeds.job_roles import seed_job_roles
    from app.db.seeds.coding_problems import seed_coding_problems
    await seed_job_roles(db)
    await seed_coding_problems(db)

    yield db
    for col in test_collections:
        await db[col].delete_many({})


@pytest_asyncio.fixture
async def test_db_full(test_db: AsyncIOMotorDatabase) -> AsyncIOMotorDatabase:
    return test_db


@pytest_asyncio.fixture
async def async_client(test_db: AsyncIOMotorDatabase) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_database() -> AsyncIOMotorDatabase:
        return test_db

    app.dependency_overrides[get_database] = override_get_database

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client

    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def tmp_storage(tmp_path: Path) -> Path:
    storage_dir = tmp_path / "test_resumes"
    storage_dir.mkdir(parents=True, exist_ok=True)
    return storage_dir


@pytest_asyncio.fixture
async def async_client_full(
    test_db: AsyncIOMotorDatabase,
    tmp_storage: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_database() -> AsyncIOMotorDatabase:
        return test_db

    app.dependency_overrides[get_database] = override_get_database

    get_storage.cache_clear()
    test_storage = LocalStorage(base_path=str(tmp_storage))
    monkeypatch.setattr("app.storage.storage_factory.get_storage", lambda: test_storage)
    monkeypatch.setattr("app.services.resume_service.get_storage", lambda: test_storage)
    monkeypatch.setattr("app.services.resume.resume_analysis_service.get_storage", lambda: test_storage)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client

    app.dependency_overrides.clear()
    get_storage.cache_clear()


async def register_and_login(
    client: AsyncClient,
    email: str = "test@example.com",
    password: str = "Password123!",
    name: str = "Test User",
) -> dict:
    await client.post(
        "/api/v1/auth/register",
        json={"name": name, "email": email, "password": password},
    )
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    token = login_resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
