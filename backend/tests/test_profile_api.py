"""Profile API tests — Day 7."""
import pytest
from httpx import AsyncClient
from motor.motor_asyncio import AsyncIOMotorDatabase

from tests.conftest import register_and_login


pytestmark = pytest.mark.asyncio


class TestGetProfile:
    async def test_get_profile_unauthenticated(self, async_client_full: AsyncClient):
        resp = await async_client_full.get("/api/v1/profiles/me")
        assert resp.status_code == 401

    async def test_get_profile_creates_default(self, async_client_full: AsyncClient):
        headers = await register_and_login(async_client_full)
        resp = await async_client_full.get("/api/v1/profiles/me", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["user_id"] is not None
        assert data["email"] == "test@example.com"
        assert data["full_name"] == "Test User"
        assert isinstance(data["skills"], list)

    async def test_get_profile_includes_user_fields(self, async_client_full: AsyncClient):
        headers = await register_and_login(
            async_client_full, email="profile_user@example.com", name="Jane Doe"
        )
        resp = await async_client_full.get("/api/v1/profiles/me", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["full_name"] == "Jane Doe"
        assert resp.json()["email"] == "profile_user@example.com"


class TestUpdateProfile:
    async def test_update_profile_basic_fields(self, async_client_full: AsyncClient):
        headers = await register_and_login(async_client_full, email="update1@example.com")
        payload = {
            "headline": "Senior Backend Engineer",
            "bio": "Passionate about scalable systems.",
            "years_of_experience": 5,
            "target_seniority": "Senior",
        }
        resp = await async_client_full.put(
            "/api/v1/profiles/me", json=payload, headers=headers
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["headline"] == "Senior Backend Engineer"
        assert data["years_of_experience"] == 5
        assert data["target_seniority"] == "Senior"

    async def test_update_profile_name_propagates_to_user(
        self, async_client_full: AsyncClient
    ):
        headers = await register_and_login(async_client_full, email="update2@example.com")
        resp = await async_client_full.put(
            "/api/v1/profiles/me",
            json={"full_name": "Updated Name"},
            headers=headers,
        )
        assert resp.status_code == 200
        assert resp.json()["full_name"] == "Updated Name"

        # Confirm the user account also reflects the name change
        me_resp = await async_client_full.get("/api/v1/users/me", headers=headers)
        assert me_resp.json()["name"] == "Updated Name"

    async def test_update_profile_skills(self, async_client_full: AsyncClient):
        headers = await register_and_login(async_client_full, email="skills@example.com")
        resp = await async_client_full.put(
            "/api/v1/profiles/me",
            json={"skills": ["Python", "FastAPI", "MongoDB"]},
            headers=headers,
        )
        assert resp.status_code == 200
        assert resp.json()["skills"] == ["Python", "FastAPI", "MongoDB"]

    async def test_update_profile_valid_urls(self, async_client_full: AsyncClient):
        headers = await register_and_login(async_client_full, email="urls@example.com")
        resp = await async_client_full.put(
            "/api/v1/profiles/me",
            json={
                "linkedin_url": "https://linkedin.com/in/testuser",
                "github_url": "https://github.com/testuser",
            },
            headers=headers,
        )
        assert resp.status_code == 200

    async def test_update_profile_invalid_url_rejected(self, async_client_full: AsyncClient):
        headers = await register_and_login(async_client_full, email="badurl@example.com")
        resp = await async_client_full.put(
            "/api/v1/profiles/me",
            json={"linkedin_url": "not-a-url"},
            headers=headers,
        )
        assert resp.status_code == 422

    async def test_update_profile_invalid_seniority(self, async_client_full: AsyncClient):
        headers = await register_and_login(
            async_client_full, email="seniority@example.com"
        )
        resp = await async_client_full.put(
            "/api/v1/profiles/me",
            json={"target_seniority": "InvalidLevel"},
            headers=headers,
        )
        assert resp.status_code == 422

    async def test_update_profile_headline_too_long(self, async_client_full: AsyncClient):
        headers = await register_and_login(async_client_full, email="long@example.com")
        resp = await async_client_full.put(
            "/api/v1/profiles/me",
            json={"headline": "x" * 201},
            headers=headers,
        )
        assert resp.status_code == 422

    async def test_update_profile_unauthenticated(self, async_client_full: AsyncClient):
        resp = await async_client_full.put(
            "/api/v1/profiles/me", json={"headline": "Test"}
        )
        assert resp.status_code == 401

    async def test_profile_isolated_between_users(self, async_client_full: AsyncClient):
        """Users cannot see each other's profile data via their own /me endpoint."""
        headers_a = await register_and_login(
            async_client_full, email="user_a@example.com", name="User A"
        )
        headers_b = await register_and_login(
            async_client_full, email="user_b@example.com", name="User B"
        )

        await async_client_full.put(
            "/api/v1/profiles/me",
            json={"headline": "User A Headline"},
            headers=headers_a,
        )

        resp_b = await async_client_full.get("/api/v1/profiles/me", headers=headers_b)
        assert resp_b.json()["headline"] != "User A Headline"
        assert resp_b.json()["full_name"] == "User B"

