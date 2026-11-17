from functools import lru_cache

from app.core.config import settings
from app.storage.base import BaseStorage
from app.storage.local_storage import LocalStorage


@lru_cache(maxsize=1)
def get_storage() -> BaseStorage:
    """
    Return the configured storage backend.
    Currently returns LocalStorage for development.
    Extend this factory to return S3Storage or CloudinaryStorage in production.
    """
    return LocalStorage(base_path=settings.RESUME_STORAGE_PATH)

