from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class NotificationType(str, Enum):
    INFO = "info"
    SUCCESS = "success"
    WARNING = "warning"
    ERROR = "error"


class NotificationCategory(str, Enum):
    ACCOUNT = "account"
    RESUME = "resume"
    SKILL_GAP = "skill_gap"
    ROADMAP = "roadmap"
    INTERVIEW = "interview"
    CODING = "coding"
    SECURITY = "security"


VALID_CATEGORIES = {c.value for c in NotificationCategory}
# Security and account critical notifications cannot be opted out of
NON_DISABLEABLE_CATEGORIES = {NotificationCategory.SECURITY.value}


class NotificationRead(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    type: str = NotificationType.INFO.value
    category: str = NotificationCategory.ACCOUNT.value
    is_read: bool = False
    action_url: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    read_at: Optional[datetime] = None


class NotificationListResponse(BaseModel):
    items: List[NotificationRead]
    total: int
    page: int
    page_size: int
    unread_count: int


class UnreadCountResponse(BaseModel):
    unread_count: int


class NotificationPreferenceRead(BaseModel):
    user_id: str
    email_enabled: bool = True
    category_preferences: Dict[str, bool] = Field(
        default_factory=lambda: {
            NotificationCategory.ACCOUNT.value: True,
            NotificationCategory.RESUME.value: True,
            NotificationCategory.SKILL_GAP.value: True,
            NotificationCategory.ROADMAP.value: True,
            NotificationCategory.INTERVIEW.value: True,
            NotificationCategory.CODING.value: True,
            NotificationCategory.SECURITY.value: True,
        }
    )
    updated_at: Optional[datetime] = None


class NotificationPreferenceUpdate(BaseModel):
    email_enabled: Optional[bool] = None
    category_preferences: Optional[Dict[str, bool]] = None


class NotificationEvent(BaseModel):
    user_id: str
    title: str
    message: str
    category: str = NotificationCategory.ACCOUNT.value
    type: str = NotificationType.INFO.value
    action_url: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    email_template: Optional[str] = None
    email_subject: Optional[str] = None
    email_context: Dict[str, Any] = Field(default_factory=dict)
    recipient_email: Optional[str] = None

