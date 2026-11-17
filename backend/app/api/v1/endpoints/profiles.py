from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db.mongodb import get_database
from app.dependencies.auth import get_current_user
from app.repositories.profile_repository import ProfileRepository
from app.repositories.user_repository import UserRepository
from app.schemas.profile import ProfileRead, ProfileUpdate
from app.schemas.user import UserRead
from app.services.profile_service import ProfileService


router = APIRouter(prefix="/profiles", tags=["Profiles"])


def _get_profile_service(
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> ProfileService:
    return ProfileService(
        profile_repo=ProfileRepository(db),
        user_repo=UserRepository(db),
    )


@router.get("/me", response_model=ProfileRead, summary="Get authenticated user's career profile")
async def get_my_profile(
    current_user: UserRead = Depends(get_current_user),
    service: ProfileService = Depends(_get_profile_service),
) -> ProfileRead:
    """
    Return the career profile for the authenticated user.
    A default empty profile is created on first access.
    """
    return await service.get_or_create_profile(current_user)


@router.put("/me", response_model=ProfileRead, summary="Create or update career profile")
async def upsert_my_profile(
    body: ProfileUpdate,
    current_user: UserRead = Depends(get_current_user),
    service: ProfileService = Depends(_get_profile_service),
) -> ProfileRead:
    """
    Upsert the career profile for the authenticated user.
    Supply only the fields you want to change. All fields are optional.
    """
    return await service.update_profile(current_user, body)

