from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class ResumeRead(BaseModel):
    id: str
    user_id: str
    original_filename: str
    file_type: str
    file_size_bytes: int
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ResumeDeleteResponse(BaseModel):
    message: str
    resume_id: str

