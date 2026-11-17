from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase


class CodingProblemRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.collection = db["coding_problems"]

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

    async def find_by_id(self, problem_id: str) -> Optional[Dict[str, Any]]:
        try:
            oid = ObjectId(problem_id)
            doc = await self.collection.find_one({"_id": oid})
        except Exception:
            doc = await self.collection.find_one({"slug": problem_id})
        return self._format_doc(doc)

    async def find_by_slug(self, slug: str) -> Optional[Dict[str, Any]]:
        doc = await self.collection.find_one({"slug": slug})
        return self._format_doc(doc)

    async def list_problems(
        self,
        difficulty: Optional[str] = None,
        category: Optional[str] = None,
        topic: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
        only_active: bool = True,
    ) -> Tuple[List[Dict[str, Any]], int]:
        query: Dict[str, Any] = {}
        if only_active:
            query["is_active"] = True
        if difficulty:
            query["difficulty"] = difficulty.lower().strip()
        if category:
            query["category"] = category.lower().strip()
        if topic:
            query["topics"] = {"$regex": f"^{topic.strip()}$", "$options": "i"}
        if search:
            query["$or"] = [
                {"title": {"$regex": search.strip(), "$options": "i"}},
                {"slug": {"$regex": search.strip(), "$options": "i"}},
                {"topics": {"$regex": search.strip(), "$options": "i"}},
            ]

        total = await self.collection.count_documents(query)
        skip = (page - 1) * page_size
        cursor = (
            self.collection.find(query)
            .sort([("created_at", 1), ("_id", 1)])
            .skip(skip)
            .limit(page_size)
        )
        docs = await cursor.to_list(length=page_size)
        return [self._format_doc(d) for d in docs if d], total

    async def update(self, problem_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        update_data = dict(data)
        update_data["updated_at"] = datetime.now(timezone.utc)
        try:
            oid = ObjectId(problem_id)
            filter_query = {"_id": oid}
        except Exception:
            filter_query = {"slug": problem_id}

        res = await self.collection.find_one_and_update(
            filter_query,
            {"$set": update_data},
            return_document=True,
        )
        return self._format_doc(res)
