import logging
from typing import Any, Dict
from fastapi import status
from pydantic import ValidationError

from app.core.errors import AppException
from app.integrations.ai.base import BaseAIProvider
from app.integrations.ai.provider_factory import get_ai_provider
from app.repositories.resume_analysis_repository import ResumeAnalysisRepository
from app.repositories.resume_repository import ResumeRepository
from app.schemas.resume_analysis import (
    ResumeAnalysisRead,
    ResumeAnalysisResult,
)
from app.services.resume.extraction_service import DocumentExtractionService
from app.services.resume.prompt_service import PromptService
from app.storage.storage_factory import get_storage
from app.utils.document_validators import validate_document_bytes

logger = logging.getLogger(__name__)


class ResumeAnalysisService:
    def __init__(
        self,
        analysis_repo: ResumeAnalysisRepository,
        resume_repo: ResumeRepository,
        extraction_service: DocumentExtractionService | None = None,
        ai_provider: BaseAIProvider | None = None,
    ) -> None:
        self.analysis_repo = analysis_repo
        self.resume_repo = resume_repo
        self.extraction_service = extraction_service or DocumentExtractionService()
        self._ai_provider = ai_provider

    def _get_provider(self) -> BaseAIProvider:
        return self._ai_provider or get_ai_provider()

    async def analyze_resume(
        self, resume_id: str, user_id: str
    ) -> ResumeAnalysisRead:
        """
        Execute end-to-end resume analysis:
        1. Verify resume existence and ownership
        2. Retrieve stored document from private storage
        3. Validate document integrity
        4. Extract and clean text
        5. Invoke AI provider
        6. Validate AI structured output
        7. Save to MongoDB
        8. Return formatted analysis
        """
        # 1. Verify resume existence and ownership
        resume = await self.resume_repo.find_by_id_and_user(resume_id, user_id)
        if not resume:
            raise AppException(
                status_code=status.HTTP_404_NOT_FOUND,
                code="NOT_FOUND",
                message="Resume not found.",
            )

        storage_key = resume.get("storage_key")
        if not storage_key:
            raise AppException(
                status_code=status.HTTP_400_BAD_REQUEST,
                code="INVALID_RESUME",
                message="Resume record has no associated file.",
            )

        # 2. Retrieve file from private storage
        storage = get_storage()
        try:
            content = await storage.get_file(storage_key)
        except FileNotFoundError:
            logger.error("Resume file not found in storage: %s", storage_key)
            raise AppException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                code="FILE_NOT_AVAILABLE",
                message="Resume file is temporarily unavailable.",
            )

        # 3. Validate document bytes
        original_filename = resume.get("original_filename", "resume")
        file_type = resume.get("file_type", "pdf")
        validate_document_bytes(content, original_filename)

        # 4. Extract and clean text
        logger.info(
            "Extracting text from resume %s (type=%s, size=%d bytes)",
            resume_id,
            file_type,
            len(content),
        )
        cleaned_text = self.extraction_service.extract_text(content, file_type)
        logger.info(
            "Extracted %d characters of cleaned text from resume %s",
            len(cleaned_text),
            resume_id,
        )

        # 5. Build prompts and call AI provider
        system_prompt = PromptService.get_system_prompt()
        user_prompt = PromptService.get_user_prompt(cleaned_text)

        provider = self._get_provider()
        logger.info(
            "Calling AI provider '%s' (model=%s) for resume %s",
            provider.provider_name,
            provider.model_name,
            resume_id,
        )
        raw_ai_json = await provider.generate_json(system_prompt, user_prompt)

        # 6. Validate AI response structure with Pydantic
        try:
            analysis_result = ResumeAnalysisResult.model_validate(raw_ai_json)
        except ValidationError as e:
            logger.error("AI response schema validation failed for resume %s: %s", resume_id, e)
            raise AppException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                code="INVALID_AI_RESPONSE",
                message="The AI provider returned an unexpected analysis structure. Please try again.",
            )

        # 7. Persist analysis to database
        analysis_doc: Dict[str, Any] = {
            "user_id": user_id,
            "resume_id": resume_id,
            "status": "completed",
            "overall_score": analysis_result.overall_score,
            "score_breakdown": analysis_result.score_breakdown.model_dump(),
            "summary": analysis_result.summary,
            "extracted_data": analysis_result.extracted_data.model_dump(),
            "strengths": [s.model_dump() for s in analysis_result.strengths],
            "improvements": [i.model_dump() for i in analysis_result.improvements],
            "recommendations": analysis_result.recommendations,
            "missing_information": analysis_result.missing_information,
            "ats_observations": analysis_result.ats_observations,
            "detected_skills": [d.model_dump() for d in analysis_result.detected_skills],
            "recommended_roles": analysis_result.recommended_roles,
            "ai_metadata": {
                "provider": provider.provider_name,
                "model": provider.model_name,
                "prompt_version": "resume-audit-v1",
            },
        }

        saved_doc = await self.analysis_repo.create(analysis_doc)

        # Update resume status to 'completed'
        try:
            from bson import ObjectId
            await self.resume_repo.collection.update_one(
                {"_id": ObjectId(resume_id)},
                {"$set": {"status": "completed"}},
            )
        except Exception as e:
            logger.warning("Could not update resume status to completed: %s", e)

        return ResumeAnalysisRead.model_validate(saved_doc)

    async def get_latest_analysis(
        self, resume_id: str, user_id: str
    ) -> ResumeAnalysisRead:
        """Retrieve the most recent analysis for a resume owned by user_id."""
        resume = await self.resume_repo.find_by_id_and_user(resume_id, user_id)
        if not resume:
            raise AppException(
                status_code=status.HTTP_404_NOT_FOUND,
                code="NOT_FOUND",
                message="Resume not found.",
            )

        doc = await self.analysis_repo.find_latest_by_resume_and_user(
            resume_id, user_id
        )
        if not doc:
            raise AppException(
                status_code=status.HTTP_404_NOT_FOUND,
                code="ANALYSIS_NOT_FOUND",
                message="No analysis found for this resume.",
            )

        return ResumeAnalysisRead.model_validate(doc)
