from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase


class ChatMessageRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.collection = db["chat_messages"]

    def _to_str_id(self, doc: Dict[str, Any]) -> Dict[str, Any]:
        doc = dict(doc)
        doc["id"] = str(doc.pop("_id"))
        return doc

    async def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        doc = {
            **data,
            "created_at": data.get("created_at") or now,
        }
        result = await self.collection.insert_one(doc)
        doc["_id"] = result.inserted_id
        return self._to_str_id(doc)

    async def list_by_conversation(
        self,
        conversation_id: str,
        skip: int = 0,
        limit: int = 100,
        ascending: bool = True,
    ) -> List[Dict[str, Any]]:
        sort_order = 1 if ascending else -1
        cursor = (
            self.collection.find({"conversation_id": conversation_id})
            .sort("created_at", sort_order)
            .skip(skip)
            .limit(limit)
        )
        docs = await cursor.to_list(length=limit)
        return [self._to_str_id(d) for d in docs]

    async def count_by_conversation(self, conversation_id: str) -> int:
        return await self.collection.count_documents({"conversation_id": conversation_id})

    async def get_recent_history(
        self,
        conversation_id: str,
        limit: int = 10,
    ) -> List[Dict[str, str]]:
        """Retrieve recent messages formatted for LLM conversation history."""
        cursor = (
            self.collection.find({"conversation_id": conversation_id})
            .sort("created_at", -1)
            .limit(limit)
        )
        docs = await cursor.to_list(length=limit)
        # Reverse to chronological order
        docs.reverse()
        return [
            {"role": d["role"], "content": d["content"]}
            for d in docs
            if d.get("role") in ("user", "assistant") and d.get("content")
        ]

    async def delete_by_conversation(self, conversation_id: str) -> int:
        res = await self.collection.delete_many({"conversation_id": conversation_id})
        return res.deleted_count

