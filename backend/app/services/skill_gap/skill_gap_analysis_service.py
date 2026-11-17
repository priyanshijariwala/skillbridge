import logging
from typing import Any, Dict, List, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.errors import AppException
from app.integrations.ai.base import BaseAIProvider
from app.repositories.job_role_repository import JobRoleRepository
from app.repositories.profile_repository import ProfileRepository
from app.repositories.resume_analysis_repository import ResumeAnalysisRepository
from app.repositories.resume_repository import ResumeRepository
from app.repositories.skill_gap_repository import SkillGapRepository
from app.services.skill_gap.recommendation_service import RecommendationService
from app.services.skill_gap.skill_matching_service import SkillMatchingService

logger = logging.getLogger(__name__)


class SkillGapAnalysisService:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.db = db
        self.job_role_repo = JobRoleRepository(db)
        self.resume_repo = ResumeRepository(db)
        self.resume_analysis_repo = ResumeAnalysisRepository(db)
        self.skill_gap_repo = SkillGapRepository(db)
        self.profile_repo = ProfileRepository(db)

    async def analyze_gap(
        self,
        user_id: str,
        target_role_id: str,
        resume_id: Optional[str] = None,
        ai_provider: Optional[BaseAIProvider] = None,
    ) -> Dict[str, Any]:
        """
        Orchestrate complete skill gap analysis:
        1. Resolve and validate target job role.
        2. Resolve candidate resume and latest completed resume analysis.
        3. Extract candidate skills.
        4. Match candidate skills against role requirements and compute match %.
        5. Generate AI recommendations for missing & partial skills.
        6. Persist skill gap analysis in MongoDB.
        7. Update user profile target_role if applicable.
        """
        # 1. Resolve target job role
        role = await self.job_role_repo.find_by_id_or_slug(target_role_id)
        if not role:
            raise AppException(
                status_code=404,
                code="ROLE_NOT_FOUND",
                message=f"Target job role '{target_role_id}' was not found.",
            )

        # 2. Resolve resume
        if resume_id:
            resume = await self.resume_repo.find_by_id_and_user(resume_id, user_id)
            if not resume:
                raise AppException(
                    status_code=404,
                    code="RESUME_NOT_FOUND",
                    message="The specified resume was not found or is not accessible.",
                )
        else:
            resumes = await self.resume_repo.list_by_user(user_id)
            if not resumes:
                raise AppException(
                    status_code=400,
                    code="NO_RESUME_UPLOADED",
                    message="No resume found. Please upload a resume before running skill gap analysis.",
                )
            resume = resumes[0]
            resume_id = resume["id"]

        # 3. Resolve latest completed resume analysis
        resume_analysis = await self.resume_analysis_repo.find_latest_by_resume_and_user(
            resume_id=resume_id, user_id=user_id
        )
        if not resume_analysis:
            # Fall back to latest analysis of any resume owned by user
            resume_analysis = await self.resume_analysis_repo.find_latest_by_user(user_id)

        if not resume_analysis or resume_analysis.get("status") != "completed":
            raise AppException(
                status_code=400,
                code="RESUME_NOT_ANALYZED",
                message="The resume has not been analyzed yet. Please run resume analysis first.",
            )

        # 4. Extract candidate skills and perform matching
        candidate_skills = SkillMatchingService.extract_candidate_skills(resume_analysis)
        comparison = SkillMatchingService.match_role(
            candidate_skills_map=candidate_skills,
            required_skills=role.get("required_skills", []),
            optional_skills=role.get("optional_skills", []),
        )

        # 5. Generate AI recommendations
        rec_output = await RecommendationService.generate_recommendations(
            role_title=role["title"],
            role_description=role.get("description", ""),
            matched_skills=comparison.matched_skills,
            partially_matched_skills=comparison.partially_matched_skills,
            missing_skills=comparison.missing_skills,
            ai_provider=ai_provider,
        )

        # 6. Mark older analyses for this user as stale
        await self.skill_gap_repo.mark_stale_for_user(user_id)

        # 7. Persist analysis
        analysis_data = {
            "user_id": user_id,
            "resume_id": str(resume["id"]),
            "resume_analysis_id": str(resume_analysis["id"]),
            "target_role_id": str(role["id"]),
            "target_role_title": role["title"],
            "match_percentage": comparison.match_percentage,
            "summary": rec_output.get("summary"),
            "counts": comparison.counts,
            "matched_skills": comparison.matched_skills,
            "partially_matched_skills": comparison.partially_matched_skills,
            "missing_skills": comparison.missing_skills,
            "optional_skills": comparison.optional_skills,
            "recommendations": rec_output.get("recommendations", []),
            "is_stale": False,
            "ai_metadata": rec_output.get("ai_metadata", {}),
        }

        created_doc = await self.skill_gap_repo.create(analysis_data)

        # 8. Sync target role to profile
        try:
            await self.profile_repo.upsert_profile(
                user_id=user_id,
                data={
                    "target_role_id": str(role["id"]),
                    "target_role_title": role["title"],
                },
            )
        except Exception as e:
            logger.warning("Failed to sync target_role to profile: %s", e)

        return created_doc

    async def get_latest_analysis(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Return the user's latest skill gap analysis, dynamically evaluating
        whether it has become stale due to newer resume uploads or analyses.
        """
        doc = await self.skill_gap_repo.find_latest_by_user(user_id)
        if not doc:
            return None

        # Check if newer resume analysis exists
        latest_resume_analysis = await self.resume_analysis_repo.find_latest_by_user(user_id)
        if latest_resume_analysis and str(latest_resume_analysis.get("id")) != str(doc.get("resume_analysis_id")):
            doc["is_stale"] = True

        return doc

    async def get_analysis_by_id(
        self, analysis_id: str, user_id: str
    ) -> Optional[Dict[str, Any]]:
        """Return specific analysis ensuring user ownership."""
        return await self.skill_gap_repo.find_by_id_and_user(analysis_id, user_id)

    async def list_analyses(
        self, user_id: str, limit: int = 50
    ) -> List[Dict[str, Any]]:
        """List user's analyses."""
        return await self.skill_gap_repo.list_by_user(user_id, limit)

