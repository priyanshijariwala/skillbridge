from typing import Any, Dict

from app.repositories.profile_repository import ProfileRepository
from app.repositories.user_repository import UserRepository
from app.schemas.profile import ProfileRead, ProfileUpdate
from app.schemas.user import UserRead


class ProfileService:
    def __init__(
        self,
        profile_repo: ProfileRepository,
        user_repo: UserRepository,
    ) -> None:
        self.profile_repo = profile_repo
        self.user_repo = user_repo

    def _build_profile_read(
        self, profile_doc: Dict[str, Any], user_doc: Dict[str, Any]
    ) -> ProfileRead:
        """Merge profile document with user fields into ProfileRead."""
        doc_id = profile_doc.get("_id")
        return ProfileRead(
            id=str(doc_id) if doc_id else None,
            user_id=profile_doc.get("user_id", str(user_doc.get("_id", ""))),
            full_name=user_doc.get("display_name", ""),
            email=user_doc.get("email", ""),
            headline=profile_doc.get("headline"),
            bio=profile_doc.get("bio"),
            target_role_title=profile_doc.get("target_role_title"),
            target_seniority=profile_doc.get("target_seniority"),
            years_of_experience=profile_doc.get("years_of_experience"),
            skills=profile_doc.get("skills", []),
            education=profile_doc.get("education", []),
            linkedin_url=profile_doc.get("linkedin_url"),
            github_url=profile_doc.get("github_url"),
            portfolio_url=profile_doc.get("portfolio_url"),
            created_at=profile_doc.get("created_at"),
            updated_at=profile_doc.get("updated_at"),
        )

    async def get_or_create_profile(self, current_user: UserRead) -> ProfileRead:
        """
        Retrieve the profile for the authenticated user. If none exists, create a
        minimal default profile document and return it.
        """
        user_doc = await self.user_repo.find_by_id(current_user.id)
        if not user_doc:
            # Fallback: construct a minimal user dict from the token claims
            user_doc = {
                "_id": current_user.id,
                "display_name": current_user.name,
                "email": current_user.email,
            }

        profile_doc = await self.profile_repo.find_by_user_id(current_user.id)

        if profile_doc is None:
            # First access — create an empty profile record
            profile_doc = await self.profile_repo.upsert_profile(
                user_id=current_user.id, data={"skills": []}
            )

        return self._build_profile_read(profile_doc, user_doc)

    async def update_profile(
        self, current_user: UserRead, update_data: ProfileUpdate
    ) -> ProfileRead:
        """
        Update the user's career profile. If full_name is supplied, also
        update the display_name in the users collection.
        """
        user_doc = await self.user_repo.find_by_id(current_user.id)
        if not user_doc:
            user_doc = {
                "_id": current_user.id,
                "display_name": current_user.name,
                "email": current_user.email,
            }

        # Build update dict — only include explicitly supplied fields
        payload = update_data.model_dump(exclude_unset=True, exclude_none=False)

        # Separate name update from profile fields
        new_name = payload.pop("full_name", None)
        if new_name is not None:
            updated_user = await self.user_repo.update_display_name(
                current_user.id, new_name
            )
            if updated_user:
                user_doc = updated_user

        # Convert education list of dicts (from Pydantic) into plain dicts for Mongo
        if "education" in payload and payload["education"] is not None:
            payload["education"] = [
                e if isinstance(e, dict) else e.model_dump()
                for e in payload["education"]
            ]

        profile_doc = await self.profile_repo.upsert_profile(
            user_id=current_user.id, data=payload
        )

        return self._build_profile_read(profile_doc, user_doc)

