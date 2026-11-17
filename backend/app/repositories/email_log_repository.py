from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase


class EmailLogRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.collection = db["email_logs"]

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
        data.setdefault("attempt_count", 0)
        data.setdefault("status", "pending")
        data.setdefault("last_error", None)
        data.setdefault("sent_at", None)
        res = await self.collection.insert_one(data)
        data["id"] = str(res.inserted_id)
        data.pop("_id", None)
        return data

    async def update_status(
        self,
        log_id: str,
        status: str,
        attempt_count: int,
        provider_message_id: Optional[str] = None,
        last_error: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        now = datetime.now(timezone.utc)
        update_fields: Dict[str, Any] = {
            "status": status,
            "attempt_count": attempt_count,
            "last_error": last_error,
            "updated_at": now,
        }
        if provider_message_id:
            update_fields["provider_message_id"] = provider_message_id
        if status == "sent":
            update_fields["sent_at"] = now

        try:
            oid = ObjectId(log_id)
            filter_query = {"_id": oid}
        except Exception:
            filter_query = {"id": log_id}

        res = await self.collection.find_one_and_update(
            filter_query,
            {"$set": update_fields},
            return_document=True,
        )
        return self._format_doc(res)

    async def list_by_user(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        cursor = self.collection.find({"user_id": user_id}).sort("created_at", -1).limit(limit)
        docs = await cursor.to_list(length=limit)
        return [self._format_doc(d) for d in docs if d]

