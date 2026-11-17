from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional


@dataclass
class ChatConversationInDB:
    user_id: str
    title: str = "New Career Conversation"
    status: str = "active"  # "active", "archived", "deleted"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    last_message_at: Optional[datetime] = None


@dataclass
class ChatMessageInDB:
    conversation_id: str
    user_id: str
    role: str  # "user" | "assistant"
    content: str
    message_type: str = "text"
    context_metadata: Dict[str, Any] = field(default_factory=dict)
    token_usage: Optional[Dict[str, int]] = None
    created_at: Optional[datetime] = None

