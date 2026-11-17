from datetime import datetime, timezone
from typing import Any, Dict, Optional, Tuple
from app.core.errors import AppException


class RoadmapProgressService:
    """Manages task status updates, derived milestone statuses, and overall roadmap progress."""

    @classmethod
    def recalculate_roadmap_progress(
        cls, roadmap: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Recalculates milestone statuses, total completed tasks, remaining hours,
        and overall completion percentage.
        """
        milestones = roadmap.get("milestones", [])
        total_tasks = 0
        completed_tasks = 0
        in_progress_tasks = 0
        pending_tasks = 0
        remaining_hours = 0

        completed_milestones = 0
        in_progress_milestones = 0

        for m in milestones:
            m_tasks = m.get("tasks", [])
            m_total = len(m_tasks)
            m_completed = 0
            m_in_progress = 0

            for t in m_tasks:
                total_tasks += 1
                status = t.get("status", "not_started")
                hours = int(t.get("estimated_duration_hours", 3))

                if status == "completed":
                    completed_tasks += 1
                    m_completed += 1
                elif status == "in_progress":
                    in_progress_tasks += 1
                    m_in_progress += 1
                    remaining_hours += hours
                else:
                    pending_tasks += 1
                    remaining_hours += hours

            # Derive milestone status
            if m_total > 0 and m_completed == m_total:
                m["status"] = "completed"
                completed_milestones += 1
            elif m_in_progress > 0 or m_completed > 0:
                m["status"] = "in_progress"
                in_progress_milestones += 1
            else:
                m["status"] = "not_started"

        if total_tasks > 0:
            completion_percentage = min(100, max(0, round((completed_tasks / total_tasks) * 100)))
        else:
            completion_percentage = 0

        # Update roadmap status
        current_status = roadmap.get("status", "active")
        if current_status != "archived":
            if total_tasks > 0 and completed_tasks == total_tasks:
                roadmap["status"] = "completed"
            else:
                roadmap["status"] = "active"

        roadmap["completion_percentage"] = completion_percentage

        return {
            "roadmap_id": str(roadmap.get("id", "")),
            "status": roadmap.get("status", "active"),
            "completion_percentage": completion_percentage,
            "total_milestones": len(milestones),
            "completed_milestones": completed_milestones,
            "in_progress_milestones": in_progress_milestones,
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "in_progress_tasks": in_progress_tasks,
            "pending_tasks": pending_tasks,
            "estimated_remaining_hours": remaining_hours,
        }

    @classmethod
    def update_task_status(
        cls,
        roadmap: Dict[str, Any],
        task_id: str,
        new_status: str,
    ) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        """
        Finds task by task_id in roadmap, updates its status, and updates milestones and roadmap.
        Returns (updated_roadmap, progress_summary).
        Raises AppException if task_id not found or status is invalid.
        """
        allowed = {"not_started", "in_progress", "completed"}
        if new_status not in allowed:
            raise AppException(
                status_code=400,
                code="INVALID_TASK_STATUS",
                message=f"Status must be one of: {', '.join(sorted(allowed))}",
            )

        task_found = False
        now = datetime.now(timezone.utc)

        for m in roadmap.get("milestones", []):
            for t in m.get("tasks", []):
                if t.get("id") == task_id:
                    task_found = True
                    t["status"] = new_status
                    if new_status == "completed":
                        t["completed_at"] = now
                    else:
                        t["completed_at"] = None
                    break
            if task_found:
                break

        if not task_found:
            raise AppException(
                status_code=404,
                code="TASK_NOT_FOUND",
                message=f"Task with ID '{task_id}' was not found in this roadmap.",
            )

        progress = cls.recalculate_roadmap_progress(roadmap)
        return roadmap, progress

