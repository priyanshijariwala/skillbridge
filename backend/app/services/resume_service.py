import hashlib
import logging
from pathlib import Path
from typing import List, Tuple

from fastapi import status

from app.core.config import settings
from app.core.errors import AppException
from app.repositories.resume_repository import ResumeRepository
from app.schemas.resume import ResumeRead
from app.storage.storage_factory import get_storage

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# File validation constants
# ---------------------------------------------------------------------------
ALLOWED_EXTENSIONS = {".pdf", ".docx"}
ALLOWED_MIMES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}

PDF_MAGIC = b"%PDF-"
DOCX_MAGIC = b"PK\x03\x04"  # ZIP/OOXML magic bytes

MIME_EXTENSION_MAP = {
    "application/pdf": ".pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
}


def _validate_resume_file(
    content: bytes,
    original_filename: str,
    declared_content_type: str,
) -> None:
    """
    Validate a resume file against:
    1. Non-empty
    2. File size limit
    3. Extension whitelist
    4. MIME type whitelist
    5. Magic-byte file signature
    Raises AppException with 400 on any failure.
    """
    if not content:
        raise AppException(
            status_code=status.HTTP_400_BAD_REQUEST,
            code="INVALID_FILE",
            message="Uploaded file is empty.",
        )

    if len(content) > settings.max_resume_size_bytes:
        raise AppException(
            status_code=status.HTTP_400_BAD_REQUEST,
            code="FILE_TOO_LARGE",
            message=(
                f"File exceeds the maximum allowed size of {settings.MAX_RESUME_SIZE_MB} MB."
            ),
        )

    ext = Path(original_filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise AppException(
            status_code=status.HTTP_400_BAD_REQUEST,
            code="UNSUPPORTED_FILE_TYPE",
            message=f"File type '{ext or 'unknown'}' is not supported. Upload a PDF or DOCX file.",
        )

    # Normalise content-type (strip charset etc.)
    mime = declared_content_type.split(";")[0].strip().lower()
    if mime not in ALLOWED_MIMES:
        raise AppException(
            status_code=status.HTTP_400_BAD_REQUEST,
            code="UNSUPPORTED_MIME_TYPE",
            message=f"MIME type '{mime}' is not accepted. Upload a PDF or DOCX file.",
        )

    # Magic-byte check
    if ext == ".pdf":
        if not content[:5].startswith(PDF_MAGIC):
            raise AppException(
                status_code=status.HTTP_400_BAD_REQUEST,
                code="INVALID_FILE_SIGNATURE",
                message="File content does not match a valid PDF. Upload an authentic PDF file.",
            )
    elif ext == ".docx":
        if not content[:4].startswith(DOCX_MAGIC):
            raise AppException(
                status_code=status.HTTP_400_BAD_REQUEST,
                code="INVALID_FILE_SIGNATURE",
                message="File content does not match a valid DOCX. Upload an authentic DOCX file.",
            )


def _build_resume_read(doc: dict) -> ResumeRead:
    return ResumeRead(
        id=doc["id"],
        user_id=doc["user_id"],
        original_filename=doc["original_filename"],
        file_type=doc["file_type"],
        file_size_bytes=doc["file_size_bytes"],
        status=doc.get("status", "uploaded"),
        created_at=doc.get("created_at"),
        updated_at=doc.get("updated_at"),
    )


class ResumeService:
    def __init__(self, resume_repo: ResumeRepository) -> None:
        self.resume_repo = resume_repo

    async def upload_resume(
        self,
        user_id: str,
        content: bytes,
        original_filename: str,
        content_type: str,
    ) -> ResumeRead:
        """Validate, store, and persist metadata for an uploaded resume."""
        _validate_resume_file(content, original_filename, content_type)

        storage = get_storage()

        # Compute content hash for deduplication / integrity
        content_hash = hashlib.sha256(content).hexdigest()

        storage_key = await storage.save_file(
            content=content,
            filename_hint=original_filename,
            subdirectory="resumes",
        )

        ext = Path(original_filename).suffix.lower()
        file_type = ext.lstrip(".")  # "pdf" or "docx"

        doc = await self.resume_repo.create(
            {
                "user_id": user_id,
                "original_filename": original_filename,
                "storage_key": storage_key,
                "file_type": file_type,
                "file_size_bytes": len(content),
                "content_hash": content_hash,
                "status": "uploaded",
            }
        )

        return _build_resume_read(doc)

    async def list_resumes(self, user_id: str) -> List[ResumeRead]:
        """Return all resumes owned by user_id."""
        docs = await self.resume_repo.list_by_user(user_id)
        return [_build_resume_read(d) for d in docs]

    async def get_resume(self, resume_id: str, user_id: str) -> ResumeRead:
        """Return resume metadata. Raises 404 if not found or not owned by user."""
        doc = await self.resume_repo.find_by_id_and_user(resume_id, user_id)
        if not doc:
            raise AppException(
                status_code=status.HTTP_404_NOT_FOUND,
                code="NOT_FOUND",
                message="Resume not found.",
            )
        return _build_resume_read(doc)

    async def download_resume(
        self, resume_id: str, user_id: str
    ) -> Tuple[bytes, str, str]:
        """
        Return (file_bytes, original_filename, mime_type) for the resume.
        Raises 404 if not found/not owned. Raises 503 if storage fails.
        """
        doc = await self.resume_repo.find_by_id_and_user(resume_id, user_id)
        if not doc:
            raise AppException(
                status_code=status.HTTP_404_NOT_FOUND,
                code="NOT_FOUND",
                message="Resume not found.",
            )

        storage = get_storage()
        storage_key = doc["storage_key"]

        try:
            content = await storage.get_file(storage_key)
        except FileNotFoundError:
            logger.error(
                "Resume file missing from storage: resume_id=%s storage_key=%s",
                resume_id,
                storage_key,
            )
            raise AppException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                code="FILE_NOT_AVAILABLE",
                message="Resume file is temporarily unavailable. Please try again later.",
            )

        file_type = doc.get("file_type", "pdf")
        mime_map = {
            "pdf": "application/pdf",
            "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        }
        mime_type = mime_map.get(file_type, "application/octet-stream")

        return content, doc["original_filename"], mime_type

    async def delete_resume(self, resume_id: str, user_id: str) -> None:
        """
        Delete resume record and its stored file.
        Raises 404 if not found or not owned by user.
        Storage deletion errors are logged but do not block DB record removal.
        """
        doc = await self.resume_repo.find_by_id_and_user(resume_id, user_id)
        if not doc:
            raise AppException(
                status_code=status.HTTP_404_NOT_FOUND,
                code="NOT_FOUND",
                message="Resume not found.",
            )

        storage_key = doc.get("storage_key", "")

        # Delete storage file first; log warning if it fails but continue
        storage = get_storage()
        try:
            await storage.delete_file(storage_key)
        except Exception as e:
            logger.warning(
                "Could not delete storage file for resume %s (key=%s): %s",
                resume_id,
                storage_key,
                e,
            )

        # Delete DB record
        await self.resume_repo.delete(resume_id, user_id)

