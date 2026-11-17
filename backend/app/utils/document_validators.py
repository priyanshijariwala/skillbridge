from pathlib import Path
from fastapi import status

from app.core.config import settings
from app.core.errors import AppException

PDF_MAGIC = b"%PDF-"
DOCX_MAGIC = b"PK\x03\x04"

ALLOWED_EXTENSIONS = {".pdf", ".docx"}
ALLOWED_MIMES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


def validate_document_bytes(
    content: bytes,
    original_filename: str,
    declared_content_type: str = "application/octet-stream",
) -> str:
    """
    Validate raw document bytes:
    1. Check non-empty
    2. Check max file size
    3. Check extension whitelist
    4. Check MIME whitelist (if declared)
    5. Check magic bytes
    Returns verified document format ('pdf' or 'docx').
    Raises AppException with 400 on failure.
    """
    if not content or len(content) == 0:
        raise AppException(
            status_code=status.HTTP_400_BAD_REQUEST,
            code="INVALID_FILE",
            message="Uploaded file is empty.",
        )

    if len(content) > settings.max_resume_size_bytes:
        raise AppException(
            status_code=status.HTTP_400_BAD_REQUEST,
            code="FILE_TOO_LARGE",
            message=f"File exceeds maximum allowed size of {settings.MAX_RESUME_SIZE_MB} MB.",
        )

    ext = Path(original_filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise AppException(
            status_code=status.HTTP_400_BAD_REQUEST,
            code="UNSUPPORTED_FILE_TYPE",
            message=f"File type '{ext or 'unknown'}' is not supported. Please upload a PDF or DOCX file.",
        )

    if declared_content_type:
        mime = declared_content_type.split(";")[0].strip().lower()
        if mime != "application/octet-stream" and mime not in ALLOWED_MIMES:
            raise AppException(
                status_code=status.HTTP_400_BAD_REQUEST,
                code="UNSUPPORTED_MIME_TYPE",
                message=f"MIME type '{mime}' is not accepted. Please upload a PDF or DOCX file.",
            )

    if ext == ".pdf":
        if not content[:5].startswith(PDF_MAGIC):
            raise AppException(
                status_code=status.HTTP_400_BAD_REQUEST,
                code="INVALID_FILE_SIGNATURE",
                message="File content does not match a valid PDF.",
            )
        return "pdf"

    if ext == ".docx":
        if not content[:4].startswith(DOCX_MAGIC):
            raise AppException(
                status_code=status.HTTP_400_BAD_REQUEST,
                code="INVALID_FILE_SIGNATURE",
                message="File content does not match a valid DOCX file.",
            )
        return "docx"

    raise AppException(
        status_code=status.HTTP_400_BAD_REQUEST,
        code="UNSUPPORTED_FILE_TYPE",
        message="Unsupported file format.",
    )

