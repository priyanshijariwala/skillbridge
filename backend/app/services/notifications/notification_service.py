import asyncio
import logging
from typing import Any, Dict, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.errors import AppException
from app.repositories.notification_preference_repository import NotificationPreferenceRepository
from app.repositories.notification_repository import NotificationRepository
from app.schemas.notification import (
    NON_DISABLEABLE_CATEGORIES,
    NotificationEvent,
    NotificationListResponse,
    NotificationPreferenceRead,
    NotificationPreferenceUpdate,
    NotificationRead,
    UnreadCountResponse,
)
from app.services.notifications.email_templates import EmailTemplateService
from app.services.notifications.email_worker import EmailWorker

logger = logging.getLogger(__name__)


class NotificationService:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.db = db
        self.notification_repo = NotificationRepository(db)
        self.preference_repo = NotificationPreferenceRepository(db)
        self.email_worker = EmailWorker(db)

    async def list_notifications(
        self,
        user_id: str,
        is_read: Optional[bool] = None,
        category: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> NotificationListResponse:
        docs, total, unread_count = await self.notification_repo.list_by_user(
            user_id=user_id,
            is_read=is_read,
            category=category,
            page=page,
            page_size=page_size,
        )
        items = [NotificationRead(**d) for d in docs]
        return NotificationListResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            unread_count=unread_count,
        )

    async def get_unread_count(self, user_id: str) -> UnreadCountResponse:
        count = await self.notification_repo.count_unread(user_id)
        return UnreadCountResponse(unread_count=count)

    async def mark_as_read(self, notification_id: str, user_id: str) -> NotificationRead:
        doc = await self.notification_repo.mark_as_read(notification_id, user_id)
        if not doc:
            raise AppException(
                status_code=404,
                code="NOTIFICATION_NOT_FOUND",
                message="Notification not found or access denied.",
            )
        return NotificationRead(**doc)

    async def mark_all_as_read(self, user_id: str) -> int:
        return await self.notification_repo.mark_all_as_read(user_id)

    async def delete_notification(self, notification_id: str, user_id: str) -> bool:
        success = await self.notification_repo.delete_notification(notification_id, user_id)
        if not success:
            raise AppException(
                status_code=404,
                code="NOTIFICATION_NOT_FOUND",
                message="Notification not found or access denied.",
            )
        return True

    async def get_preferences(self, user_id: str) -> NotificationPreferenceRead:
        doc = await self.preference_repo.get_by_user(user_id)
        return NotificationPreferenceRead(**doc)

    async def update_preferences(
        self,
        user_id: str,
        payload: NotificationPreferenceUpdate,
    ) -> NotificationPreferenceRead:
        doc = await self.preference_repo.update(
            user_id=user_id,
            email_enabled=payload.email_enabled,
            category_preferences=payload.category_preferences,
        )
        return NotificationPreferenceRead(**doc)

    async def dispatch_event(self, event: NotificationEvent) -> NotificationRead:
        """
        Processes a domain notification event:
        1. Persists in-app notification to MongoDB.
        2. Checks recipient preferences.
        3. Asynchronously triggers transactional email if applicable.
        """
        # 1. Create in-app notification
        notif_doc = await self.notification_repo.create({
            "user_id": event.user_id,
            "title": event.title,
            "message": event.message,
            "category": event.category,
            "type": event.type,
            "action_url": event.action_url,
            "metadata": event.metadata,
        })
        notification = NotificationRead(**notif_doc)

        # 2. Check if email should be dispatched
        if event.email_template:
            await self._maybe_queue_email(event)

        return notification

    async def _maybe_queue_email(self, event: NotificationEvent) -> None:
        user_id = event.user_id
        category = event.category

        # Check preferences
        prefs = await self.preference_repo.get_by_user(user_id)
        is_security = category in NON_DISABLEABLE_CATEGORIES

        email_enabled = prefs.get("email_enabled", True)
        category_allowed = prefs.get("category_preferences", {}).get(category, True)

        # Essential security emails cannot be disabled
        should_send = is_security or (email_enabled and category_allowed)
        if not should_send:
            logger.info("Email suppressed for user %s (category: %s) based on preferences", user_id, category)
            return

        # Resolve recipient email
        recipient_email = event.recipient_email
        if not recipient_email:
            user_doc = await self.db["users"].find_one({"_id": user_id})
            if not user_doc:
                # Try finding by string or ObjectId if needed
                from bson import ObjectId
                try:
                    user_doc = await self.db["users"].find_one({"_id": ObjectId(user_id)})
                except Exception:
                    pass
            if user_doc and "email" in user_doc:
                recipient_email = user_doc["email"]

        if not recipient_email:
            logger.warning("Could not resolve recipient email for user %s; email skipped", user_id)
            return

        # Render email content
        template_name = event.email_template or "default"
        context = dict(event.email_context)
        context.setdefault("subject", event.email_subject or event.title)
        context.setdefault("message", event.message)
        context.setdefault("title", event.title)

        subject, html_body, text_body = EmailTemplateService.render(template_name, context)

        # Queue non-blocking background task
        asyncio.create_task(
            self.email_worker.send_transactional_email(
                user_id=user_id,
                to_email=recipient_email,
                template=template_name,
                subject=subject,
                html_content=html_body,
                text_content=text_body,
                metadata={"category": category, "notification_id": notif_doc.get("id") if "notif_doc" in locals() else None},
            )
        )

