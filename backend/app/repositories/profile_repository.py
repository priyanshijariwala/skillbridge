from datetime import datetime, timezone
from typing import Any, Dict, Optional

from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ReturnDocument


class ProfileRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.collection = db["profiles"]

    async def find_by_user_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Return the profile document for the given user_id, or None."""
        return await self.collection.find_one({"user_id": user_id})

    async def upsert_profile(
        self, user_id: str, data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Insert or update the profile for user_id.
        On first insert, sets created_at. Always updates updated_at.
        Returns the final document.
        """
        now = datetime.now(timezone.utc)
        update_fields = {k: v for k, v in data.items() if v is not None or k in data}
        update_fields["updated_at"] = now

        result = await self.collection.find_one_and_update(
            {"user_id": user_id},
            {
                "$set": update_fields,
                "$setOnInsert": {"user_id": user_id, "created_at": now},
            },
            upsert=True,
            return_document=ReturnDocument.AFTER,
        )
        return result

