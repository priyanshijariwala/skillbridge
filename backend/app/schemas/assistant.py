from datetime import datetime
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field

MessageRole = Literal["user", "assistant", "system"]


class ConversationCreateRequest(BaseModel):
    title: Optional[str] = Field(None, max_length=100, description="Optional conversation title")


class ConversationUpdateRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=100, description="Updated conversation title")


class ConversationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    last_message_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ConversationListResponse(BaseModel):
    items: List[ConversationResponse]
    total: int
    page: int
    page_size: int


class ChatMessageCreateRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000, description="User question or prompt")


class ChatMessageResponse(BaseModel):
    id: str
    conversation_id: str
    role: MessageRole
    content: str
    message_type: str = "text"
    context_metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ChatMessageListResponse(BaseModel):
    items: List[ChatMessageResponse]
    total: int
    conversation_id: str


class ContextSummaryResponse(BaseModel):
    profile_available: bool = False
    resume_available: bool = False
    skill_gap_available: bool = False
    roadmap_available: bool = False
    interview_available: bool = False
    target_role: Optional[str] = None
    user_name: Optional[str] = None

