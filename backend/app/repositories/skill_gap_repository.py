from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase


class SkillGapRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.collection = db["skill_gap_analyses"]

    def _to_str_id(self, doc: Dict[str, Any]) -> Dict[str, Any]:
        doc = dict(doc)
        doc["id"] = str(doc.pop("_id"))
        return doc

    async def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Insert a new skill gap analysis document."""
        now = datetime.now(timezone.utc)
        doc = {**data, "created_at": now, "updated_at": now}
        result = await self.collection.insert_one(doc)
        doc["_id"] = result.inserted_id
        return self._to_str_id(doc)

    async def find_latest_by_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Return the most recent skill gap analysis for the given user."""
        doc = await self.collection.find_one(
            {"user_id": user_id},
            sort=[("created_at", -1)],
        )
        return self._to_str_id(doc) if doc else None

    async def find_by_id_and_user(
        self, analysis_id: str, user_id: str
    ) -> Optional[Dict[str, Any]]:
        """Return analysis if owned by user_id."""
        try:
            obj_id = ObjectId(analysis_id)
        except Exception:
            return None
        doc = await self.collection.find_one({"_id": obj_id, "user_id": user_id})
        return self._to_str_id(doc) if doc else None

    async def list_by_user(
        self, user_id: str, limit: int = 50
    ) -> List[Dict[str, Any]]:
        """List user's analyses sorted newest first."""
        cursor = self.collection.find({"user_id": user_id}).sort("created_at", -1)
        docs = await cursor.to_list(length=limit)
        return [self._to_str_id(d) for d in docs]

    async def mark_stale_for_user(self, user_id: str) -> None:
        """Mark previous analyses as stale when user's resume or target role changes."""
        await self.collection.update_many(
            {"user_id": user_id, "is_stale": False},
            {"$set": {"is_stale": True, "updated_at": datetime.now(timezone.utc)}},
        )

