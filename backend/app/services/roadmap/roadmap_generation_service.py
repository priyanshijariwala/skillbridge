import logging
from typing import Any, Dict, List, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.errors import AppException
from app.integrations.ai.base import BaseAIProvider
from app.integrations.ai.provider_factory import get_ai_provider
from app.repositories.job_role_repository import JobRoleRepository
from app.repositories.roadmap_repository import RoadmapRepository
from app.repositories.skill_gap_repository import SkillGapRepository
from app.services.roadmap.roadmap_progress_service import RoadmapProgressService
from app.services.roadmap.roadmap_prompt_service import SYSTEM_PROMPT, RoadmapPromptService
from app.services.roadmap.roadmap_validation_service import RoadmapValidationService

logger = logging.getLogger(__name__)


class RoadmapGenerationService:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.db = db
        self.roadmap_repo = RoadmapRepository(db)
        self.skill_gap_repo = SkillGapRepository(db)
        self.job_role_repo = JobRoleRepository(db)

    @classmethod
    def _fallback_roadmap(
        cls,
        role_title: str,
        role_description: str,
        missing_skills: List[Dict[str, Any]],
        partially_matched_skills: List[Dict[str, Any]],
        available_hours_per_week: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Deterministic fallback curriculum when AI provider is unavailable."""
        milestones = []
        order = 1

        # Milestone 1: Missing core competencies
        if missing_skills:
            m1_skills = [s.get("name", "Skill") for s in missing_skills[:2]]
            m1_tasks = []
            for s_name in m1_skills:
                m1_tasks.extend([
                    {
                        "title": f"Master {s_name} Fundamentals and Architecture",
                        "description": f"Learn core concepts, best practices, and standard conventions for {s_name}.",
                        "task_type": "learn",
                        "related_skill": s_name,
                        "estimated_duration_hours": 6,
                        "priority": "high",
                        "resources": [f"Official {s_name} Getting Started Guide"],
                    },
                    {
                        "title": f"Build a Hands-on {s_name} Integration Project",
                        "description": f"Develop a practical code module demonstrating {s_name} in an end-to-end setup.",
                        "task_type": "project",
                        "related_skill": s_name,
                        "estimated_duration_hours": 8,
                        "priority": "high",
                        "resources": [f"Production {s_name} Architecture Tutorial"],
                    },
                ])
            milestones.append({
                "title": f"Phase 1: High-Impact Missing Competencies ({', '.join(m1_skills)})",
                "description": f"Target the critical missing skills required for {role_title} positions.",
                "order": order,
                "estimated_duration_days": 14,
                "priority": "high",
                "related_skills": m1_skills,
                "tasks": m1_tasks,
            })
            order += 1

        # Milestone 2: Secondary missing or partially matched skills
        remaining_missing = missing_skills[2:] if len(missing_skills) > 2 else []
        target_skills = remaining_missing or partially_matched_skills
        if target_skills:
            m2_skills = [s.get("name", "Skill") for s in target_skills[:2]]
            m2_tasks = []
            for s_name in m2_skills:
                m2_tasks.extend([
                    {
                        "title": f"Advanced {s_name} Patterns & Optimization",
                        "description": f"Deepen production knowledge, error handling, and performance tuning with {s_name}.",
                        "task_type": "practice",
                        "related_skill": s_name,
                        "estimated_duration_hours": 5,
                        "priority": "medium",
                        "resources": [f"Advanced {s_name} Best Practices Guide"],
                    },
                    {
                        "title": f"{s_name} Assessment & Code Review",
                        "description": f"Perform a self-directed code review and quiz on {s_name} common interview patterns.",
                        "task_type": "assessment",
                        "related_skill": s_name,
                        "estimated_duration_hours": 3,
                        "priority": "medium",
                        "resources": [f"{s_name} Technical Interview Question Bank"],
                    },
                ])
            milestones.append({
                "title": f"Phase 2: Intermediate Deepening & Partial Gap Bridging",
                "description": f"Elevate secondary and partially matched competencies ({', '.join(m2_skills)}) to senior standards.",
                "order": order,
                "estimated_duration_days": 14,
                "priority": "medium",
                "related_skills": m2_skills,
                "tasks": m2_tasks,
            })
            order += 1

        # Milestone 3: Capstone & Production Integration
        milestones.append({
            "title": f"Phase {order}: {role_title} Capstone Integration & Deployment",
            "description": f"Unify learned skills into a production-ready portfolio project matching {role_title} requirements.",
            "order": order,
            "estimated_duration_days": 14,
            "priority": "high",
            "related_skills": [role_title],
            "tasks": [
                {
                    "title": "Design Capstone Architecture & Specifications",
                    "description": "Draft high-level architecture diagram, database schema, and API contracts.",
                    "task_type": "learn",
                    "related_skill": role_title,
                    "estimated_duration_hours": 4,
                    "priority": "high",
                    "resources": ["System Architecture Design Templates"],
                },
                {
                    "title": "Implement End-to-End Capstone with Automated Tests",
                    "description": "Construct the integrated project with unit and integration test coverage.",
                    "task_type": "project",
                    "related_skill": role_title,
                    "estimated_duration_hours": 12,
                    "priority": "high",
                    "resources": ["CI/CD Pipeline and Testing Guidelines"],
                },
                {
                    "title": "Comprehensive Mock Technical Assessment",
                    "description": "Conduct a comprehensive review of all role competencies in preparation for interviews.",
                    "task_type": "assessment",
                    "related_skill": role_title,
                    "estimated_duration_hours": 4,
                    "priority": "medium",
                    "resources": [f"{role_title} Technical Interview Rubric"],
                },
            ],
        })

        return {
            "title": f"{role_title} Accelerated Preparation Curriculum",
            "description": (
                f"A structured, milestone-driven curriculum designed to bridge your identified competency gaps "
                f"and prepare you for {role_title} technical interviews."
            ),
            "estimated_duration_days": 42,
            "milestones": milestones,
        }

    async def generate_roadmap(
        self,
        user_id: str,
        skill_gap_analysis_id: Optional[str] = None,
        available_hours_per_week: Optional[int] = None,
        ai_provider: Optional[BaseAIProvider] = None,
    ) -> Dict[str, Any]:
        """
        Generates and saves a personalized learning roadmap based on the user's
        latest valid skill-gap analysis.
        """
        # 1. Retrieve skill gap analysis
        if skill_gap_analysis_id:
            gap_doc = await self.skill_gap_repo.find_by_id_and_user(
                analysis_id=skill_gap_analysis_id, user_id=user_id
            )
        else:
            gap_doc = await self.skill_gap_repo.find_latest_by_user(user_id)

        if not gap_doc:
            raise AppException(
                status_code=400,
                code="NO_SKILL_GAP_ANALYSIS",
                message="No skill gap analysis found. Please run a skill gap analysis before generating a roadmap.",
            )

        role_id = gap_doc.get("target_role_id", "")
        role_title = gap_doc.get("target_role_title", "Software Engineer")

        # 2. Retrieve job role description
        role_doc = await self.job_role_repo.find_by_id_or_slug(role_id)
        role_desc = role_doc.get("description", "") if role_doc else f"Prepare for {role_title} responsibilities."

        matched_skills = gap_doc.get("matched_skills", [])
        partially_matched_skills = gap_doc.get("partially_matched_skills", [])
        missing_skills = gap_doc.get("missing_skills", [])

        # 3. Call AI Provider
        provider = ai_provider or get_ai_provider()
        user_prompt = RoadmapPromptService.build_user_prompt(
            role_title=role_title,
            role_description=role_desc,
            matched_skills=matched_skills,
            partially_matched_skills=partially_matched_skills,
            missing_skills=missing_skills,
            available_hours_per_week=available_hours_per_week,
        )

        ai_metadata: Dict[str, Any] = {}
        try:
            raw_response = await provider.generate_json(
                system_prompt=SYSTEM_PROMPT,
                user_prompt=user_prompt,
            )
            ai_metadata = {
                "provider": getattr(provider, "provider_name", "ai"),
                "model": getattr(provider, "model_name", "unknown"),
                "prompt_version": "roadmap-v1",
            }
        except Exception as e:
            logger.warning("AI roadmap generation failed (%s); using deterministic fallback.", e)
            raw_response = self._fallback_roadmap(
                role_title=role_title,
                role_description=role_desc,
                missing_skills=missing_skills,
                partially_matched_skills=partially_matched_skills,
                available_hours_per_week=available_hours_per_week,
            )
            ai_metadata = {"provider": "fallback", "model": "rule-based-v1"}

        # 4. Validate and normalize structure
        validated = RoadmapValidationService.validate_and_normalize(
            raw_data=raw_response, fallback_role_title=role_title
        )

        # 5. Archive prior active roadmaps for this user
        await self.roadmap_repo.archive_active_for_user(user_id)

        # 6. Build and persist roadmap document
        roadmap_data = {
            "user_id": user_id,
            "target_role_id": str(role_id),
            "target_role_title": role_title,
            "source_skill_gap_analysis_id": str(gap_doc["id"]),
            "title": validated["title"],
            "description": validated["description"],
            "estimated_duration_days": validated["estimated_duration_days"],
            "milestones": validated["milestones"],
            "status": "active",
            "completion_percentage": 0,
            "is_stale": False,
            "ai_metadata": ai_metadata,
        }

        created = await self.roadmap_repo.create(roadmap_data)
        return created

    async def get_current_roadmap(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve current active roadmap for user, dynamically evaluating staleness
        against newer skill-gap analyses.
        """
        doc = await self.roadmap_repo.find_current_active_by_user(user_id)
        if not doc:
            # If no active roadmap, try to return latest completed or archived
            doc = await self.roadmap_repo.find_latest_by_user(user_id)
        if not doc:
            return None

        # Check if newer skill gap analysis exists or if source gap analysis is marked stale
        latest_gap = await self.skill_gap_repo.find_latest_by_user(user_id)
        if latest_gap:
            if str(latest_gap.get("id")) != str(doc.get("source_skill_gap_analysis_id")) or latest_gap.get("is_stale"):
                doc["is_stale"] = True

        return doc

    async def get_roadmap_by_id(
        self, roadmap_id: str, user_id: str
    ) -> Optional[Dict[str, Any]]:
        """Find a roadmap by ID scoped to current user."""
        return await self.roadmap_repo.find_by_id_and_user(roadmap_id, user_id)

    async def update_task_progress(
        self, roadmap_id: str, task_id: str, new_status: str, user_id: str
    ) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        """
        Update the status of a specific task within a roadmap.
        Recalculates milestone statuses and overall completion percentage.
        """
        roadmap = await self.roadmap_repo.find_by_id_and_user(roadmap_id, user_id)
        if not roadmap:
            raise AppException(
                status_code=404,
                code="ROADMAP_NOT_FOUND",
                message="Learning roadmap was not found.",
            )

        updated_doc, progress = RoadmapProgressService.update_task_status(
            roadmap=roadmap, task_id=task_id, new_status=new_status
        )

        saved = await self.roadmap_repo.update_roadmap(
            roadmap_id=roadmap_id,
            user_id=user_id,
            updates={
                "milestones": updated_doc["milestones"],
                "status": updated_doc["status"],
                "completion_percentage": updated_doc["completion_percentage"],
            },
        )

        return saved or updated_doc, progress

    async def get_roadmap_progress(
        self, roadmap_id: str, user_id: str
    ) -> Dict[str, Any]:
        """Return progress metrics for a roadmap."""
        roadmap = await self.roadmap_repo.find_by_id_and_user(roadmap_id, user_id)
        if not roadmap:
            raise AppException(
                status_code=404,
                code="ROADMAP_NOT_FOUND",
                message="Learning roadmap was not found.",
            )
        return RoadmapProgressService.recalculate_roadmap_progress(roadmap)

    async def archive_roadmap(
        self, roadmap_id: str, user_id: str
    ) -> Dict[str, Any]:
        """Archive a roadmap."""
        roadmap = await self.roadmap_repo.find_by_id_and_user(roadmap_id, user_id)
        if not roadmap:
            raise AppException(
                status_code=404,
                code="ROADMAP_NOT_FOUND",
                message="Learning roadmap was not found.",
            )
        updated = await self.roadmap_repo.update_roadmap(
            roadmap_id=roadmap_id,
            user_id=user_id,
            updates={"status": "archived"},
        )
        return updated or roadmap

    async def list_user_roadmaps(
        self, user_id: str, status: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """List user's roadmaps."""
        return await self.roadmap_repo.list_by_user(user_id=user_id, status=status)

