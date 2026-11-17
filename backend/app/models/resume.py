from datetime import datetime
from typing import Optional
from dataclasses import dataclass


@dataclass
class ResumeInDB:
    user_id: str
    original_filename: str
    storage_key: str
    file_type: str
    file_size_bytes: int
    content_hash: str
    status: str = "uploaded"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

