import time
import pytest
import jwt

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    hash_token,
    verify_password,
)


def test_argon2_password_hashing():
    raw_password = "SecurePassword123!"
    hashed = hash_password(raw_password)

    assert hashed != raw_password
    assert hashed.startswith("$argon2id$")
    assert verify_password(raw_password, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False


def test_access_token_generation_and_decoding():
    user_id = "665000000000000000000001"
    token = create_access_token(user_id=user_id)
    payload = decode_token(token)

    assert payload["sub"] == user_id
    assert payload["type"] == "access"
    assert "jti" in payload
    assert payload["exp"] > payload["iat"]


def test_refresh_token_generation_and_decoding():
    user_id = "665000000000000000000001"
    session_id = "test-session-uuid"
    token = create_refresh_token(user_id=user_id, session_id=session_id)
    payload = decode_token(token)

    assert payload["sub"] == user_id
    assert payload["type"] == "refresh"
    assert payload["session_id"] == session_id
    assert "jti" in payload


def test_expired_token_handling():
    # Create manually expired token
    expired_payload = {
        "sub": "user_id_123",
        "type": "access",
        "iat": int(time.time()) - 3600,
        "exp": int(time.time()) - 1800,
        "jti": "expired-id",
    }
    expired_token = jwt.encode(expired_payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

    with pytest.raises(jwt.ExpiredSignatureError):
        decode_token(expired_token)


def test_token_hash_deterministic():
    token = "some-refresh-token-string"
    h1 = hash_token(token)
    h2 = hash_token(token)
    assert h1 == h2
    assert len(h1) == 64

