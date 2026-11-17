from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional


@dataclass
class TaskInDB:
    id: str
    title: str
    description: str
    task_type: str  # "learn", "practice", "project", "assessment", "revise"
    related_skill: str
    estimated_duration_hours: int
    priority: str  # "high", "medium", "low"
    status: str = "not_started"  # "not_started", "in_progress", "completed"
    completed_at: Optional[datetime] = None
    resources: List[str] = field(default_factory=list)


@dataclass
class MilestoneInDB:
    id: str
    title: str
    description: str
    order: int
    estimated_duration_days: int
    priority: str  # "high", "medium", "low"
    status: str = "not_started"  # "not_started", "in_progress", "completed"
    related_skills: List[str] = field(default_factory=list)
    tasks: List[TaskInDB] = field(default_factory=list)


@dataclass
class RoadmapInDB:
    user_id: str
    target_role_id: str
    target_role_title: str
    source_skill_gap_analysis_id: str
    title: str
    description: str
    estimated_duration_days: int
    milestones: List[MilestoneInDB] = field(default_factory=list)
    status: str = "active"  # "active", "completed", "archived"
    completion_percentage: int = 0
    is_stale: bool = False
    ai_metadata: Dict[str, Any] = field(default_factory=dict)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

