from datetime import datetime
from typing import Optional
from bson import ObjectId
from pydantic import BaseModel, Field


class UserInDB(BaseModel):
    id: Optional[ObjectId] = Field(default=None, alias="_id")
    email: str
    password_hash: str
    display_name: str
    role: str = "user"
    is_active: bool = True
    email_verified: bool = False
    created_at: datetime
    updated_at: datetime
    last_login_at: Optional[datetime] = None

    model_config = {
        "arbitrary_types_allowed": True,
        "populate_by_name": True,
    }


class RefreshSessionInDB(BaseModel):
    id: Optional[ObjectId] = Field(default=None, alias="_id")
    session_id: str
    user_id: str
    token_hash: str
    is_revoked: bool = False
    expires_at: datetime
    created_at: datetime

    model_config = {
        "arbitrary_types_allowed": True,
        "populate_by_name": True,
    }

