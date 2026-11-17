import logging
import os
import uuid
from pathlib import Path

from app.storage.base import BaseStorage

logger = logging.getLogger(__name__)


class LocalStorage(BaseStorage):
    """
    Local filesystem storage for development.
    Files are stored under a configured base directory with UUID-based names
    to prevent collisions and path traversal attacks.
    Storage keys are relative paths within the base directory (e.g., "resumes/abc-123.pdf").
    """

    def __init__(self, base_path: str) -> None:
        self._base = Path(base_path).resolve()
        self._base.mkdir(parents=True, exist_ok=True)
        logger.info("LocalStorage initialized at %s", self._base)

    def _resolve_safe(self, storage_key: str) -> Path:
        """Resolve storage_key to an absolute path, rejecting traversal attempts."""
        # Normalise the key to strip leading slashes / dots
        clean_key = storage_key.lstrip("/").lstrip("\\")
        resolved = (self._base / clean_key).resolve()
        if not str(resolved).startswith(str(self._base)):
            raise ValueError(f"Path traversal attempt detected: {storage_key!r}")
        return resolved

    async def save_file(
        self,
        content: bytes,
        filename_hint: str,
        subdirectory: str = "",
    ) -> str:
        """
        Save bytes to disk using a UUID-based filename.
        Returns the storage key (relative path from base).
        """
        # Determine file extension from the hint
        ext = Path(filename_hint).suffix.lower()
        unique_name = f"{uuid.uuid4().hex}{ext}"

        if subdirectory:
            subdir = self._base / subdirectory
            subdir.mkdir(parents=True, exist_ok=True)
            file_path = subdir / unique_name
            storage_key = f"{subdirectory}/{unique_name}"
        else:
            file_path = self._base / unique_name
            storage_key = unique_name

        # Atomic write: write to temp then rename
        tmp_path = file_path.with_suffix(file_path.suffix + ".tmp")
        try:
            tmp_path.write_bytes(content)
            tmp_path.replace(file_path)
        except Exception:
            tmp_path.unlink(missing_ok=True)
            raise

        logger.debug("Saved file: %s (%d bytes)", storage_key, len(content))
        return storage_key

    async def get_file(self, storage_key: str) -> bytes:
        """Read and return file bytes. Raises FileNotFoundError if absent."""
        path = self._resolve_safe(storage_key)
        if not path.exists():
            raise FileNotFoundError(f"File not found in storage: {storage_key!r}")
        return path.read_bytes()

    async def delete_file(self, storage_key: str) -> None:
        """Delete the file. Silently ignores missing files."""
        try:
            path = self._resolve_safe(storage_key)
            path.unlink(missing_ok=True)
            logger.debug("Deleted storage file: %s", storage_key)
        except (ValueError, OSError) as e:
            logger.warning("Could not delete storage file %r: %s", storage_key, e)

    async def file_exists(self, storage_key: str) -> bool:
        try:
            return self._resolve_safe(storage_key).exists()
        except ValueError:
            return False

