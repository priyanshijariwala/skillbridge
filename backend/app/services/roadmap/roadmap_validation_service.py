import uuid
from typing import Any, Dict, List, Set
from app.core.errors import AppException

VALID_TASK_TYPES = {"learn", "practice", "project", "assessment", "revise"}
VALID_PRIORITIES = {"high", "medium", "low"}


class RoadmapValidationService:
    """Validates and normalizes structured roadmap output from AI or fallback."""

    @classmethod
    def validate_and_normalize(
        cls,
        raw_data: Dict[str, Any],
        fallback_role_title: str = "Engineering",
    ) -> Dict[str, Any]:
        """
        Validate and sanitize roadmap structure.
        Raises AppException if required fields or structural rules are violated.
        """
        if not isinstance(raw_data, dict):
            raise AppException(
                status_code=502,
                code="INVALID_ROADMAP_OUTPUT",
                message="AI returned invalid non-dictionary roadmap data.",
            )

        title = str(raw_data.get("title") or f"{fallback_role_title} Personalized Learning Roadmap").strip()
        description = str(
            raw_data.get("description")
            or f"Personalized curriculum tailored to prepare for {fallback_role_title} competencies."
        ).strip()

        raw_milestones = raw_data.get("milestones", [])
        if not isinstance(raw_milestones, list) or len(raw_milestones) == 0:
            raise AppException(
                status_code=502,
                code="EMPTY_ROADMAP_MILESTONES",
                message="Roadmap must contain at least one learning milestone.",
            )

        normalized_milestones: List[Dict[str, Any]] = []
        total_hours = 0
        total_days = 0
        seen_task_titles: Set[str] = set()

        for idx, m in enumerate(raw_milestones, start=1):
            if not isinstance(m, dict):
                continue

            m_title = str(m.get("title") or f"Milestone {idx}").strip()
            m_desc = str(m.get("description") or f"Milestone {idx} curriculum and practical goals.").strip()
            m_order = idx  # Enforce strictly sequential 1, 2, 3...
            m_days = max(1, int(m.get("estimated_duration_days", 14)))
            total_days += m_days

            m_priority = str(m.get("priority", "medium")).lower()
            if m_priority not in VALID_PRIORITIES:
                m_priority = "medium"

            raw_related = m.get("related_skills", [])
            related_skills = [
                str(s).strip() for s in raw_related if isinstance(s, (str, int)) and str(s).strip()
            ]

            raw_tasks = m.get("tasks", [])
            if not isinstance(raw_tasks, list) or len(raw_tasks) == 0:
                raise AppException(
                    status_code=502,
                    code="EMPTY_MILESTONE_TASKS",
                    message=f"Milestone '{m_title}' contains no learning tasks.",
                )

            normalized_tasks: List[Dict[str, Any]] = []
            for t_idx, t in enumerate(raw_tasks, start=1):
                if not isinstance(t, dict):
                    continue

                t_title = str(t.get("title") or f"Task {idx}.{t_idx}").strip()
                t_desc = str(t.get("description") or f"Actionable steps to practice and master {t_title}.").strip()

                # Deduplicate exact task titles across roadmap
                title_key = t_title.lower()
                if title_key in seen_task_titles:
                    t_title = f"{t_title} (Part {t_idx})"
                seen_task_titles.add(title_key)

                t_type = str(t.get("task_type", "learn")).lower()
                if t_type not in VALID_TASK_TYPES:
                    t_type = "learn"

                t_priority = str(t.get("priority", "medium")).lower()
                if t_priority not in VALID_PRIORITIES:
                    t_priority = "medium"

                t_skill = str(t.get("related_skill") or (related_skills[0] if related_skills else "General")).strip()
                t_hours = max(1, min(100, int(t.get("estimated_duration_hours", 4))))
                total_hours += t_hours

                raw_resources = t.get("resources", [])
                resources = [
                    str(r).strip() for r in raw_resources if isinstance(r, str) and str(r).strip()
                ]

                normalized_tasks.append({
                    "id": f"m_{idx}_t_{t_idx}_{uuid.uuid4().hex[:6]}",
                    "title": t_title,
                    "description": t_desc,
                    "task_type": t_type,
                    "related_skill": t_skill,
                    "estimated_duration_hours": t_hours,
                    "priority": t_priority,
                    "status": "not_started",
                    "completed_at": None,
                    "resources": resources,
                })

            if len(normalized_tasks) == 0:
                raise AppException(
                    status_code=502,
                    code="EMPTY_MILESTONE_TASKS",
                    message=f"Milestone '{m_title}' must contain at least one valid task.",
                )

            normalized_milestones.append({
                "id": f"m_{idx}_{uuid.uuid4().hex[:6]}",
                "title": m_title,
                "description": m_desc,
                "order": m_order,
                "estimated_duration_days": m_days,
                "priority": m_priority,
                "status": "not_started",
                "related_skills": related_skills,
                "tasks": normalized_tasks,
            })

        duration_days = max(1, int(raw_data.get("estimated_duration_days", total_days or 30)))

        return {
            "title": title,
            "description": description,
            "estimated_duration_days": duration_days,
            "milestones": normalized_milestones,
        }

