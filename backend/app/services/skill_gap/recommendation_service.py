import json
import logging
from typing import Any, Dict, List, Optional
from app.integrations.ai.base import BaseAIProvider
from app.integrations.ai.provider_factory import get_ai_provider

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a senior tech career coach and technical hiring advisor.
Your job is to analyze skill gap comparison results for a target job role and output actionable, high-impact recommendations for bridging those gaps.

Return ONLY a valid JSON object matching this exact schema:
{
  "summary": "Concise 2-3 sentence executive assessment of the candidate's alignment with the role.",
  "recommendations": [
    {
      "skill": "Name of the missing or partial skill",
      "priority": "high" | "medium" | "low",
      "reason": "Why this skill is critical for this specific role and current market expectations.",
      "practical_project": "A concrete, resume-worthy project idea that demonstrates this skill in practice.",
      "learning_activity": "Targeted hands-on activity or tutorial path to master this competency quickly."
    }
  ]
}
"""


class RecommendationService:
    """Generates AI-powered personalized improvement recommendations for identified skill gaps."""

    @classmethod
    def _fallback_recommendations(
        cls,
        role_title: str,
        missing_skills: List[Dict[str, Any]],
        partially_matched_skills: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """Deterministic fallback when AI provider is unavailable or in mock/offline mode."""
        recs = []

        # Sort missing skills by importance descending
        sorted_missing = sorted(
            missing_skills, key=lambda s: s.get("importance", 3), reverse=True
        )
        for s in sorted_missing[:4]:
            name = s.get("name", "Skill")
            imp = s.get("importance", 3)
            priority = "high" if imp >= 4 else "medium"
            recs.append({
                "skill": name,
                "priority": priority,
                "reason": f"{name} is a key requirement for {role_title} positions, essential for production engineering.",
                "practical_project": f"Build an end-to-end portfolio module featuring {name} with automated tests and CI deployment.",
                "learning_activity": f"Complete hands-on documentation tutorials and build 2 micro-projects exercising core {name} paradigms.",
            })

        for s in partially_matched_skills[:2]:
            name = s.get("name", "Skill")
            recs.append({
                "skill": name,
                "priority": "medium",
                "reason": f"Leveling up from partial knowledge to advanced production patterns in {name} will substantially boost interview pass rates.",
                "practical_project": f"Refactor an existing project to integrate advanced {name} patterns, concurrency, and performance tuning.",
                "learning_activity": f"Study intermediate-to-advanced architectural guides and open-source implementations for {name}.",
            })

        summary = (
            f"You possess foundational qualifications for {role_title}. "
            f"Focusing on high-priority missing competencies ({', '.join([s['skill'] for s in recs[:2]]) or 'key areas'}) "
            f"will rapidly elevate your interview readiness."
        )

        return {
            "summary": summary,
            "recommendations": recs,
            "ai_metadata": {"provider": "fallback", "model": "rule-based-v1"},
        }

    @classmethod
    async def generate_recommendations(
        cls,
        role_title: str,
        role_description: str,
        matched_skills: List[Dict[str, Any]],
        partially_matched_skills: List[Dict[str, Any]],
        missing_skills: List[Dict[str, Any]],
        ai_provider: Optional[BaseAIProvider] = None,
    ) -> Dict[str, Any]:
        """
        Generate structured skill recommendations via AI provider, falling back gracefully on error.
        """
        provider = ai_provider or get_ai_provider()

        user_prompt = f"""
Target Role: {role_title}
Role Description: {role_description}

Candidate's Current Matched Skills:
{json.dumps([s.get('name') for s in matched_skills], indent=2)}

Candidate's Partially Matched Skills:
{json.dumps([{"name": s.get("name"), "reason": s.get("reason")} for s in partially_matched_skills], indent=2)}

Candidate's Missing Required Skills:
{json.dumps([{"name": s.get("name"), "importance": s.get("importance")} for s in missing_skills], indent=2)}

Please provide a concise executive summary and 3 to 6 prioritized, concrete improvement recommendations with practical project ideas.
"""

        try:
            result = await provider.generate_json(
                system_prompt=SYSTEM_PROMPT, user_prompt=user_prompt
            )
            summary = result.get("summary") or "Skill gap analysis completed successfully."
            raw_recs = result.get("recommendations", [])
            cleaned_recs = []
            for r in raw_recs:
                if isinstance(r, dict) and r.get("skill"):
                    cleaned_recs.append({
                        "skill": str(r.get("skill")),
                        "priority": str(r.get("priority", "medium")).lower(),
                        "reason": str(r.get("reason", "")),
                        "practical_project": str(r.get("practical_project", "")),
                        "learning_activity": str(r.get("learning_activity", "")),
                    })

            return {
                "summary": summary,
                "recommendations": cleaned_recs,
                "ai_metadata": {
                    "provider": getattr(provider, "provider_name", "ai"),
                    "model": getattr(provider, "model_name", "unknown"),
                    "prompt_version": "skill-gap-v1",
                },
            }
        except Exception as e:
            logger.warning("AI recommendation generation failed (%s); using fallback.", e)
            return cls._fallback_recommendations(
                role_title=role_title,
                missing_skills=missing_skills,
                partially_matched_skills=partially_matched_skills,
            )

