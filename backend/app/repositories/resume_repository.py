from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase


class ResumeRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.collection = db["resumes"]

    def _to_str_id(self, doc: Dict[str, Any]) -> Dict[str, Any]:
        """Convert ObjectId _id to string id for serialization."""
        doc = dict(doc)
        doc["id"] = str(doc.pop("_id"))
        return doc

    async def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Insert a new resume document and return the saved doc with string id."""
        now = datetime.now(timezone.utc)
        doc = {**data, "created_at": now, "updated_at": now}
        result = await self.collection.insert_one(doc)
        doc["_id"] = result.inserted_id
        return self._to_str_id(doc)

    async def find_by_id_and_user(
        self, resume_id: str, user_id: str
    ) -> Optional[Dict[str, Any]]:
        """Return the resume only if it belongs to user_id. Returns None otherwise."""
        try:
            obj_id = ObjectId(resume_id)
        except Exception:
            return None
        doc = await self.collection.find_one({"_id": obj_id, "user_id": user_id})
        return self._to_str_id(doc) if doc else None

    async def list_by_user(self, user_id: str) -> List[Dict[str, Any]]:
        """Return all resumes for a user ordered newest first."""
        cursor = self.collection.find(
            {"user_id": user_id}
        ).sort("created_at", -1)
        docs = await cursor.to_list(length=200)
        return [self._to_str_id(d) for d in docs]

    async def delete(self, resume_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Delete the resume document and return it. Returns None if not found
        or if the resume does not belong to user_id (ownership enforced at DB level).
        """
        try:
            obj_id = ObjectId(resume_id)
        except Exception:
            return None
        doc = await self.collection.find_one_and_delete(
            {"_id": obj_id, "user_id": user_id}
        )
        return self._to_str_id(doc) if doc else None

