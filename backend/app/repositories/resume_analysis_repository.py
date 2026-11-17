from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase


class ResumeAnalysisRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.collection = db["resume_analyses"]

    def _to_str_id(self, doc: Dict[str, Any]) -> Dict[str, Any]:
        doc = dict(doc)
        doc["id"] = str(doc.pop("_id"))
        return doc

    async def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Insert a new analysis record and return it with string ID."""
        now = datetime.now(timezone.utc)
        doc = {**data, "created_at": now, "updated_at": now}
        result = await self.collection.insert_one(doc)
        doc["_id"] = result.inserted_id
        return self._to_str_id(doc)

    async def find_latest_by_resume_and_user(
        self, resume_id: str, user_id: str
    ) -> Optional[Dict[str, Any]]:
        """Find the latest analysis for a given resume owned by user_id."""
        doc = await self.collection.find_one(
            {"resume_id": resume_id, "user_id": user_id},
            sort=[("created_at", -1)],
        )
        return self._to_str_id(doc) if doc else None

    async def find_latest_by_user(
        self, user_id: str
    ) -> Optional[Dict[str, Any]]:
        """Find the latest completed analysis for any resume owned by user_id."""
        doc = await self.collection.find_one(
            {"user_id": user_id, "status": "completed"},
            sort=[("created_at", -1)],
        )
        return self._to_str_id(doc) if doc else None

    async def find_by_id_and_user(
        self, analysis_id: str, user_id: str
    ) -> Optional[Dict[str, Any]]:
        """Find an analysis by its ID scoped to the authenticated user."""
        try:
            obj_id = ObjectId(analysis_id)
        except Exception:
            return None
        doc = await self.collection.find_one({"_id": obj_id, "user_id": user_id})
        return self._to_str_id(doc) if doc else None

    async def list_by_resume(
        self, resume_id: str, user_id: str
    ) -> List[Dict[str, Any]]:
        """List all analyses for a resume in reverse chronological order."""
        cursor = self.collection.find(
            {"resume_id": resume_id, "user_id": user_id}
        ).sort("created_at", -1)
        docs = await cursor.to_list(length=100)
        return [self._to_str_id(d) for d in docs]

