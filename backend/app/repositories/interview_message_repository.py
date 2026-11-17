from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase


class InterviewMessageRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.collection = db["interview_messages"]

    def _to_str_id(self, doc: Dict[str, Any]) -> Dict[str, Any]:
        doc = dict(doc)
        doc["id"] = str(doc.pop("_id"))
        return doc

    async def get_next_sequence(self, interview_id: str) -> int:
        """Return the next 1-indexed sequence number for an interview."""
        doc = await self.collection.find_one(
            {"interview_id": interview_id},
            sort=[("sequence", -1)],
        )
        return (doc["sequence"] + 1) if doc else 1

    async def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Insert a message document with auto-sequencing."""
        now = datetime.now(timezone.utc)
        if "sequence" not in data:
            data["sequence"] = await self.get_next_sequence(data["interview_id"])
        doc = {**data, "created_at": now}
        result = await self.collection.insert_one(doc)
        doc["_id"] = result.inserted_id
        return self._to_str_id(doc)

    async def list_by_interview(self, interview_id: str) -> List[Dict[str, Any]]:
        """List all messages in chronological sequence."""
        cursor = self.collection.find({"interview_id": interview_id}).sort("sequence", 1)
        docs = await cursor.to_list(length=200)
        return [self._to_str_id(d) for d in docs]

    async def find_by_id(self, message_id: str) -> Optional[Dict[str, Any]]:
        """Find a message by ObjectId string."""
        try:
            obj_id = ObjectId(message_id)
        except Exception:
            return None
        doc = await self.collection.find_one({"_id": obj_id})
        return self._to_str_id(doc) if doc else None

    async def find_by_id_and_interview(
        self, message_id: str, interview_id: str
    ) -> Optional[Dict[str, Any]]:
        """Find message ensuring it belongs to interview_id."""
        try:
            obj_id = ObjectId(message_id)
        except Exception:
            return None
        doc = await self.collection.find_one({"_id": obj_id, "interview_id": interview_id})
        return self._to_str_id(doc) if doc else None

    async def find_answer_for_question(
        self, interview_id: str, question_id: str
    ) -> Optional[Dict[str, Any]]:
        """Check if an answer already exists for a question (duplicate protection)."""
        doc = await self.collection.find_one({
            "interview_id": interview_id,
            "role": "user",
            "parent_message_id": question_id,
        })
        return self._to_str_id(doc) if doc else None

    async def update_evaluation(
        self, message_id: str, evaluation: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Update evaluation on an answer message."""
        try:
            obj_id = ObjectId(message_id)
        except Exception:
            return None
        doc = await self.collection.find_one_and_update(
            {"_id": obj_id},
            {"$set": {"evaluation": evaluation}},
            return_document=True,
        )
        return self._to_str_id(doc) if doc else None

