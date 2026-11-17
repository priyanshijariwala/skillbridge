from abc import ABC, abstractmethod
from typing import Tuple


class BaseStorage(ABC):
    """Abstract storage interface for file operations."""

    @abstractmethod
    async def save_file(
        self,
        content: bytes,
        filename_hint: str,
        subdirectory: str = "",
    ) -> str:
        """
        Persist file bytes and return the opaque storage key.
        The storage key is used for subsequent get/delete operations.
        """
        ...

    @abstractmethod
    async def get_file(self, storage_key: str) -> bytes:
        """Retrieve raw file bytes by storage key. Raises FileNotFoundError if missing."""
        ...

    @abstractmethod
    async def delete_file(self, storage_key: str) -> None:
        """Delete a stored file. Does not raise if file is already absent."""
        ...

    @abstractmethod
    async def file_exists(self, storage_key: str) -> bool:
        """Return True if the file identified by storage_key exists."""
        ...

