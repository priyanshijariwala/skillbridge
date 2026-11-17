from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase


class CodingAssessmentRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.collection = db["coding_assessments"]

    def _format_doc(self, doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        if not doc:
            return None
        doc = dict(doc)
        doc["id"] = str(doc.pop("_id"))
        return doc

    async def create(self, doc: Dict[str, Any]) -> Dict[str, Any]:
        data = dict(doc)
        now = datetime.now(timezone.utc)
        data.setdefault("created_at", now)
        data.setdefault("updated_at", now)
        res = await self.collection.insert_one(data)
        data["id"] = str(res.inserted_id)
        data.pop("_id", None)
        return data

    async def find_by_id_and_user(self, assessment_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        try:
            oid = ObjectId(assessment_id)
            doc = await self.collection.find_one({"_id": oid, "user_id": user_id})
        except Exception:
            doc = await self.collection.find_one({"id": assessment_id, "user_id": user_id})
        return self._format_doc(doc)

    async def list_by_user(
        self,
        user_id: str,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[Dict[str, Any]], int]:
        query = {"user_id": user_id}
        total = await self.collection.count_documents(query)
        skip = (page - 1) * page_size
        cursor = (
            self.collection.find(query)
            .sort("created_at", -1)
            .skip(skip)
            .limit(page_size)
        )
        docs = await cursor.to_list(length=page_size)
        return [self._format_doc(d) for d in docs if d], total

    async def update(self, assessment_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        update_data = dict(data)
        update_data["updated_at"] = datetime.now(timezone.utc)
        try:
            oid = ObjectId(assessment_id)
            filter_query = {"_id": oid}
        except Exception:
            filter_query = {"id": assessment_id}

        res = await self.collection.find_one_and_update(
            filter_query,
            {"$set": update_data},
            return_document=True,
        )
        return self._format_doc(res)
