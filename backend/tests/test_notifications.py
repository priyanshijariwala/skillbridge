import pytest
from httpx import AsyncClient
from app.integrations.email.mock_provider import mock_email_instance
from tests.conftest import register_and_login


@pytest.mark.asyncio
async def test_list_notifications_and_unread_count(async_client: AsyncClient):
    headers = await register_and_login(async_client, email="notif_user1@example.com")

    # Upon registration, a welcome notification is automatically dispatched
    resp = await async_client.get("/api/v1/notifications", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 1
    assert data["unread_count"] >= 1
    welcome = data["items"][0]
    assert "Welcome" in welcome["title"]
    assert welcome["is_read"] is False

    # Check dedicated unread count endpoint
    unread_resp = await async_client.get("/api/v1/notifications/unread-count", headers=headers)
    assert unread_resp.status_code == 200
    assert unread_resp.json()["unread_count"] >= 1


@pytest.mark.asyncio
async def test_mark_as_read_and_read_all(async_client: AsyncClient):
    headers = await register_and_login(async_client, email="notif_user2@example.com")

    # 1. Fetch unread notification
    resp = await async_client.get("/api/v1/notifications", headers=headers)
    items = resp.json()["items"]
    assert len(items) >= 1
    notif_id = items[0]["id"]

    # 2. Mark single as read
    patch_resp = await async_client.patch(f"/api/v1/notifications/{notif_id}/read", headers=headers)
    assert patch_resp.status_code == 200
    assert patch_resp.json()["is_read"] is True

    # 3. Mark all as read
    read_all_resp = await async_client.patch("/api/v1/notifications/read-all", headers=headers)
    assert read_all_resp.status_code == 200
    assert read_all_resp.json()["unread_count"] == 0

    # 4. Confirm unread count is 0
    count_resp = await async_client.get("/api/v1/notifications/unread-count", headers=headers)
    assert count_resp.json()["unread_count"] == 0


@pytest.mark.asyncio
async def test_delete_notification(async_client: AsyncClient):
    headers = await register_and_login(async_client, email="notif_user3@example.com")

    resp = await async_client.get("/api/v1/notifications", headers=headers)
    items = resp.json()["items"]
    assert len(items) >= 1
    notif_id = items[0]["id"]

    del_resp = await async_client.delete(f"/api/v1/notifications/{notif_id}", headers=headers)
    assert del_resp.status_code == 204

    # Verify not found now
    patch_resp = await async_client.patch(f"/api/v1/notifications/{notif_id}/read", headers=headers)
    assert patch_resp.status_code == 404


@pytest.mark.asyncio
async def test_cross_user_isolation(async_client: AsyncClient):
    user1_headers = await register_and_login(async_client, email="user_alice@example.com")
    user2_headers = await register_and_login(async_client, email="user_bob@example.com")

    # Alice gets her notifications
    resp1 = await async_client.get("/api/v1/notifications", headers=user1_headers)
    alice_notif_id = resp1.json()["items"][0]["id"]

    # Bob tries to read Alice's notification -> 404
    bob_read = await async_client.patch(f"/api/v1/notifications/{alice_notif_id}/read", headers=user2_headers)
    assert bob_read.status_code == 404

    # Bob tries to delete Alice's notification -> 404
    bob_del = await async_client.delete(f"/api/v1/notifications/{alice_notif_id}", headers=user2_headers)
    assert bob_del.status_code == 404


@pytest.mark.asyncio
async def test_notification_preferences(async_client: AsyncClient):
    headers = await register_and_login(async_client, email="prefs_user@example.com")

    # 1. Get default preferences
    get_resp = await async_client.get("/api/v1/notification-preferences", headers=headers)
    assert get_resp.status_code == 200
    prefs = get_resp.json()
    assert prefs["email_enabled"] is True
    assert prefs["category_preferences"]["coding"] is True
    assert prefs["category_preferences"]["security"] is True

    # 2. Update preferences: turn off coding and try turning off security
    update_resp = await async_client.put(
        "/api/v1/notification-preferences",
        headers=headers,
        json={
            "email_enabled": True,
            "category_preferences": {
                "coding": False,
                "security": False,  # Should be protected and remain True
            },
        },
    )
    assert update_resp.status_code == 200
    updated = update_resp.json()
    assert updated["category_preferences"]["coding"] is False
    # Crucial security guarantee: security notifications cannot be disabled
    assert updated["category_preferences"]["security"] is True


@pytest.mark.asyncio
async def test_email_mock_provider_and_worker(async_client: AsyncClient):
    mock_email_instance.clear()

    # Registering triggers a welcome email via mock provider
    await register_and_login(async_client, email="email_test@example.com")

    # Give background task a moment
    import asyncio
    await asyncio.sleep(0.1)

    sent = mock_email_instance.sent_emails
    assert len(sent) >= 1
    welcome_mail = sent[-1]
    assert welcome_mail["to_email"] == "email_test@example.com"
    assert "Welcome" in welcome_mail["subject"]
    assert "SkillBridge AI" in welcome_mail["html_content"]


@pytest.mark.asyncio
async def test_email_retry_on_transient_failure(async_client: AsyncClient):
    from app.db.mongodb import get_database
    from app.services.notifications.email_worker import EmailWorker

    mock_email_instance.clear()
    mock_email_instance.simulate_failure("SMTP 421 Connection timeout", is_transient=True)

    # Directly run email worker to verify bounded retries
    # Using test database
    import motor.motor_asyncio
    from app.core.config import settings
    client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGODB_URL)
    db = client["skillbridge_test"]

    worker = EmailWorker(db=db, provider=mock_email_instance)
    log_id = await worker.send_transactional_email(
        user_id="test_user_retry",
        to_email="retry_candidate@example.com",
        template="welcome",
        subject="Retry Test",
        html_content="<p>Test</p>",
        text_content="Test",
    )

    from bson import ObjectId
    log_doc = await db["email_logs"].find_one({"_id": ObjectId(log_id)})
    assert log_doc is not None
    assert log_doc["status"] == "failed"
    assert log_doc["attempt_count"] == settings.EMAIL_MAX_RETRIES
    assert "Connection timeout" in log_doc["last_error"]

    mock_email_instance.clear()
    client.close()
