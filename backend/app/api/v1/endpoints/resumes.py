import logging
import urllib.parse
from typing import List

from fastapi import APIRouter, Depends, File, UploadFile, status
from fastapi.responses import Response
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db.mongodb import get_database
from app.dependencies.auth import get_current_user
from app.repositories.resume_analysis_repository import ResumeAnalysisRepository
from app.repositories.resume_repository import ResumeRepository
from app.schemas.resume import ResumeDeleteResponse, ResumeRead
from app.schemas.resume_analysis import ResumeAnalysisRead
from app.schemas.user import UserRead
from app.services.resume.resume_analysis_service import ResumeAnalysisService
from app.services.resume_service import ResumeService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/resumes", tags=["Resumes"])


def _get_resume_service(
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> ResumeService:
    return ResumeService(resume_repo=ResumeRepository(db))


def _get_resume_analysis_service(
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> ResumeAnalysisService:
    return ResumeAnalysisService(
        analysis_repo=ResumeAnalysisRepository(db),
        resume_repo=ResumeRepository(db),
    )


@router.post(
    "",
    response_model=ResumeRead,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a resume",
)
async def upload_resume(
    file: UploadFile = File(..., description="PDF or DOCX resume file (max 5 MB)"),
    current_user: UserRead = Depends(get_current_user),
    service: ResumeService = Depends(_get_resume_service),
) -> ResumeRead:
    """
    Upload a resume file (PDF or DOCX, max 5 MB).
    Returns resume metadata. File is stored securely server-side.
    """
    content = await file.read()
    return await service.upload_resume(
        user_id=current_user.id,
        content=content,
        original_filename=file.filename or "resume",
        content_type=file.content_type or "application/octet-stream",
    )


@router.get(
    "",
    response_model=List[ResumeRead],
    summary="List uploaded resumes",
)
async def list_resumes(
    current_user: UserRead = Depends(get_current_user),
    service: ResumeService = Depends(_get_resume_service),
) -> List[ResumeRead]:
    """Return all resumes uploaded by the authenticated user (newest first)."""
    return await service.list_resumes(current_user.id)


@router.get(
    "/{resume_id}",
    response_model=ResumeRead,
    summary="Get resume metadata",
)
async def get_resume(
    resume_id: str,
    current_user: UserRead = Depends(get_current_user),
    service: ResumeService = Depends(_get_resume_service),
) -> ResumeRead:
    """Return metadata for a specific resume owned by the authenticated user."""
    return await service.get_resume(resume_id, current_user.id)


@router.get(
    "/{resume_id}/download",
    summary="Download resume file",
)
async def download_resume(
    resume_id: str,
    current_user: UserRead = Depends(get_current_user),
    service: ResumeService = Depends(_get_resume_service),
) -> Response:
    """
    Stream the original resume file back to the client.
    Sets Content-Disposition: attachment to trigger a browser download.
    """
    content, original_filename, mime_type = await service.download_resume(
        resume_id, current_user.id
    )

    # RFC 5987 — encode filename for Content-Disposition header
    safe_filename = urllib.parse.quote(original_filename)
    content_disposition = (
        f"attachment; filename=\"{original_filename}\"; "
        f"filename*=UTF-8''{safe_filename}"
    )

    return Response(
        content=content,
        media_type=mime_type,
        headers={
            "Content-Disposition": content_disposition,
            "Content-Length": str(len(content)),
        },
    )


@router.delete(
    "/{resume_id}",
    response_model=ResumeDeleteResponse,
    summary="Delete a resume",
)
async def delete_resume(
    resume_id: str,
    current_user: UserRead = Depends(get_current_user),
    service: ResumeService = Depends(_get_resume_service),
) -> ResumeDeleteResponse:
    """Delete a resume and its stored file. Returns confirmation."""
    await service.delete_resume(resume_id, current_user.id)
    return ResumeDeleteResponse(
        message="Resume deleted successfully.",
        resume_id=resume_id,
    )


@router.post(
    "/{resume_id}/analysis",
    response_model=ResumeAnalysisRead,
    status_code=status.HTTP_201_CREATED,
    summary="Start resume analysis",
)
async def analyze_resume(
    resume_id: str,
    current_user: UserRead = Depends(get_current_user),
    service: ResumeAnalysisService = Depends(_get_resume_analysis_service),
) -> ResumeAnalysisRead:
    """
    Extract text from uploaded resume, invoke AI analysis,
    validate structured output, and persist to MongoDB.
    """
    return await service.analyze_resume(resume_id, current_user.id)


@router.get(
    "/{resume_id}/analysis",
    response_model=ResumeAnalysisRead,
    summary="Get latest resume analysis",
)
async def get_latest_analysis(
    resume_id: str,
    current_user: UserRead = Depends(get_current_user),
    service: ResumeAnalysisService = Depends(_get_resume_analysis_service),
) -> ResumeAnalysisRead:
    """
    Return the latest structured analysis for a given resume owned by the current user.
    """
    return await service.get_latest_analysis(resume_id, current_user.id)


