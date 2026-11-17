import pytest
from httpx import AsyncClient
from motor.motor_asyncio import AsyncIOMotorDatabase

from tests.conftest import register_and_login


@pytest.mark.asyncio
async def test_create_and_get_conversation(async_client: AsyncClient):
    headers = await register_and_login(async_client, email="chat_user1@example.com")

    # 1. Create with custom title
    resp = await async_client.post(
        "/api/v1/assistant/conversations",
        headers=headers,
        json={"title": "Roadmap Discussion"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "Roadmap Discussion"
    assert "id" in data
    conv_id = data["id"]

    # 2. Get conversation
    get_resp = await async_client.get(
        f"/api/v1/assistant/conversations/{conv_id}",
        headers=headers,
    )
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == conv_id
    assert get_resp.json()["title"] == "Roadmap Discussion"

    # 3. Create with default title
    resp2 = await async_client.post(
        "/api/v1/assistant/conversations",
        headers=headers,
        json={},
    )
    assert resp2.status_code == 201
    assert resp2.json()["title"] == "New Career Conversation"


@pytest.mark.asyncio
async def test_list_and_search_conversations(async_client: AsyncClient):
    headers = await register_and_login(async_client, email="search_chat@example.com")

    # Create 3 conversations
    await async_client.post("/api/v1/assistant/conversations", headers=headers, json={"title": "Python Backend Prep"})
    await async_client.post("/api/v1/assistant/conversations", headers=headers, json={"title": "Resume Review Notes"})
    await async_client.post("/api/v1/assistant/conversations", headers=headers, json={"title": "Docker Kubernetes Plan"})

    # List all
    list_resp = await async_client.get("/api/v1/assistant/conversations", headers=headers)
    assert list_resp.status_code == 200
    res = list_resp.json()
    assert res["total"] == 3
    assert len(res["items"]) == 3

    # Search query
    search_resp = await async_client.get("/api/v1/assistant/conversations?search=Resume", headers=headers)
    assert search_resp.status_code == 200
    s_res = search_resp.json()
    assert s_res["total"] == 1
    assert s_res["items"][0]["title"] == "Resume Review Notes"


@pytest.mark.asyncio
async def test_update_and_delete_conversation(async_client: AsyncClient, test_db: AsyncIOMotorDatabase):
    headers = await register_and_login(async_client, email="update_del@example.com")

    # Create
    create_resp = await async_client.post(
        "/api/v1/assistant/conversations",
        headers=headers,
        json={"title": "Old Title"},
    )
    conv_id = create_resp.json()["id"]

    # Rename
    patch_resp = await async_client.patch(
        f"/api/v1/assistant/conversations/{conv_id}",
        headers=headers,
        json={"title": "Renamed Career Session"},
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["title"] == "Renamed Career Session"

    # Delete
    del_resp = await async_client.delete(
        f"/api/v1/assistant/conversations/{conv_id}",
        headers=headers,
    )
    assert del_resp.status_code == 200

    # Verify not found
    get_resp = await async_client.get(
        f"/api/v1/assistant/conversations/{conv_id}",
        headers=headers,
    )
    assert get_resp.status_code == 404

    # Verify messages collection cleaned up
    msg_count = await test_db["chat_messages"].count_documents({"conversation_id": conv_id})
    assert msg_count == 0


@pytest.mark.asyncio
async def test_cross_user_isolation(async_client: AsyncClient):
    headers_user1 = await register_and_login(async_client, email="user1_iso@example.com")
    headers_user2 = await register_and_login(async_client, email="user2_iso@example.com")

    # User 1 creates conversation
    resp = await async_client.post(
        "/api/v1/assistant/conversations",
        headers=headers_user1,
        json={"title": "User 1 Private Chat"},
    )
    conv_id = resp.json()["id"]

    # User 2 tries to access User 1 conversation
    assert (await async_client.get(f"/api/v1/assistant/conversations/{conv_id}", headers=headers_user2)).status_code == 404
    assert (await async_client.patch(f"/api/v1/assistant/conversations/{conv_id}", headers=headers_user2, json={"title": "Hacked"})).status_code == 404
    assert (await async_client.get(f"/api/v1/assistant/conversations/{conv_id}/messages", headers=headers_user2)).status_code == 404
    assert (await async_client.post(f"/api/v1/assistant/conversations/{conv_id}/messages", headers=headers_user2, json={"message": "Hi"})).status_code == 404
    assert (await async_client.delete(f"/api/v1/assistant/conversations/{conv_id}", headers=headers_user2)).status_code == 404


@pytest.mark.asyncio
async def test_send_message_and_auto_title(async_client: AsyncClient):
    headers = await register_and_login(async_client, email="messaging_user@example.com")

    # Create default conversation
    create_resp = await async_client.post("/api/v1/assistant/conversations", headers=headers, json={})
    conv_id = create_resp.json()["id"]
    assert create_resp.json()["title"] == "New Career Conversation"

    # Send first message: Should trigger title generation and return assistant reply
    msg_resp = await async_client.post(
        f"/api/v1/assistant/conversations/{conv_id}/messages",
        headers=headers,
        json={"message": "What skills should I learn for a Senior Backend Engineer role?"},
    )
    assert msg_resp.status_code == 200
    assistant_msg = msg_resp.json()
    assert assistant_msg["role"] == "assistant"
    assert len(assistant_msg["content"]) > 0

    # Verify conversation title was updated
    conv_resp = await async_client.get(f"/api/v1/assistant/conversations/{conv_id}", headers=headers)
    assert conv_resp.json()["title"] != "New Career Conversation"
    assert "What Skills" in conv_resp.json()["title"] or "skills" in conv_resp.json()["title"].lower()

    # List messages
    msgs_resp = await async_client.get(f"/api/v1/assistant/conversations/{conv_id}/messages", headers=headers)
    assert msgs_resp.status_code == 200
    items = msgs_resp.json()["items"]
    assert len(items) == 2
    assert items[0]["role"] == "user"
    assert items[1]["role"] == "assistant"


@pytest.mark.asyncio
async def test_stream_message_sse(async_client: AsyncClient):
    headers = await register_and_login(async_client, email="stream_user@example.com")

    conv_resp = await async_client.post("/api/v1/assistant/conversations", headers=headers, json={})
    conv_id = conv_resp.json()["id"]

    stream_resp = await async_client.post(
        f"/api/v1/assistant/conversations/{conv_id}/stream",
        headers=headers,
        json={"message": "How do I prepare for my upcoming mock interview?"},
    )
    assert stream_resp.status_code == 200
    assert "text/event-stream" in stream_resp.headers["content-type"]

    body = stream_resp.text
    assert "data:" in body
    assert "[DONE]" in body

    # Verify both user and assistant messages were saved in DB
    msgs_resp = await async_client.get(f"/api/v1/assistant/conversations/{conv_id}/messages", headers=headers)
    assert msgs_resp.status_code == 200
    assert msgs_resp.json()["total"] == 2


@pytest.mark.asyncio
async def test_context_summary_graceful(async_client: AsyncClient):
    headers = await register_and_login(async_client, email="context_test@example.com")

    resp = await async_client.get("/api/v1/assistant/context-summary", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "resume_available" in data
    assert "roadmap_available" in data
    # Initially user has no resume, roadmap, etc.
    assert data["resume_available"] is False
    assert data["roadmap_available"] is False
    assert data["interview_available"] is False
