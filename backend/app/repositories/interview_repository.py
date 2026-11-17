from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ReturnDocument


class InterviewRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.collection = db["interviews"]

    def _to_str_id(self, doc: Dict[str, Any]) -> Dict[str, Any]:
        doc = dict(doc)
        doc["id"] = str(doc.pop("_id"))
        return doc

    async def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Insert a new interview document."""
        now = datetime.now(timezone.utc)
        doc = {**data, "created_at": now, "updated_at": now}
        result = await self.collection.insert_one(doc)
        doc["_id"] = result.inserted_id
        return self._to_str_id(doc)

    async def find_by_id_and_user(
        self, interview_id: str, user_id: str
    ) -> Optional[Dict[str, Any]]:
        """Find interview owned by user_id."""
        try:
            obj_id = ObjectId(interview_id)
        except Exception:
            return None
        doc = await self.collection.find_one({"_id": obj_id, "user_id": user_id})
        return self._to_str_id(doc) if doc else None

    async def update(
        self, interview_id: str, user_id: str, updates: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Update interview fields atomically."""
        try:
            obj_id = ObjectId(interview_id)
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

    async def list_by_user(
        self,
        user_id: str,
        status: Optional[str] = None,
        interview_type: Optional[str] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> List[Dict[str, Any]]:
        """List user's interviews with optional filters, sorted newest first."""
        query: Dict[str, Any] = {"user_id": user_id}
        if status and status != "all":
            query["status"] = status
        if interview_type and interview_type != "all":
            query["interview_type"] = interview_type

        cursor = self.collection.find(query).sort("created_at", -1).skip(skip).limit(limit)
        docs = await cursor.to_list(length=limit)
        return [self._to_str_id(d) for d in docs]

    async def count_by_user(
        self,
        user_id: str,
        status: Optional[str] = None,
        interview_type: Optional[str] = None,
    ) -> int:
        """Count total matching interviews for user."""
        query: Dict[str, Any] = {"user_id": user_id}
        if status and status != "all":
            query["status"] = status
        if interview_type and interview_type != "all":
            query["interview_type"] = interview_type
        return await self.collection.count_documents(query)

