from fastapi import APIRouter, Depends

from app.dependencies.auth import get_current_user
from app.repositories.user_repository import UserRepository
from app.db.mongodb import get_database
from app.schemas.user import UserRead, UserUpdate
from motor.motor_asyncio import AsyncIOMotorDatabase


router = APIRouter(prefix="/users", tags=["Users"])


async def get_user_repo(
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> UserRepository:
    return UserRepository(db)


@router.get("/me", response_model=UserRead, summary="Get current user account")
async def get_me(current_user: UserRead = Depends(get_current_user)) -> UserRead:
    """Return the authenticated user's account information."""
    return current_user


@router.patch("/me", response_model=UserRead, summary="Update current user account")
async def update_me(
    body: UserUpdate,
    current_user: UserRead = Depends(get_current_user),
    user_repo: UserRepository = Depends(get_user_repo),
) -> UserRead:
    """Update mutable account fields (currently: display name)."""
    if body.name is not None:
        updated = await user_repo.update_display_name(current_user.id, body.name)
        if updated:
            return UserRead(
                id=str(updated["_id"]),
                name=updated.get("display_name", ""),
                email=updated.get("email", ""),
                role=updated.get("role", "user"),
                is_active=updated.get("is_active", True),
                created_at=updated.get("created_at"),
            )
    return current_user

