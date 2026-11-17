import logging
from typing import Any, Dict, List, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.repositories.interview_feedback_repository import InterviewFeedbackRepository
from app.repositories.interview_repository import InterviewRepository
from app.repositories.profile_repository import ProfileRepository
from app.repositories.resume_analysis_repository import ResumeAnalysisRepository
from app.repositories.roadmap_repository import RoadmapRepository
from app.repositories.skill_gap_repository import SkillGapRepository
from app.repositories.user_repository import UserRepository

logger = logging.getLogger(__name__)


class ContextRetrievalService:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.db = db
        self.user_repo = UserRepository(db)
        self.profile_repo = ProfileRepository(db)
        self.resume_analysis_repo = ResumeAnalysisRepository(db)
        self.skill_gap_repo = SkillGapRepository(db)
        self.roadmap_repo = RoadmapRepository(db)
        self.interview_repo = InterviewRepository(db)
        self.feedback_repo = InterviewFeedbackRepository(db)

    async def get_user_context(self, user_id: str) -> Dict[str, Any]:
        """
        Aggregate the authenticated candidate's active profile, latest resume analysis,
        skill gap assessment, learning roadmap, and recent mock interview scores.
        """
        user_name: Optional[str] = None
        target_role: Optional[str] = None
        sources = {
            "profile_available": False,
            "resume_available": False,
            "skill_gap_available": False,
            "roadmap_available": False,
            "interview_available": False,
        }

        context_lines: List[str] = []

        # 1. User & Profile
        try:
            user = await self.user_repo.find_by_id(user_id)
            if user:
                user_name = user.get("name")

            profile = await self.profile_repo.find_by_user_id(user_id)
            if profile:
                sources["profile_available"] = True
                headline = profile.get("headline", "")
                target_role = profile.get("target_role") or target_role
                seniority = profile.get("seniority", "")
                skills = profile.get("skills", [])

                context_lines.append("### Candidate Profile:")
                if user_name:
                    context_lines.append(f"- Name: {user_name}")
                if headline:
                    context_lines.append(f"- Headline: {headline}")
                if seniority:
                    context_lines.append(f"- Level: {seniority.capitalize()}")
                if target_role:
                    context_lines.append(f"- Target Role: {target_role}")
                if skills:
                    context_lines.append(f"- Profile Skills: {', '.join(skills[:8])}")
        except Exception as e:
            logger.debug("Failed to retrieve profile context: %s", e)

        # 2. Latest Resume Analysis
        try:
            resume_analysis = await self.resume_analysis_repo.find_latest_by_user(user_id)
            if resume_analysis:
                sources["resume_available"] = True
                score = resume_analysis.get("overall_score")
                skills = [
                    s.get("name") if isinstance(s, dict) else str(s)
                    for s in resume_analysis.get("skills", [])[:8]
                ]
                strengths = resume_analysis.get("strengths", [])[:3]
                improvements = resume_analysis.get("improvement_areas", [])[:3]

                context_lines.append("\n### Latest Resume Analysis:")
                if score is not None:
                    context_lines.append(f"- Resume Health Score: {score}/100")
                if skills:
                    context_lines.append(f"- Extracted Technical Competencies: {', '.join(skills)}")
                if strengths:
                    context_lines.append(f"- Resume Strengths: {'; '.join(strengths)}")
                if improvements:
                    context_lines.append(f"- Resume Improvement Areas: {'; '.join(improvements)}")
        except Exception as e:
            logger.debug("Failed to retrieve resume context: %s", e)

        # 3. Latest Skill-Gap Analysis
        try:
            gap_analysis = await self.skill_gap_repo.find_latest_by_user(user_id)
            if gap_analysis:
                sources["skill_gap_available"] = True
                gap_role = gap_analysis.get("target_role_title", target_role or "Software Engineer")
                match_pct = gap_analysis.get("match_percentage")
                matched = [
                    s.get("name") if isinstance(s, dict) else str(s)
                    for s in gap_analysis.get("matched_skills", [])[:6]
                ]
                missing = [
                    s.get("name") if isinstance(s, dict) else str(s)
                    for s in gap_analysis.get("missing_skills", [])[:6]
                ]
                partial = [
                    s.get("name") if isinstance(s, dict) else str(s)
                    for s in gap_analysis.get("partially_matched_skills", [])[:4]
                ]

                context_lines.append(f"\n### Target Role Skill-Gap ({gap_role}):")
                if match_pct is not None:
                    context_lines.append(f"- Role Readiness Match: {match_pct}%")
                if matched:
                    context_lines.append(f"- Verified Matched Skills: {', '.join(matched)}")
                if partial:
                    context_lines.append(f"- Partially Matched Skills: {', '.join(partial)}")
                if missing:
                    context_lines.append(f"- Priority Missing Skills: {', '.join(missing)}")
        except Exception as e:
            logger.debug("Failed to retrieve skill-gap context: %s", e)

        # 4. Learning Roadmap Progress
        try:
            roadmap = await self.roadmap_repo.find_current_active_by_user(user_id)
            if not roadmap:
                roadmap = await self.roadmap_repo.find_latest_by_user(user_id)

            if roadmap:
                sources["roadmap_available"] = True
                title = roadmap.get("title", "Curriculum")
                progress_pct = roadmap.get("completion_percentage", 0)

                # Collect current tasks
                in_progress_tasks = []
                next_tasks = []
                for m in roadmap.get("milestones", []):
                    for t in m.get("tasks", []):
                        if t.get("status") == "in_progress":
                            in_progress_tasks.append(t.get("title", ""))
                        elif t.get("status") == "pending" and len(next_tasks) < 3:
                            next_tasks.append(t.get("title", ""))

                context_lines.append(f"\n### Active Learning Roadmap ({title}):")
                context_lines.append(f"- Roadmap Progress: {progress_pct}%")
                if in_progress_tasks:
                    context_lines.append(f"- In-Progress Tasks: {'; '.join(in_progress_tasks[:3])}")
                if next_tasks:
                    context_lines.append(f"- Next Recommended Tasks: {'; '.join(next_tasks[:3])}")
        except Exception as e:
            logger.debug("Failed to retrieve roadmap context: %s", e)

        # 5. Recent Mock Interview Performance
        try:
            past_interviews = await self.interview_repo.list_by_user(
                user_id=user_id, status="completed", limit=2
            )
            if past_interviews:
                sources["interview_available"] = True
                context_lines.append("\n### Recent Mock Interview History:")
                for interview in past_interviews:
                    fb = await self.feedback_repo.find_by_interview_id_and_user(
                        interview["id"], user_id
                    )
                    role = interview.get("target_role_title", "Technical Interview")
                    score_str = f"Score: {fb.get('overall_score')}/100" if fb else "Completed"
                    strengths_str = (
                        f"Strengths: {'; '.join(fb.get('strengths', [])[:2])}" if fb else ""
                    )
                    growth_str = (
                        f"Areas for Growth: {'; '.join(fb.get('improvements', [])[:2])}"
                        if fb
                        else ""
                    )

                    context_lines.append(f"- {role} ({score_str})")
                    if strengths_str:
                        context_lines.append(f"  • {strengths_str}")
                    if growth_str:
                        context_lines.append(f"  • {growth_str}")
        except Exception as e:
            logger.debug("Failed to retrieve interview context: %s", e)

        context_text = "\n".join(context_lines) if context_lines else "No historical profile context available yet."

        return {
            "context_text": context_text,
            "sources": sources,
            "user_name": user_name,
            "target_role": target_role,
        }

