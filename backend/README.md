# SkillBridge AI — Backend Service

FastAPI-powered REST API backend for SkillBridge AI career preparation and assessment platform.

## Architecture

- **Framework**: FastAPI (Python 3.10+)
- **Database**: MongoDB (Async PyMongo / Motor)
- **Authentication**: JWT access tokens (15m expiry) + Rotating HttpOnly refresh cookies (14d expiry)
- **Password Security**: Argon2id hashing via `argon2-cffi`
- **Validation**: Pydantic v2 & Pydantic Settings
- **AI & Speech Providers**: OpenAI (GPT-4o-mini, Whisper-1, TTS-1) with full offline mock provider fallbacks

## Directory Structure

```text
backend/
├── app/
│   ├── api/v1/
│   │   ├── endpoints/
│   │   │   └── auth.py       # Authentication routes (/register, /login, /refresh, /logout, /me)
│   │   └── router.py         # API router aggregation
│   ├── core/
│   │   ├── config.py         # Pydantic Settings & environment variables
│   │   ├── errors.py         # Centralized error handler & JSON structure
│   │   └── security.py       # Argon2id hashing & JWT token operations
│   ├── db/
│   │   └── mongodb.py        # Motor async client & index initialization
│   ├── dependencies/
│   │   └── auth.py           # Dependency injection for DB repos & current user
│   ├── models/
│   │   └── user.py           # MongoDB document persistence models
│   ├── repositories/
│   │   ├── user_repository.py
│   │   └── refresh_session_repository.py
│   ├── schemas/
│   │   ├── auth.py           # Auth request/response DTOs
│   │   └── user.py           # User read/create DTOs
│   ├── services/
│   │   └── auth_service.py   # Core authentication business logic & session rotation
│   └── main.py               # FastAPI entry point & CORS configuration
├── tests/
│   ├── conftest.py           # Test fixtures & test DB configuration
│   ├── test_auth_api.py      # End-to-end endpoint tests
│   └── test_security.py      # Security & JWT unit tests
├── requirements.txt
├── pytest.ini
├── .env.example
└── .env
```

## Running Locally

1. **Virtual Environment & Dependencies**:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

2. **MongoDB**:
   Ensure MongoDB is running at `mongodb://localhost:27017`.

3. **Start Server**:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

4. **Run Tests**:
   ```bash
   pytest
   ```

