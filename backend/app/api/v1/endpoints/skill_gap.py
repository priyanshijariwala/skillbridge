from typing import Optional
from fastapi import APIRouter, Depends, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.errors import AppException
from app.db.mongodb import get_database
from app.dependencies.auth import get_current_user
from app.schemas.skill_gap import (
    SkillGapAnalysisListResponse,
    SkillGapAnalysisRead,
    SkillGapAnalyzeRequest,
)
from app.schemas.user import UserRead
from app.services.skill_gap.skill_gap_analysis_service import SkillGapAnalysisService

router = APIRouter(tags=["Skill Gap Analysis"])


@router.post(
    "/skill-gap/analyze",
    response_model=SkillGapAnalysisRead,
    status_code=status.HTTP_200_OK,
)
@router.post(
    "/skill-gap-analyses",
    response_model=SkillGapAnalysisRead,
    status_code=status.HTTP_200_OK,
)
async def analyze_skill_gap(
    payload: SkillGapAnalyzeRequest,
    current_user: UserRead = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> SkillGapAnalysisRead:
    """
    Trigger or re-generate an AI-powered skill gap analysis comparing candidate's
    latest analyzed resume skills against the requirements for a target job role.
    """
    service = SkillGapAnalysisService(db)
    analysis = await service.analyze_gap(
        user_id=current_user.id,
        target_role_id=payload.target_role_id,
        resume_id=payload.resume_id,
    )
    res = SkillGapAnalysisRead(**analysis)
    try:
        from app.services.notifications.notification_service import NotificationService
        from app.schemas.notification import NotificationEvent, NotificationCategory, NotificationType
        notif_service = NotificationService(db)
        await notif_service.dispatch_event(
            NotificationEvent(
                user_id=current_user.id,
                title="Skill Gap Analysis Completed",
                message=f"Your skill-gap report for target role is ready. Found {len(res.missing_skills)} focus areas.",
                category=NotificationCategory.SKILL_GAP.value,
                type=NotificationType.INFO.value,
                action_url="/skill-gap",
                email_template="skill_gap_analysis_completed",
                email_subject="Skill Gap Analysis Complete — Discover What to Learn Next",
                email_context={
                    "name": current_user.name,
                    "target_role": "Target Role",
                    "gaps_count": len(res.missing_skills),
                },
                recipient_email=current_user.email,
            )
        )
    except Exception:
        pass
    return res


@router.get(
    "/skill-gap/latest",
    response_model=SkillGapAnalysisRead,
)
async def get_latest_skill_gap(
    current_user: UserRead = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> SkillGapAnalysisRead:
    """Retrieve the latest skill gap analysis for the authenticated user."""
    service = SkillGapAnalysisService(db)
    analysis = await service.get_latest_analysis(user_id=current_user.id)
    if not analysis:
        raise AppException(
            status_code=status.HTTP_404_NOT_FOUND,
            code="ANALYSIS_NOT_FOUND",
            message="No skill gap analysis has been generated yet.",
        )
    return SkillGapAnalysisRead(**analysis)


@router.get(
    "/skill-gap/{analysis_id}",
    response_model=SkillGapAnalysisRead,
)
@router.get(
    "/skill-gap-analyses/{analysis_id}",
    response_model=SkillGapAnalysisRead,
)
async def get_skill_gap_by_id(
    analysis_id: str,
    current_user: UserRead = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> SkillGapAnalysisRead:
    """Retrieve a specific skill gap analysis by ID scoped to authenticated user."""
    service = SkillGapAnalysisService(db)
    analysis = await service.get_analysis_by_id(
        analysis_id=analysis_id, user_id=current_user.id
    )
    if not analysis:
        raise AppException(
            status_code=status.HTTP_404_NOT_FOUND,
            code="ANALYSIS_NOT_FOUND",
            message="Skill gap analysis was not found.",
        )
    return SkillGapAnalysisRead(**analysis)


@router.get(
    "/skill-gap-analyses",
    response_model=SkillGapAnalysisListResponse,
)
async def list_skill_gap_analyses(
    current_user: UserRead = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> SkillGapAnalysisListResponse:
    """List all skill gap analyses created by current user."""
    service = SkillGapAnalysisService(db)
    items = await service.list_analyses(user_id=current_user.id)
    return SkillGapAnalysisListResponse(
        items=[SkillGapAnalysisRead(**item) for item in items],
        total=len(items),
    )

