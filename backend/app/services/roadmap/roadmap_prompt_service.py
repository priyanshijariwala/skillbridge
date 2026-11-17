import json
from typing import Any, Dict, List, Optional

SYSTEM_PROMPT = """You are a senior tech curriculum architect and career preparation mentor.
Your task is to design a realistic, dependency-aware, and highly structured learning roadmap for a candidate bridging their verified skill gaps toward a target engineering job role.

Adhere strictly to these principles:
1. Dependency Ordering: Foundational skills MUST precede advanced concepts (e.g., JavaScript/TypeScript before React; Core Python/SQL before asynchronous FastAPI; Git basics before collaborative CI/CD).
2. Gap-Centric: Focus primarily on Missing and Partially Matched competencies. Do not regenerate tasks for competencies the candidate has already verified, except as context for advanced projects.
3. Realistic & Actionable: Each milestone must have 2 to 4 concrete tasks with realistic hour estimates (2-12 hours per task).
4. Task Types: Use ONLY "learn", "practice", "project", "assessment", or "revise".
5. Resource Guidance: Suggest authoritative documentation names, topic titles, or search phrases (e.g., "Official FastAPI Tutorial", "MDN Web Docs: Promises and Async"). DO NOT fabricate URLs.
6. Durations: Provide estimated_duration_days for milestones and estimated_duration_hours for tasks.

Output ONLY a valid JSON object matching this schema:
{
  "title": "Title of the preparation roadmap (e.g., 'Full Stack Developer Preparation Curriculum')",
  "description": "2-3 sentences explaining the learning trajectory and outcomes.",
  "estimated_duration_days": 60,
  "milestones": [
    {
      "title": "Milestone title (e.g., 'Core Backend Foundations with Python & FastAPI')",
      "description": "Milestone objective and competency focus.",
      "order": 1,
      "estimated_duration_days": 14,
      "priority": "high" | "medium" | "low",
      "related_skills": ["Python", "FastAPI"],
      "tasks": [
        {
          "title": "Task title",
          "description": "Actionable task instructions and learning objectives.",
          "task_type": "learn" | "practice" | "project" | "assessment" | "revise",
          "related_skill": "FastAPI",
          "estimated_duration_hours": 6,
          "priority": "high" | "medium" | "low",
          "resources": ["Official FastAPI Tutorial - Path Parameters and Pydantic Models"]
        }
      ]
    }
  ]
}
"""


class RoadmapPromptService:
    @staticmethod
    def build_user_prompt(
        role_title: str,
        role_description: str,
        matched_skills: List[Dict[str, Any]],
        partially_matched_skills: List[Dict[str, Any]],
        missing_skills: List[Dict[str, Any]],
        available_hours_per_week: Optional[int] = None,
    ) -> str:
        """Construct the prompt sent to the AI provider."""
        hours_note = (
            f"\nCandidate study commitment: ~{available_hours_per_week} hours per week."
            if available_hours_per_week
            else ""
        )

        matched_names = [s.get("name") for s in matched_skills if s.get("name")]
        partial_info = [
            {"name": s.get("name"), "reason": s.get("reason")}
            for s in partially_matched_skills
            if s.get("name")
        ]
        missing_info = [
            {"name": s.get("name"), "importance": s.get("importance")}
            for s in missing_skills
            if s.get("name")
        ]

        return f"""Target Engineering Role: {role_title}
Role Description: {role_description}{hours_note}

Candidate Skill Gap Assessment:
- Already Verified (Candidate Strengths - do not teach from scratch):
{json.dumps(matched_names, indent=2)}

- Partially Matched (Needs leveling up to production level):
{json.dumps(partial_info, indent=2)}

- Missing Required Competencies (Critical gaps to teach sequentially):
{json.dumps(missing_info, indent=2)}

Please generate 3 to 6 logical, sequenced milestones containing 2 to 4 actionable tasks each.
Ensure foundational requirements appear in earlier milestones before advanced integration or capstone modules.
"""

