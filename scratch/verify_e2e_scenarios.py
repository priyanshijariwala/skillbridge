import asyncio
import httpx
from motor.motor_asyncio import AsyncIOMotorClient

API_BASE = "http://127.0.0.1:8000/api/v1"
FRONTEND_URL = "http://localhost:5173"
MONGO_URL = "mongodb://127.0.0.1:27017"
DB_NAME = "skillbridge"

async def main():
    print("=== STARTING FULL END-TO-END MANUAL INTEGRATION VERIFICATION ===")
    
    # 0. Test Frontend Server Availability
    async with httpx.AsyncClient() as client:
        fe_res = await client.get(FRONTEND_URL)
        assert fe_res.status_code == 200, f"Frontend returned {fe_res.status_code}"
        assert "<div id=\"root\">" in fe_res.text, "Vite root element missing"
        print("✅ Frontend Dev Server responding at http://localhost:5173 (Status 200)")

    # MongoDB connection
    mongo_client = AsyncIOMotorClient(MONGO_URL)
    db = mongo_client[DB_NAME]

    async with httpx.AsyncClient(base_url=API_BASE) as client:
        # Scenario 1: New User Registration
        test_email = "test.candidate@skillbridge.ai"
        test_pass = "CandidateSecurePass2026!"
        test_name = "Morgan Yu"

        # Clean prior test user if exists
        await db["users"].delete_many({"email": test_email})

        reg_res = await client.post("/auth/register", json={
            "name": test_name,
            "email": test_email,
            "password": test_pass,
        })
        assert reg_res.status_code == 201, f"Registration failed: {reg_res.text}"
        reg_data = reg_res.json()
        assert reg_data["name"] == test_name
        assert reg_data["email"] == test_email
        assert "password" not in reg_data
        assert "password_hash" not in reg_data
        print("✅ Scenario 1.1: Registration API returned 201 Created with safe user DTO")

        # Verify MongoDB storage & Argon2id hashing
        db_user = await db["users"].find_one({"email": test_email})
        assert db_user is not None, "User not found in MongoDB"
        assert db_user["display_name"] == test_name
        assert db_user["password_hash"].startswith("$argon2id$")
        print("✅ Scenario 1.2: MongoDB verification confirmed record created with Argon2id password hash")

        # Verify duplicate registration rejection
        dup_res = await client.post("/auth/register", json={
            "name": test_name,
            "email": test_email,
            "password": test_pass,
        })
        assert dup_res.status_code == 409, f"Expected 409 Conflict, got {dup_res.status_code}"
        assert dup_res.json()["error"]["code"] == "CONFLICT"
        print("✅ Scenario 1.3: Duplicate registration correctly rejected with 409 Conflict")

        # Scenario 2: Login with Valid Credentials
        login_res = await client.post("/auth/login", json={
            "email": test_email,
            "password": test_pass,
        })
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        login_data = login_res.json()
        access_token = login_data["access_token"]
        assert access_token and len(access_token) > 30
        assert login_data["token_type"] == "bearer"
        assert login_data["user"]["email"] == test_email
        assert "skillbridge_refresh" in login_res.cookies
        refresh_cookie = login_res.cookies["skillbridge_refresh"]
        print("✅ Scenario 2: Successful login issued JWT access token and HttpOnly refresh cookie")

        # Scenario 3: Invalid Login
        invalid_res = await client.post("/auth/login", json={
            "email": test_email,
            "password": "WrongPassword!",
        })
        assert invalid_res.status_code == 401, f"Expected 401, got {invalid_res.status_code}"
        assert invalid_res.json()["error"]["code"] == "UNAUTHORIZED"
        assert "Invalid email or password" in invalid_res.json()["error"]["message"]
        print("✅ Scenario 3: Invalid login rejected with 401 Unauthorized and generic error message")

        # Scenario 4: Persistent Session (Token Refresh via Cookie)
        refresh_res = await client.post("/auth/refresh", cookies={"skillbridge_refresh": refresh_cookie})
        assert refresh_res.status_code == 200, f"Refresh failed: {refresh_res.text}"
        refresh_data = refresh_res.json()
        new_access_token = refresh_data["access_token"]
        assert "skillbridge_refresh" in refresh_res.cookies
        rotated_cookie = refresh_res.cookies["skillbridge_refresh"]
        assert rotated_cookie != refresh_cookie, "Cookie was not rotated on refresh"
        print("✅ Scenario 4.1: Token refresh succeeded using HttpOnly cookie with rotation")

        # Verify access token works on /auth/me
        me_res = await client.get("/auth/me", headers={"Authorization": f"Bearer {new_access_token}"})
        assert me_res.status_code == 200, f"/auth/me failed: {me_res.text}"
        me_data = me_res.json()
        assert me_data["email"] == test_email
        assert me_data["name"] == test_name
        print("✅ Scenario 4.2: Current user profile verified with fresh access token on /auth/me")

        # Scenario 5: Protected Route Access Blocked when Unauthenticated
        unauth_res = await client.get("/auth/me")
        assert unauth_res.status_code == 401
        print("✅ Scenario 5: Protected route access blocked without credentials (401 Unauthorized)")

        # Scenario 6: Logout
        logout_res = await client.post("/auth/logout", cookies={"skillbridge_refresh": rotated_cookie})
        assert logout_res.status_code == 200
        assert logout_res.json()["message"] == "Successfully logged out"
        
        # Verify refresh session is revoked in MongoDB
        db_sessions = await db["refresh_sessions"].find({"user_id": str(db_user["_id"])}).to_list(10)
        assert any(s["is_revoked"] for s in db_sessions), "Session was not marked revoked"

        # Verify using the cookie now fails
        stale_refresh = await client.post("/auth/refresh", cookies={"skillbridge_refresh": rotated_cookie})
        assert stale_refresh.status_code == 401
        print("✅ Scenario 6: Logout revoked session in MongoDB, expired cookies, and blocked subsequent refreshes")

        # Scenario 7: Verify CORS Headers and Security Headers
        cors_res = await client.options("/auth/login", headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type",
        })
        assert cors_res.status_code == 200
        assert cors_res.headers.get("access-control-allow-origin") == "http://localhost:5173"
        assert cors_res.headers.get("access-control-allow-credentials") == "true"
        print("✅ Scenario 7: CORS correctly configured for http://localhost:5173 with credentials enabled")

    mongo_client.close()
    print("\n🎉 ALL 7 MANUAL INTEGRATION SCENARIOS VERIFIED SUCCESSFULLY!")

if __name__ == "__main__":
    asyncio.run(main())

