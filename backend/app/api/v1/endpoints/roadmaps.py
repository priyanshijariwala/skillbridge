from typing import Optional
from fastapi import APIRouter, Depends, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.errors import AppException
from app.db.mongodb import get_database
from app.dependencies.auth import get_current_user
from app.schemas.roadmap import (
    RoadmapGenerateRequest,
    RoadmapListResponse,
    RoadmapProgressResponse,
    RoadmapRead,
    TaskUpdateDTO,
)
from app.schemas.user import UserRead
from app.services.roadmap.roadmap_generation_service import RoadmapGenerationService

router = APIRouter(prefix="/roadmaps", tags=["Learning Roadmaps"])


@router.post(
    "/generate",
    response_model=RoadmapRead,
    status_code=status.HTTP_201_CREATED,
)
@router.post(
    "",
    response_model=RoadmapRead,
    status_code=status.HTTP_201_CREATED,
)
async def generate_learning_roadmap(
    payload: Optional[RoadmapGenerateRequest] = None,
    current_user: UserRead = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> RoadmapRead:
    """
    Generate a personalized, milestone-driven learning roadmap based on
    the candidate's latest skill gap analysis and target job role.
    """
    service = RoadmapGenerationService(db)
    roadmap = await service.generate_roadmap(
        user_id=current_user.id,
        skill_gap_analysis_id=payload.skill_gap_analysis_id if payload else None,
        available_hours_per_week=payload.available_hours_per_week if payload else None,
    )
    res = RoadmapRead(**roadmap)
    try:
        from app.services.notifications.notification_service import NotificationService
        from app.schemas.notification import NotificationEvent, NotificationCategory, NotificationType
        notif_service = NotificationService(db)
        await notif_service.dispatch_event(
            NotificationEvent(
                user_id=current_user.id,
                title="Learning Roadmap Generated",
                message=f"Your personalized learning roadmap with {len(res.milestones)} milestones is ready.",
                category=NotificationCategory.ROADMAP.value,
                type=NotificationType.SUCCESS.value,
                action_url="/roadmap",
                email_template="roadmap_generated",
                email_subject="Your Personalized Learning Roadmap is Ready — SkillBridge AI",
                email_context={
                    "name": current_user.name,
                    "milestones_count": len(res.milestones),
                },
                recipient_email=current_user.email,
            )
        )
    except Exception:
        pass
    return res


@router.get(
    "/current",
    response_model=RoadmapRead,
)
async def get_current_roadmap(
    current_user: UserRead = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> RoadmapRead:
    """Retrieve the current active learning roadmap for the authenticated user."""
    service = RoadmapGenerationService(db)
    roadmap = await service.get_current_roadmap(user_id=current_user.id)
    if not roadmap:
        raise AppException(
            status_code=status.HTTP_404_NOT_FOUND,
            code="ROADMAP_NOT_FOUND",
            message="No active learning roadmap has been generated yet.",
        )
    return RoadmapRead(**roadmap)


@router.get(
    "/{roadmap_id}",
    response_model=RoadmapRead,
)
async def get_roadmap_by_id(
    roadmap_id: str,
    current_user: UserRead = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> RoadmapRead:
    """Retrieve a specific learning roadmap by ID scoped to current user."""
    service = RoadmapGenerationService(db)
    roadmap = await service.get_roadmap_by_id(
        roadmap_id=roadmap_id, user_id=current_user.id
    )
    if not roadmap:
        raise AppException(
            status_code=status.HTTP_404_NOT_FOUND,
            code="ROADMAP_NOT_FOUND",
            message="Learning roadmap was not found.",
        )
    return RoadmapRead(**roadmap)


@router.patch(
    "/{roadmap_id}/tasks/{task_id}",
    response_model=RoadmapRead,
)
async def update_task_progress(
    roadmap_id: str,
    task_id: str,
    payload: TaskUpdateDTO,
    current_user: UserRead = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> RoadmapRead:
    """
    Update the status of a specific task within a roadmap.
    Recalculates milestone statuses and overall completion percentage.
    """
    service = RoadmapGenerationService(db)
    updated_roadmap, _ = await service.update_task_progress(
        roadmap_id=roadmap_id,
        task_id=task_id,
        new_status=payload.status,
        user_id=current_user.id,
    )
    return RoadmapRead(**updated_roadmap)


@router.get(
    "/{roadmap_id}/progress",
    response_model=RoadmapProgressResponse,
)
async def get_roadmap_progress(
    roadmap_id: str,
    current_user: UserRead = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> RoadmapProgressResponse:
    """Return comprehensive progress metrics for a roadmap."""
    service = RoadmapGenerationService(db)
    progress = await service.get_roadmap_progress(
        roadmap_id=roadmap_id, user_id=current_user.id
    )
    return RoadmapProgressResponse(**progress)


@router.patch(
    "/{roadmap_id}/archive",
    response_model=RoadmapRead,
)
async def archive_roadmap(
    roadmap_id: str,
    current_user: UserRead = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> RoadmapRead:
    """Archive an active learning roadmap."""
    service = RoadmapGenerationService(db)
    archived = await service.archive_roadmap(
        roadmap_id=roadmap_id, user_id=current_user.id
    )
    return RoadmapRead(**archived)


@router.get(
    "",
    response_model=RoadmapListResponse,
)
async def list_roadmaps(
    status: Optional[str] = None,
    current_user: UserRead = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> RoadmapListResponse:
    """List all roadmaps created by the current user."""
    service = RoadmapGenerationService(db)
    items = await service.list_user_roadmaps(
        user_id=current_user.id, status=status
    )
    return RoadmapListResponse(
        items=[RoadmapRead(**item) for item in items],
        total=len(items),
    )

