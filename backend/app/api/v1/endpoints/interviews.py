import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db.mongodb import get_database
from app.dependencies.auth import get_current_user
from app.schemas.interview import (
    InterviewAnswerRequest,
    InterviewAnswerResponse,
    InterviewCreateRequest,
    InterviewFeedbackResponse,
    InterviewListResponse,
    InterviewMessageDTO,
    InterviewResponse,
)
from app.schemas.user import UserRead
from app.services.interview.interview_session_service import InterviewSessionService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/interviews", tags=["AI Mock Interviews"])


@router.post(
    "",
    response_model=InterviewResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create mock interview session and generate opening question",
)
async def create_interview(
    payload: InterviewCreateRequest,
    current_user: UserRead = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> InterviewResponse:
    service = InterviewSessionService(db)
    return await service.create_interview(user_id=current_user.id, request=payload)


@router.get(
    "",
    response_model=InterviewListResponse,
    status_code=status.HTTP_200_OK,
    summary="List past and active interview sessions for authenticated user",
)
async def list_interviews(
    status_filter: Optional[str] = Query(None, alias="status"),
    interview_type: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: UserRead = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> InterviewListResponse:
    service = InterviewSessionService(db)
    return await service.list_interviews(
        user_id=current_user.id,
        status=status_filter,
        interview_type=interview_type,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/{interview_id}",
    response_model=InterviewResponse,
    status_code=status.HTTP_200_OK,
    summary="Get interview session state and active question",
)
async def get_interview(
    interview_id: str,
    current_user: UserRead = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> InterviewResponse:
    service = InterviewSessionService(db)
    return await service.get_interview(interview_id=interview_id, user_id=current_user.id)


@router.get(
    "/{interview_id}/messages",
    response_model=List[InterviewMessageDTO],
    status_code=status.HTTP_200_OK,
    summary="Get complete interview conversation transcript",
)
async def get_interview_messages(
    interview_id: str,
    current_user: UserRead = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> List[InterviewMessageDTO]:
    service = InterviewSessionService(db)
    return await service.get_messages(interview_id=interview_id, user_id=current_user.id)


@router.post(
    "/{interview_id}/answers",
    response_model=InterviewAnswerResponse,
    status_code=status.HTTP_200_OK,
    summary="Submit candidate answer and get adaptive follow-up or next question",
)
async def submit_answer(
    interview_id: str,
    payload: InterviewAnswerRequest,
    current_user: UserRead = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> InterviewAnswerResponse:
    service = InterviewSessionService(db)
    return await service.submit_answer(
        interview_id=interview_id,
        user_id=current_user.id,
        request=payload,
    )


@router.post(
    "/{interview_id}/complete",
    response_model=InterviewFeedbackResponse,
    status_code=status.HTTP_200_OK,
    summary="Finalize interview session and generate evaluation feedback report",
)
async def complete_interview(
    interview_id: str,
    current_user: UserRead = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> InterviewFeedbackResponse:
    service = InterviewSessionService(db)
    return await service.complete_interview(interview_id=interview_id, user_id=current_user.id)


@router.get(
    "/{interview_id}/feedback",
    response_model=InterviewFeedbackResponse,
    status_code=status.HTTP_200_OK,
    summary="Get completed interview evaluation feedback report",
)
async def get_feedback(
    interview_id: str,
    current_user: UserRead = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> InterviewFeedbackResponse:
    service = InterviewSessionService(db)
    return await service.get_feedback(interview_id=interview_id, user_id=current_user.id)


@router.patch(
    "/{interview_id}/abandon",
    response_model=InterviewResponse,
    status_code=status.HTTP_200_OK,
    summary="Abandon in-progress interview session",
)
async def abandon_interview(
    interview_id: str,
    current_user: UserRead = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> InterviewResponse:
    service = InterviewSessionService(db)
    return await service.abandon_interview(interview_id=interview_id, user_id=current_user.id)

