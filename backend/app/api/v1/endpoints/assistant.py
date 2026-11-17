import logging
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import StreamingResponse
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db.mongodb import get_database
from app.dependencies.auth import get_current_user
from app.schemas.assistant import (
    ChatMessageCreateRequest,
    ChatMessageListResponse,
    ChatMessageResponse,
    ContextSummaryResponse,
    ConversationCreateRequest,
    ConversationListResponse,
    ConversationResponse,
    ConversationUpdateRequest,
)
from app.schemas.user import UserRead
from app.services.assistant.assistant_service import AssistantService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/assistant", tags=["AI Career Assistant"])


@router.post(
    "/conversations",
    response_model=ConversationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new career assistant conversation",
)
async def create_conversation(
    payload: Optional[ConversationCreateRequest] = None,
    current_user: UserRead = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> ConversationResponse:
    service = AssistantService(db)
    title = payload.title if payload else None
    return await service.create_conversation(user_id=current_user.id, title=title)


@router.get(
    "/conversations",
    response_model=ConversationListResponse,
    status_code=status.HTTP_200_OK,
    summary="List authenticated user's conversations",
)
async def list_conversations(
    search: Optional[str] = Query(None, description="Search conversation titles"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: UserRead = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> ConversationListResponse:
    service = AssistantService(db)
    return await service.list_conversations(
        user_id=current_user.id,
        search=search,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/context-summary",
    response_model=ContextSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Get user's available context indicators for personalization",
)
async def get_context_summary(
    current_user: UserRead = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> ContextSummaryResponse:
    service = AssistantService(db)
    return await service.get_context_summary(user_id=current_user.id)


@router.get(
    "/conversations/{conversation_id}",
    response_model=ConversationResponse,
    status_code=status.HTTP_200_OK,
    summary="Get conversation metadata by ID",
)
async def get_conversation(
    conversation_id: str,
    current_user: UserRead = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> ConversationResponse:
    service = AssistantService(db)
    return await service.get_conversation(conversation_id=conversation_id, user_id=current_user.id)


@router.patch(
    "/conversations/{conversation_id}",
    response_model=ConversationResponse,
    status_code=status.HTTP_200_OK,
    summary="Rename an active conversation",
)
async def rename_conversation(
    conversation_id: str,
    payload: ConversationUpdateRequest,
    current_user: UserRead = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> ConversationResponse:
    service = AssistantService(db)
    return await service.rename_conversation(
        conversation_id=conversation_id,
        user_id=current_user.id,
        new_title=payload.title,
    )


@router.delete(
    "/conversations/{conversation_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete conversation and associated messages",
)
async def delete_conversation(
    conversation_id: str,
    current_user: UserRead = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> dict:
    service = AssistantService(db)
    await service.delete_conversation(conversation_id=conversation_id, user_id=current_user.id)
    return {"message": "Conversation deleted successfully"}


@router.get(
    "/conversations/{conversation_id}/messages",
    response_model=ChatMessageListResponse,
    status_code=status.HTTP_200_OK,
    summary="List paginated messages in conversation",
)
async def list_messages(
    conversation_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    current_user: UserRead = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> ChatMessageListResponse:
    service = AssistantService(db)
    return await service.list_messages(
        conversation_id=conversation_id,
        user_id=current_user.id,
        skip=skip,
        limit=limit,
    )


@router.post(
    "/conversations/{conversation_id}/messages",
    response_model=ChatMessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Send a message and receive personalized AI career response",
)
async def send_message(
    conversation_id: str,
    payload: ChatMessageCreateRequest,
    current_user: UserRead = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> ChatMessageResponse:
    service = AssistantService(db)
    return await service.send_message(
        conversation_id=conversation_id,
        user_id=current_user.id,
        message_text=payload.message,
    )


@router.post(
    "/conversations/{conversation_id}/stream",
    summary="Stream personalized AI response chunks via Server-Sent Events (SSE)",
)
async def stream_message(
    conversation_id: str,
    payload: ChatMessageCreateRequest,
    current_user: UserRead = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> StreamingResponse:
    service = AssistantService(db)
    generator = service.stream_message(
        conversation_id=conversation_id,
        user_id=current_user.id,
        message_text=payload.message,
    )

    return StreamingResponse(
        generator,
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )

