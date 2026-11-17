from datetime import datetime, timezone
from typing import Any, Dict, Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ReturnDocument


class UserRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db["users"]

    async def find_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        try:
            obj_id = ObjectId(user_id)
        except Exception:
            return None
        return await self.collection.find_one({"_id": obj_id})

    async def find_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        normalized_email = email.strip().lower()
        return await self.collection.find_one({"email": normalized_email})

    async def create_user(
        self,
        name: str,
        email: str,
        password_hash: str,
        role: str = "user",
    ) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        normalized_email = email.strip().lower()
        user_doc = {
            "email": normalized_email,
            "display_name": name.strip(),
            "password_hash": password_hash,
            "role": role,
            "is_active": True,
            "email_verified": False,
            "created_at": now,
            "updated_at": now,
            "last_login_at": None,
        }
        result = await self.collection.insert_one(user_doc)
        user_doc["_id"] = result.inserted_id
        return user_doc

    async def update_display_name(self, user_id: str, name: str) -> Optional[Dict[str, Any]]:
        try:
            obj_id = ObjectId(user_id)
        except Exception:
            return None
        now = datetime.now(timezone.utc)
        result = await self.collection.find_one_and_update(
            {"_id": obj_id},
            {"$set": {"display_name": name.strip(), "updated_at": now}},
            return_document=ReturnDocument.AFTER,
        )
        return result

    async def update_last_login(self, user_id: str) -> None:
        try:
            obj_id = ObjectId(user_id)
        except Exception:
            return
        now = datetime.now(timezone.utc)
        await self.collection.update_one(
            {"_id": obj_id},
            {"$set": {"last_login_at": now, "updated_at": now}},
        )

