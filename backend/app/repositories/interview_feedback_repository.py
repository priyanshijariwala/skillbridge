from datetime import datetime, timezone
from typing import Any, Dict, Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase


class InterviewFeedbackRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.collection = db["interview_feedback"]

    def _to_str_id(self, doc: Dict[str, Any]) -> Dict[str, Any]:
        doc = dict(doc)
        doc["id"] = str(doc.pop("_id"))
        return doc

    async def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Insert or replace feedback for an interview."""
        now = datetime.now(timezone.utc)
        doc = {**data, "created_at": now}
        result = await self.collection.insert_one(doc)
        doc["_id"] = result.inserted_id
        return self._to_str_id(doc)

    async def find_by_interview_id_and_user(
        self, interview_id: str, user_id: str
    ) -> Optional[Dict[str, Any]]:
        """Find feedback scoped to user_id."""
        doc = await self.collection.find_one(
            {"interview_id": interview_id, "user_id": user_id}
        )
        return self._to_str_id(doc) if doc else None

    async def find_by_interview_id(self, interview_id: str) -> Optional[Dict[str, Any]]:
        """Find feedback by interview_id."""
        doc = await self.collection.find_one({"interview_id": interview_id})
        return self._to_str_id(doc) if doc else None

