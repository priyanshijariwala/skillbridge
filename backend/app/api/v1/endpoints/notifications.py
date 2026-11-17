import logging
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.db.mongodb import get_database
from app.dependencies.auth import get_current_user
from app.schemas.notification import (
    NotificationListResponse,
    NotificationPreferenceRead,
    NotificationPreferenceUpdate,
    NotificationRead,
    UnreadCountResponse,
)
from app.schemas.user import UserRead
from app.services.notifications.notification_service import NotificationService

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Notifications & Email Integration"])


@router.get(
    "/notifications",
    response_model=NotificationListResponse,
    status_code=status.HTTP_200_OK,
    summary="List authenticated user's notifications",
)
async def list_notifications(
    is_read: Optional[bool] = Query(None, description="Filter by read/unread state"),
    category: Optional[str] = Query(None, description="Filter by category (resume, skill_gap, roadmap, interview, coding, security, account)"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: UserRead = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> NotificationListResponse:
    service = NotificationService(db)
    return await service.list_notifications(
        user_id=current_user.id,
        is_read=is_read,
        category=category,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/notifications/unread-count",
    response_model=UnreadCountResponse,
    status_code=status.HTTP_200_OK,
    summary="Get unread notification count for authenticated user",
)
async def get_unread_count(
    current_user: UserRead = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> UnreadCountResponse:
    service = NotificationService(db)
    return await service.get_unread_count(user_id=current_user.id)


@router.patch(
    "/notifications/{notification_id}/read",
    response_model=NotificationRead,
    status_code=status.HTTP_200_OK,
    summary="Mark specific notification as read",
)
async def mark_notification_as_read(
    notification_id: str,
    current_user: UserRead = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> NotificationRead:
    service = NotificationService(db)
    return await service.mark_as_read(notification_id=notification_id, user_id=current_user.id)


@router.patch(
    "/notifications/read-all",
    response_model=UnreadCountResponse,
    status_code=status.HTTP_200_OK,
    summary="Mark all notifications as read for authenticated user",
)
async def mark_all_as_read(
    current_user: UserRead = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> UnreadCountResponse:
    service = NotificationService(db)
    await service.mark_all_as_read(user_id=current_user.id)
    return UnreadCountResponse(unread_count=0)


@router.delete(
    "/notifications/{notification_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a notification belonging to authenticated user",
)
async def delete_notification(
    notification_id: str,
    current_user: UserRead = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> None:
    service = NotificationService(db)
    await service.delete_notification(notification_id=notification_id, user_id=current_user.id)


@router.get(
    "/notification-preferences",
    response_model=NotificationPreferenceRead,
    status_code=status.HTTP_200_OK,
    summary="Get authenticated user's notification preferences",
)
async def get_notification_preferences(
    current_user: UserRead = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> NotificationPreferenceRead:
    service = NotificationService(db)
    return await service.get_preferences(user_id=current_user.id)


@router.put(
    "/notification-preferences",
    response_model=NotificationPreferenceRead,
    status_code=status.HTTP_200_OK,
    summary="Update authenticated user's notification preferences",
)
async def update_notification_preferences(
    payload: NotificationPreferenceUpdate,
    current_user: UserRead = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> NotificationPreferenceRead:
    service = NotificationService(db)
    return await service.update_preferences(user_id=current_user.id, payload=payload)

