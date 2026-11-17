from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ReturnDocument


class RoadmapRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.collection = db["roadmaps"]

    def _to_str_id(self, doc: Dict[str, Any]) -> Dict[str, Any]:
        doc = dict(doc)
        doc["id"] = str(doc.pop("_id"))
        return doc

    async def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Insert a new roadmap document and return it with string ID."""
        now = datetime.now(timezone.utc)
        doc = {**data, "created_at": now, "updated_at": now}
        result = await self.collection.insert_one(doc)
        doc["_id"] = result.inserted_id
        return self._to_str_id(doc)

    async def find_by_id_and_user(
        self, roadmap_id: str, user_id: str
    ) -> Optional[Dict[str, Any]]:
        """Return roadmap if it belongs to user_id."""
        try:
            obj_id = ObjectId(roadmap_id)
        except Exception:
            return None
        doc = await self.collection.find_one({"_id": obj_id, "user_id": user_id})
        return self._to_str_id(doc) if doc else None

    async def find_current_active_by_user(
        self, user_id: str
    ) -> Optional[Dict[str, Any]]:
        """Find the latest active roadmap for the user."""
        doc = await self.collection.find_one(
            {"user_id": user_id, "status": "active"},
            sort=[("created_at", -1)],
        )
        return self._to_str_id(doc) if doc else None

    async def find_latest_by_user(
        self, user_id: str
    ) -> Optional[Dict[str, Any]]:
        """Find the latest roadmap regardless of status (active, completed, archived)."""
        doc = await self.collection.find_one(
            {"user_id": user_id},
            sort=[("created_at", -1)],
        )
        return self._to_str_id(doc) if doc else None

    async def list_by_user(
        self, user_id: str, status: Optional[str] = None, limit: int = 50
    ) -> List[Dict[str, Any]]:
        """List user's roadmaps with optional status filter."""
        query: Dict[str, Any] = {"user_id": user_id}
        if status:
            query["status"] = status
        cursor = self.collection.find(query).sort("created_at", -1)
        docs = await cursor.to_list(length=limit)
        return [self._to_str_id(d) for d in docs]

    async def update_roadmap(
        self, roadmap_id: str, user_id: str, updates: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Update roadmap fields and updated_at atomically."""
        try:
            obj_id = ObjectId(roadmap_id)
        except Exception:
            return None
        now = datetime.now(timezone.utc)
        payload = {**updates, "updated_at": now}
        doc = await self.collection.find_one_and_update(
            {"_id": obj_id, "user_id": user_id},
            {"$set": payload},
            return_document=ReturnDocument.AFTER,
        )
        return self._to_str_id(doc) if doc else None

    async def archive_active_for_user(self, user_id: str) -> None:
        """Mark previous active roadmaps as archived when generating a fresh roadmap."""
        now = datetime.now(timezone.utc)
        await self.collection.update_many(
            {"user_id": user_id, "status": "active"},
            {"$set": {"status": "archived", "updated_at": now}},
        )

