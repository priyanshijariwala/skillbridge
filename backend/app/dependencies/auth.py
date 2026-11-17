from typing import Optional
from fastapi import Depends, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import jwt
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.errors import AppException
from app.core.security import decode_token
from app.db.mongodb import get_database
from app.repositories.refresh_session_repository import RefreshSessionRepository
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserRead
from app.services.auth_service import AuthService

security_bearer = HTTPBearer(auto_error=False)


async def get_user_repository(
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> UserRepository:
    return UserRepository(db)


async def get_refresh_session_repository(
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> RefreshSessionRepository:
    return RefreshSessionRepository(db)


async def get_auth_service(
    user_repo: UserRepository = Depends(get_user_repository),
    session_repo: RefreshSessionRepository = Depends(get_refresh_session_repository),
) -> AuthService:
    return AuthService(user_repo=user_repo, session_repo=session_repo)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    auth_service: AuthService = Depends(get_auth_service),
) -> UserRead:
    if not credentials or not credentials.credentials:
        raise AppException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            code="UNAUTHORIZED",
            message="Authentication credentials were not provided.",
        )

    token = credentials.credentials
    try:
        payload = decode_token(token)
    except jwt.ExpiredSignatureError:
        raise AppException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            code="UNAUTHORIZED",
            message="Access token has expired.",
        )
    except jwt.PyJWTError:
        raise AppException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            code="UNAUTHORIZED",
            message="Invalid access token.",
        )

    if payload.get("type") != "access":
        raise AppException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            code="UNAUTHORIZED",
            message="Token is not an access token.",
        )

    user_id = payload.get("sub")
    if not user_id:
        raise AppException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            code="UNAUTHORIZED",
            message="Token payload invalid.",
        )

    return await auth_service.get_current_user(user_id)

