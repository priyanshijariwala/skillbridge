from datetime import datetime, timezone
from typing import Any, Dict, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase


class RefreshSessionRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db["refresh_sessions"]

    async def create_session(
        self,
        session_id: str,
        user_id: str,
        token_hash: str,
        expires_at: datetime,
    ) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        doc = {
            "session_id": session_id,
            "user_id": user_id,
            "token_hash": token_hash,
            "is_revoked": False,
            "expires_at": expires_at,
            "created_at": now,
            "updated_at": now,
        }
        await self.collection.insert_one(doc)
        return doc

    async def find_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        return await self.collection.find_one({"session_id": session_id})

    async def update_session_token(
        self,
        session_id: str,
        new_token_hash: str,
        new_expires_at: datetime,
    ) -> None:
        now = datetime.now(timezone.utc)
        await self.collection.update_one(
            {"session_id": session_id},
            {
                "$set": {
                    "token_hash": new_token_hash,
                    "expires_at": new_expires_at,
                    "updated_at": now,
                }
            },
        )

    async def revoke_session(self, session_id: str) -> None:
        now = datetime.now(timezone.utc)
        await self.collection.update_one(
            {"session_id": session_id},
            {"$set": {"is_revoked": True, "updated_at": now}},
        )

    async def revoke_all_for_user(self, user_id: str) -> None:
        now = datetime.now(timezone.utc)
        await self.collection.update_many(
            {"user_id": user_id},
            {"$set": {"is_revoked": True, "updated_at": now}},
        )

