import logging
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.db.mongodb import get_database
from app.dependencies.auth import get_current_user
from app.schemas.coding import (
    AICodeReviewResponse,
    ProblemDetailResponse,
    ProblemListResponse,
    RunCodeRequest,
    RunCodeResponse,
    SubmissionListResponse,
    SubmissionResponse,
    SubmitCodeRequest,
)
from app.schemas.user import UserRead
from app.services.coding.coding_service import CodingService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/coding", tags=["Coding Assessment & Practice"])


@router.get(
    "/problems",
    response_model=ProblemListResponse,
    status_code=status.HTTP_200_OK,
    summary="List coding problems with filters and pagination",
)
async def list_problems(
    difficulty: Optional[str] = Query(None, description="Filter by difficulty: easy, medium, hard"),
    category: Optional[str] = Query(None, description="Filter by category"),
    topic: Optional[str] = Query(None, description="Filter by topic tag"),
    search: Optional[str] = Query(None, description="Search title, slug, or topics"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: UserRead = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> ProblemListResponse:
    service = CodingService(db)
    return await service.list_problems(
        user_id=current_user.id,
        difficulty=difficulty,
        category=category,
        topic=topic,
        search=search,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/problems/{problem_id}",
    response_model=ProblemDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Get problem details, starter code, and sample test cases",
)
async def get_problem(
    problem_id: str,
    current_user: UserRead = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> ProblemDetailResponse:
    service = CodingService(db)
    return await service.get_problem(problem_id=problem_id, user_id=current_user.id)


@router.post(
    "/submissions/run",
    response_model=RunCodeResponse,
    status_code=status.HTTP_200_OK,
    summary="Run code against sample test cases in isolated sandbox",
)
async def run_code(
    payload: RunCodeRequest,
    current_user: UserRead = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> RunCodeResponse:
    service = CodingService(db)
    return await service.run_code(user_id=current_user.id, payload=payload)


@router.post(
    "/submissions",
    response_model=SubmissionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit solution for full evaluation against sample and hidden test cases",
)
async def submit_solution(
    payload: SubmitCodeRequest,
    current_user: UserRead = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> SubmissionResponse:
    service = CodingService(db)
    sub = await service.submit_solution(user_id=current_user.id, payload=payload)
    try:
        from app.services.notifications.notification_service import NotificationService
        from app.schemas.notification import NotificationEvent, NotificationCategory, NotificationType
        notif_service = NotificationService(db)
        is_acc = sub.execution_status == "accepted"
        await notif_service.dispatch_event(
            NotificationEvent(
                user_id=current_user.id,
                title=f"Coding Submission: {sub.problem_title}",
                message=f"Evaluation result: {sub.execution_status.replace('_', ' ').upper()} ({sub.test_cases_passed}/{sub.total_test_cases} passed).",
                category=NotificationCategory.CODING.value,
                type=NotificationType.SUCCESS.value if is_acc else NotificationType.WARNING.value,
                action_url=f"/coding/problems/{sub.problem_slug}",
                email_template="coding_assessment_evaluated",
                email_subject="Coding Assessment Result — SkillBridge AI",
                email_context={
                    "name": current_user.name,
                    "problem_title": sub.problem_title,
                    "verdict": sub.execution_status,
                    "passed_count": sub.test_cases_passed,
                    "total_count": sub.total_test_cases,
                    "submission_id": sub.id,
                    "problem_slug": sub.problem_slug,
                },
                recipient_email=current_user.email,
            )
        )
    except Exception:
        pass
    return sub


@router.get(
    "/submissions/{submission_id}",
    response_model=SubmissionResponse,
    status_code=status.HTTP_200_OK,
    summary="Get user submission evaluation result",
)
async def get_submission(
    submission_id: str,
    current_user: UserRead = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> SubmissionResponse:
    service = CodingService(db)
    return await service.get_submission(submission_id=submission_id, user_id=current_user.id)


@router.get(
    "/submissions",
    response_model=SubmissionListResponse,
    status_code=status.HTTP_200_OK,
    summary="List authenticated user's submission history",
)
async def list_submissions(
    problem_id: Optional[str] = Query(None, description="Filter by problem ID"),
    status: Optional[str] = Query(None, description="Filter by status: accepted, wrong_answer, etc."),
    language: Optional[str] = Query(None, description="Filter by language"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: UserRead = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> SubmissionListResponse:
    service = CodingService(db)
    return await service.list_submissions(
        user_id=current_user.id,
        problem_id=problem_id,
        status=status,
        language=language,
        page=page,
        page_size=page_size,
    )


@router.post(
    "/submissions/{submission_id}/review",
    response_model=AICodeReviewResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate AI-powered code review and complexity analysis",
)
async def generate_ai_review(
    submission_id: str,
    current_user: UserRead = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> AICodeReviewResponse:
    service = CodingService(db)
    return await service.generate_ai_review(submission_id=submission_id, user_id=current_user.id)
