import pytest
import time
import jwt
from httpx import AsyncClient

from app.core.config import settings


@pytest.mark.asyncio
async def test_register_success(async_client: AsyncClient):
    payload = {
        "name": "Alex Vance",
        "email": "alex.vance@example.com",
        "password": "Password123!",
    }
    response = await async_client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Alex Vance"
    assert data["email"] == "alex.vance@example.com"
    assert data["role"] == "user"
    assert data["is_active"] is True
    assert "password" not in data
    assert "password_hash" not in data


@pytest.mark.asyncio
async def test_register_duplicate_email(async_client: AsyncClient):
    payload = {
        "name": "Alex Vance",
        "email": "duplicate@example.com",
        "password": "Password123!",
    }
    res1 = await async_client.post("/api/v1/auth/register", json=payload)
    assert res1.status_code == 201

    res2 = await async_client.post("/api/v1/auth/register", json=payload)
    assert res2.status_code == 409
    data = res2.json()
    assert data["error"]["code"] == "CONFLICT"
    assert "already exists" in data["error"]["message"]


@pytest.mark.asyncio
async def test_register_validation_error(async_client: AsyncClient):
    # Short password and invalid email
    payload = {
        "name": "A",
        "email": "not-an-email",
        "password": "short",
    }
    response = await async_client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422
    data = response.json()
    assert data["error"]["code"] == "VALIDATION_ERROR"
    assert len(data["error"]["details"]) > 0


@pytest.mark.asyncio
async def test_login_success_and_cookie(async_client: AsyncClient):
    # First register
    await async_client.post(
        "/api/v1/auth/register",
        json={"name": "Alex Vance", "email": "alex@example.com", "password": "Password123!"},
    )

    # Login
    response = await async_client.post(
        "/api/v1/auth/login",
        json={"email": "alex@example.com", "password": "Password123!"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "alex@example.com"
    assert data["user"]["name"] == "Alex Vance"

    # Check HttpOnly cookie
    assert settings.AUTH_COOKIE_NAME in response.cookies
    cookie = response.cookies[settings.AUTH_COOKIE_NAME]
    assert len(cookie) > 20


@pytest.mark.asyncio
async def test_login_invalid_password(async_client: AsyncClient):
    await async_client.post(
        "/api/v1/auth/register",
        json={"name": "Alex Vance", "email": "alex@example.com", "password": "Password123!"},
    )

    response = await async_client.post(
        "/api/v1/auth/login",
        json={"email": "alex@example.com", "password": "WrongPassword123!"},
    )
    assert response.status_code == 401
    data = response.json()
    assert data["error"]["code"] == "UNAUTHORIZED"
    assert "Invalid email or password" in data["error"]["message"]


@pytest.mark.asyncio
async def test_login_nonexistent_user(async_client: AsyncClient):
    response = await async_client.post(
        "/api/v1/auth/login",
        json={"email": "nobody@example.com", "password": "Password123!"},
    )
    assert response.status_code == 401
    data = response.json()
    assert data["error"]["code"] == "UNAUTHORIZED"


@pytest.mark.asyncio
async def test_me_endpoint_authenticated(async_client: AsyncClient):
    reg = await async_client.post(
        "/api/v1/auth/register",
        json={"name": "Alex Vance", "email": "alex.vance@example.com", "password": "Password123!"},
    )
    assert reg.status_code == 201

    login_res = await async_client.post(
        "/api/v1/auth/login",
        json={"email": "alex.vance@example.com", "password": "Password123!"},
    )
    token = login_res.json()["access_token"]

    response = await async_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    user = response.json()
    assert user["email"] == "alex.vance@example.com"
    assert user["name"] == "Alex Vance"


@pytest.mark.asyncio
async def test_me_endpoint_unauthenticated(async_client: AsyncClient):
    response = await async_client.get("/api/v1/auth/me")
    assert response.status_code == 401
    data = response.json()
    assert data["error"]["code"] == "UNAUTHORIZED"


@pytest.mark.asyncio
async def test_me_endpoint_expired_token(async_client: AsyncClient):
    expired_payload = {
        "sub": "user_id_123",
        "type": "access",
        "iat": int(time.time()) - 3600,
        "exp": int(time.time()) - 1800,
        "jti": "expired-id",
    }
    expired_token = jwt.encode(expired_payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

    response = await async_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {expired_token}"},
    )
    assert response.status_code == 401
    data = response.json()
    assert data["error"]["code"] == "UNAUTHORIZED"
    assert "expired" in data["error"]["message"].lower()


@pytest.mark.asyncio
async def test_token_refresh_and_rotation(async_client: AsyncClient):
    # Register & Login
    await async_client.post(
        "/api/v1/auth/register",
        json={"name": "Alex Vance", "email": "alex.refresh@example.com", "password": "Password123!"},
    )
    login_res = await async_client.post(
        "/api/v1/auth/login",
        json={"email": "alex.refresh@example.com", "password": "Password123!"},
    )
    initial_refresh_cookie = login_res.cookies[settings.AUTH_COOKIE_NAME]

    # Refresh token using cookie
    refresh_res = await async_client.post(
        "/api/v1/auth/refresh",
        cookies={settings.AUTH_COOKIE_NAME: initial_refresh_cookie},
    )
    assert refresh_res.status_code == 200
    data = refresh_res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "alex.refresh@example.com"

    # Rotated cookie must be present
    new_refresh_cookie = refresh_res.cookies[settings.AUTH_COOKIE_NAME]
    assert new_refresh_cookie != initial_refresh_cookie

    # Replay attack attempt: Using old refresh cookie should be rejected!
    replay_res = await async_client.post(
        "/api/v1/auth/refresh",
        cookies={settings.AUTH_COOKIE_NAME: initial_refresh_cookie},
    )
    assert replay_res.status_code == 401


@pytest.mark.asyncio
async def test_logout_revokes_session(async_client: AsyncClient):
    # Register & Login
    await async_client.post(
        "/api/v1/auth/register",
        json={"name": "Alex Vance", "email": "alex.logout@example.com", "password": "Password123!"},
    )
    login_res = await async_client.post(
        "/api/v1/auth/login",
        json={"email": "alex.logout@example.com", "password": "Password123!"},
    )
    refresh_cookie = login_res.cookies[settings.AUTH_COOKIE_NAME]

    # Logout
    logout_res = await async_client.post(
        "/api/v1/auth/logout",
        cookies={settings.AUTH_COOKIE_NAME: refresh_cookie},
    )
    assert logout_res.status_code == 200
    assert logout_res.json()["message"] == "Successfully logged out"

    # Trying to refresh after logout should fail
    refresh_res = await async_client.post(
        "/api/v1/auth/refresh",
        cookies={settings.AUTH_COOKIE_NAME: refresh_cookie},
    )
    assert refresh_res.status_code == 401

