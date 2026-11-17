from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase


class NotificationRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.collection = db["notifications"]

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
        data.setdefault("is_read", False)
        data.setdefault("read_at", None)
        res = await self.collection.insert_one(data)
        data["id"] = str(res.inserted_id)
        data.pop("_id", None)
        return data

    async def find_by_id_and_user(self, notification_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        try:
            oid = ObjectId(notification_id)
            doc = await self.collection.find_one({"_id": oid, "user_id": user_id})
        except Exception:
            doc = await self.collection.find_one({"id": notification_id, "user_id": user_id})
        return self._format_doc(doc)

    async def count_unread(self, user_id: str) -> int:
        return await self.collection.count_documents({"user_id": user_id, "is_read": False})

    async def list_by_user(
        self,
        user_id: str,
        is_read: Optional[bool] = None,
        category: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[Dict[str, Any]], int, int]:
        query: Dict[str, Any] = {"user_id": user_id}
        if is_read is not None:
            query["is_read"] = is_read
        if category:
            query["category"] = category.lower().strip()

        total = await self.collection.count_documents(query)
        unread_count = await self.count_unread(user_id)
        skip = (page - 1) * page_size

        cursor = (
            self.collection.find(query)
            .sort([("created_at", -1), ("_id", -1)])
            .skip(skip)
            .limit(page_size)
        )
        docs = await cursor.to_list(length=page_size)
        return [self._format_doc(d) for d in docs if d], total, unread_count

    async def mark_as_read(self, notification_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        now = datetime.now(timezone.utc)
        try:
            oid = ObjectId(notification_id)
            filter_query = {"_id": oid, "user_id": user_id}
        except Exception:
            filter_query = {"id": notification_id, "user_id": user_id}

        res = await self.collection.find_one_and_update(
            filter_query,
            {"$set": {"is_read": True, "read_at": now}},
            return_document=True,
        )
        return self._format_doc(res)

    async def mark_all_as_read(self, user_id: str) -> int:
        now = datetime.now(timezone.utc)
        res = await self.collection.update_many(
            {"user_id": user_id, "is_read": False},
            {"$set": {"is_read": True, "read_at": now}},
        )
        return res.modified_count

    async def delete_notification(self, notification_id: str, user_id: str) -> bool:
        try:
            oid = ObjectId(notification_id)
            filter_query = {"_id": oid, "user_id": user_id}
        except Exception:
            filter_query = {"id": notification_id, "user_id": user_id}

        res = await self.collection.delete_one(filter_query)
        return res.deleted_count > 0

