import re
from typing import Any, Dict, List, Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase


class JobRoleRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.collection = db["job_roles"]

    def _to_str_id(self, doc: Dict[str, Any]) -> Dict[str, Any]:
        doc = dict(doc)
        doc["id"] = str(doc.pop("_id"))
        return doc

    async def list_roles(
        self,
        search: Optional[str] = None,
        category: Optional[str] = None,
        is_active: bool = True,
    ) -> List[Dict[str, Any]]:
        """List active job roles with optional text search and category filter."""
        query: Dict[str, Any] = {"is_active": is_active}

        if category:
            query["category"] = category

        if search:
            # Case-insensitive substring match on title, slug, or description
            pattern = re.compile(re.escape(search.strip()), re.IGNORECASE)
            query["$or"] = [
                {"title": {"$regex": pattern}},
                {"slug": {"$regex": pattern}},
                {"description": {"$regex": pattern}},
            ]

        cursor = self.collection.find(query).sort("title", 1)
        docs = await cursor.to_list(length=100)
        return [self._to_str_id(d) for d in docs]

    async def find_by_id(self, role_id: str) -> Optional[Dict[str, Any]]:
        """Find a job role by ObjectId string."""
        try:
            obj_id = ObjectId(role_id)
        except Exception:
            return None
        doc = await self.collection.find_one({"_id": obj_id})
        return self._to_str_id(doc) if doc else None

    async def find_by_slug(self, slug: str) -> Optional[Dict[str, Any]]:
        """Find a job role by unique slug string."""
        doc = await self.collection.find_one({"slug": slug})
        return self._to_str_id(doc) if doc else None

    async def find_by_id_or_slug(self, identifier: str) -> Optional[Dict[str, Any]]:
        """Find a job role by either ObjectId string or slug."""
        if ObjectId.is_valid(identifier):
            role = await self.find_by_id(identifier)
            if role:
                return role
        return await self.find_by_slug(identifier)

