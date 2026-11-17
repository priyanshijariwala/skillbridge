from datetime import datetime, timezone
import re
from typing import Any, Dict, List, Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ReturnDocument


class ChatConversationRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.collection = db["chat_conversations"]

    def _to_str_id(self, doc: Dict[str, Any]) -> Dict[str, Any]:
        doc = dict(doc)
        doc["id"] = str(doc.pop("_id"))
        return doc

    async def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        doc = {
            **data,
            "status": data.get("status", "active"),
            "created_at": now,
            "updated_at": now,
            "last_message_at": now,
        }
        result = await self.collection.insert_one(doc)
        doc["_id"] = result.inserted_id
        return self._to_str_id(doc)

    async def find_by_id_and_user(
        self, conversation_id: str, user_id: str
    ) -> Optional[Dict[str, Any]]:
        try:
            obj_id = ObjectId(conversation_id)
        except Exception:
            return None
        doc = await self.collection.find_one({
            "_id": obj_id,
            "user_id": user_id,
            "status": {"$ne": "deleted"},
        })
        return self._to_str_id(doc) if doc else None

    async def update(
        self, conversation_id: str, user_id: str, updates: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        try:
            obj_id = ObjectId(conversation_id)
        except Exception:
            return None
        now = datetime.now(timezone.utc)
        payload = {**updates, "updated_at": now}
        doc = await self.collection.find_one_and_update(
            {"_id": obj_id, "user_id": user_id, "status": {"$ne": "deleted"}},
            {"$set": payload},
            return_document=ReturnDocument.AFTER,
        )
        return self._to_str_id(doc) if doc else None

    async def update_last_message_at(
        self, conversation_id: str, user_id: str, timestamp: datetime, new_title: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        try:
            obj_id = ObjectId(conversation_id)
        except Exception:
            return None
        now = datetime.now(timezone.utc)
        payload: Dict[str, Any] = {
            "last_message_at": timestamp,
            "updated_at": now,
        }
        if new_title:
            payload["title"] = new_title

        doc = await self.collection.find_one_and_update(
            {"_id": obj_id, "user_id": user_id},
            {"$set": payload},
            return_document=ReturnDocument.AFTER,
        )
        return self._to_str_id(doc) if doc else None

    async def list_by_user(
        self,
        user_id: str,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> List[Dict[str, Any]]:
        query: Dict[str, Any] = {
            "user_id": user_id,
            "status": {"$ne": "deleted"},
        }
        if search and search.strip():
            query["title"] = {"$regex": re.escape(search.strip()), "$options": "i"}

        cursor = self.collection.find(query).sort("last_message_at", -1).skip(skip).limit(limit)
        docs = await cursor.to_list(length=limit)
        return [self._to_str_id(d) for d in docs]

    async def count_by_user(
        self,
        user_id: str,
        search: Optional[str] = None,
    ) -> int:
        query: Dict[str, Any] = {
            "user_id": user_id,
            "status": {"$ne": "deleted"},
        }
        if search and search.strip():
            query["title"] = {"$regex": re.escape(search.strip()), "$options": "i"}

        return await self.collection.count_documents(query)

    async def delete(self, conversation_id: str, user_id: str) -> bool:
        try:
            obj_id = ObjectId(conversation_id)
        except Exception:
            return False

        now = datetime.now(timezone.utc)
        res = await self.collection.update_one(
            {"_id": obj_id, "user_id": user_id},
            {"$set": {"status": "deleted", "updated_at": now}},
        )
        return res.modified_count > 0

