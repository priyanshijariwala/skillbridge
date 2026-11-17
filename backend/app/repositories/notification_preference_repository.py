from datetime import datetime, timezone
from typing import Any, Dict, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.schemas.notification import NON_DISABLEABLE_CATEGORIES, NotificationCategory


class NotificationPreferenceRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.collection = db["notification_preferences"]

    @staticmethod
    def get_default_preferences(user_id: str) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        return {
            "user_id": user_id,
            "email_enabled": True,
            "category_preferences": {
                NotificationCategory.ACCOUNT.value: True,
                NotificationCategory.RESUME.value: True,
                NotificationCategory.SKILL_GAP.value: True,
                NotificationCategory.ROADMAP.value: True,
                NotificationCategory.INTERVIEW.value: True,
                NotificationCategory.CODING.value: True,
                NotificationCategory.SECURITY.value: True,
            },
            "created_at": now,
            "updated_at": now,
        }

    def _format_doc(self, doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        if not doc:
            return None
        doc = dict(doc)
        doc.pop("_id", None)
        return doc

    async def get_by_user(self, user_id: str) -> Dict[str, Any]:
        doc = await self.collection.find_one({"user_id": user_id})
        if not doc:
            default_doc = self.get_default_preferences(user_id)
            await self.collection.insert_one(dict(default_doc))
            return default_doc
        return self._format_doc(doc)

    async def update(
        self,
        user_id: str,
        email_enabled: Optional[bool] = None,
        category_preferences: Optional[Dict[str, bool]] = None,
    ) -> Dict[str, Any]:
        existing = await self.get_by_user(user_id)
        now = datetime.now(timezone.utc)

        update_fields: Dict[str, Any] = {"updated_at": now}
        if email_enabled is not None:
            update_fields["email_enabled"] = email_enabled

        if category_preferences is not None:
            merged = dict(existing.get("category_preferences", {}))
            for cat, val in category_preferences.items():
                # Enforce that security notifications cannot be disabled
                if cat in NON_DISABLEABLE_CATEGORIES:
                    merged[cat] = True
                else:
                    merged[cat] = bool(val)
            update_fields["category_preferences"] = merged

        await self.collection.update_one(
            {"user_id": user_id},
            {"$set": update_fields},
            upsert=True,
        )
        return await self.get_by_user(user_id)

