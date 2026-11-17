from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set, Tuple
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase


class CodeSubmissionRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.collection = db["code_submissions"]

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

    async def find_by_id_and_user(self, submission_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        try:
            oid = ObjectId(submission_id)
            doc = await self.collection.find_one({"_id": oid, "user_id": user_id})
        except Exception:
            doc = await self.collection.find_one({"id": submission_id, "user_id": user_id})
        return self._format_doc(doc)

    async def find_by_id(self, submission_id: str) -> Optional[Dict[str, Any]]:
        try:
            oid = ObjectId(submission_id)
            doc = await self.collection.find_one({"_id": oid})
        except Exception:
            doc = await self.collection.find_one({"id": submission_id})
        return self._format_doc(doc)

    async def list_by_user(
        self,
        user_id: str,
        problem_id: Optional[str] = None,
        status: Optional[str] = None,
        language: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[Dict[str, Any]], int]:
        query: Dict[str, Any] = {"user_id": user_id}
        if problem_id:
            query["problem_id"] = problem_id
        if status:
            query["execution_status"] = status.lower().strip()
        if language:
            query["language"] = language.lower().strip()

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

    async def get_user_solved_problem_ids(self, user_id: str) -> Set[str]:
        """Returns set of problem_ids that the user has successfully solved (accepted)."""
        cursor = self.collection.find(
            {"user_id": user_id, "execution_status": "accepted"},
            {"problem_id": 1},
        )
        solved_ids: Set[str] = set()
        async for doc in cursor:
            pid = doc.get("problem_id")
            if pid:
                solved_ids.add(str(pid))
        return solved_ids

    async def update(self, submission_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        update_data = dict(data)
        update_data["updated_at"] = datetime.now(timezone.utc)
        try:
            oid = ObjectId(submission_id)
            filter_query = {"_id": oid}
        except Exception:
            filter_query = {"id": submission_id}

        res = await self.collection.find_one_and_update(
            filter_query,
            {"$set": update_data},
            return_document=True,
        )
        return self._format_doc(res)
