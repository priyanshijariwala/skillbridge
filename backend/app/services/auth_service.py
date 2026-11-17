import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
from fastapi import status
import jwt

from app.core.config import settings
from app.core.errors import AppException
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    hash_token,
    verify_password,
)
from app.repositories.refresh_session_repository import RefreshSessionRepository
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserRead


class AuthService:
    def __init__(
        self,
        user_repo: UserRepository,
        session_repo: RefreshSessionRepository,
    ):
        self.user_repo = user_repo
        self.session_repo = session_repo

    def _to_user_read(self, user_doc: dict) -> UserRead:
        return UserRead(
            id=str(user_doc["_id"]),
            name=user_doc.get("display_name", ""),
            email=user_doc.get("email", ""),
            role=user_doc.get("role", "user"),
            is_active=user_doc.get("is_active", True),
            created_at=user_doc.get("created_at"),
        )

    async def register(self, name: str, email: str, password: str) -> UserRead:
        normalized_email = email.strip().lower()
        existing = await self.user_repo.find_by_email(normalized_email)
        if existing:
            raise AppException(
                status_code=status.HTTP_409_CONFLICT,
                code="CONFLICT",
                message="A user with this email already exists.",
            )

        password_hash = hash_password(password)
        user_doc = await self.user_repo.create_user(
            name=name,
            email=normalized_email,
            password_hash=password_hash,
            role="user",
        )
        user_read = self._to_user_read(user_doc)
        
        # Dispatch Welcome Notification & Email
        try:
            from app.services.notifications.notification_service import NotificationService
            from app.schemas.notification import NotificationEvent, NotificationCategory, NotificationType
            notif_service = NotificationService(self.user_repo.collection.database)
            await notif_service.get_preferences(user_read.id)
            await notif_service.dispatch_event(
                NotificationEvent(
                    user_id=user_read.id,
                    title="Welcome to SkillBridge AI!",
                    message="Your career acceleration platform is ready. Upload your resume or analyze skill gaps to get started.",
                    category=NotificationCategory.ACCOUNT.value,
                    type=NotificationType.SUCCESS.value,
                    action_url="/dashboard",
                    email_template="welcome",
                    email_subject="Welcome to SkillBridge AI — Ready for your career transformation?",
                    email_context={"name": user_read.name},
                    recipient_email=user_read.email,
                )
            )
        except Exception:
            pass

        return user_read

    async def login(
        self, email: str, password: str
    ) -> Tuple[str, str, int, UserRead]:
        normalized_email = email.strip().lower()
        user = await self.user_repo.find_by_email(normalized_email)

        if not user or not user.get("is_active", True):
            raise AppException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                code="UNAUTHORIZED",
                message="Invalid email or password.",
            )

        if not verify_password(password, user.get("password_hash", "")):
            raise AppException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                code="UNAUTHORIZED",
                message="Invalid email or password.",
            )

        user_id = str(user["_id"])
        await self.user_repo.update_last_login(user_id)

        # Create refresh session
        session_id = str(uuid.uuid4())
        access_token = create_access_token(user_id=user_id)
        refresh_token = create_refresh_token(user_id=user_id, session_id=session_id)
        
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        token_hash = hash_token(refresh_token)

        await self.session_repo.create_session(
            session_id=session_id,
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
        )

        expires_in = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        return access_token, refresh_token, expires_in, self._to_user_read(user)

    async def refresh_tokens(
        self, raw_refresh_token: str
    ) -> Tuple[str, str, int, UserRead]:
        if not raw_refresh_token:
            raise AppException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                code="UNAUTHORIZED",
                message="Refresh token is missing.",
            )

        try:
            payload = decode_token(raw_refresh_token)
        except jwt.ExpiredSignatureError:
            raise AppException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                code="UNAUTHORIZED",
                message="Refresh token has expired. Please log in again.",
            )
        except jwt.PyJWTError:
            raise AppException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                code="UNAUTHORIZED",
                message="Invalid refresh token.",
            )

        if payload.get("type") != "refresh":
            raise AppException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                code="UNAUTHORIZED",
                message="Token is not a valid refresh token.",
            )

        user_id = payload.get("sub")
        session_id = payload.get("session_id")
        if not user_id or not session_id:
            raise AppException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                code="UNAUTHORIZED",
                message="Invalid token claims.",
            )

        session = await self.session_repo.find_session(session_id)
        if not session or session.get("is_revoked", False):
            raise AppException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                code="UNAUTHORIZED",
                message="Session has been revoked or expired.",
            )

        # Detect reuse/tamper: verify stored token hash
        current_hash = hash_token(raw_refresh_token)
        if session.get("token_hash") != current_hash:
            # Replay attack suspected: revoke all sessions for this user
            await self.session_repo.revoke_all_for_user(user_id)
            raise AppException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                code="UNAUTHORIZED",
                message="Security violation: token reuse detected. Please log in again.",
            )

        user = await self.user_repo.find_by_id(user_id)
        if not user or not user.get("is_active", True):
            raise AppException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                code="UNAUTHORIZED",
                message="User account is inactive or not found.",
            )

        # Token rotation: issue new access token and rotated refresh token
        new_access_token = create_access_token(user_id=user_id)
        new_refresh_token = create_refresh_token(user_id=user_id, session_id=session_id)
        
        now = datetime.now(timezone.utc)
        new_expires_at = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        new_token_hash = hash_token(new_refresh_token)

        await self.session_repo.update_session_token(
            session_id=session_id,
            new_token_hash=new_token_hash,
            new_expires_at=new_expires_at,
        )

        expires_in = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        return new_access_token, new_refresh_token, expires_in, self._to_user_read(user)

    async def logout(self, raw_refresh_token: Optional[str]) -> None:
        if not raw_refresh_token:
            return

        try:
            payload = decode_token(raw_refresh_token)
            session_id = payload.get("session_id")
            if session_id:
                await self.session_repo.revoke_session(session_id)
        except Exception:
            # Logout should succeed safely even if token was already expired
            pass

    async def get_current_user(self, user_id: str) -> UserRead:
        user = await self.user_repo.find_by_id(user_id)
        if not user or not user.get("is_active", True):
            raise AppException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                code="UNAUTHORIZED",
                message="User not found or inactive.",
            )
        return self._to_user_read(user)

