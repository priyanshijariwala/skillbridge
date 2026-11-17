from datetime import datetime
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field

TaskType = Literal["learn", "practice", "project", "assessment", "revise"]
TaskStatus = Literal["not_started", "in_progress", "completed"]
MilestoneStatus = Literal["not_started", "in_progress", "completed"]
RoadmapStatus = Literal["active", "completed", "archived"]
PriorityLevel = Literal["high", "medium", "low"]


class TaskDTO(BaseModel):
    id: str
    title: str
    description: str
    task_type: TaskType = "learn"
    related_skill: str
    estimated_duration_hours: int = Field(ge=1, le=100, default=3)
    priority: PriorityLevel = "medium"
    status: TaskStatus = "not_started"
    completed_at: Optional[datetime] = None
    resources: List[str] = Field(default_factory=list)


class TaskUpdateDTO(BaseModel):
    status: TaskStatus = Field(..., description="New status for the task")


class MilestoneDTO(BaseModel):
    id: str
    title: str
    description: str
    order: int = Field(ge=1)
    estimated_duration_days: int = Field(ge=1, le=180, default=7)
    priority: PriorityLevel = "medium"
    status: MilestoneStatus = "not_started"
    related_skills: List[str] = Field(default_factory=list)
    tasks: List[TaskDTO] = Field(default_factory=list)


class RoadmapGenerateRequest(BaseModel):
    skill_gap_analysis_id: Optional[str] = Field(
        None, description="Optional skill gap analysis ID; defaults to latest valid analysis"
    )
    available_hours_per_week: Optional[int] = Field(
        None, ge=1, le=80, description="Optional weekly commitment for pace calibration"
    )


class RoadmapProgressResponse(BaseModel):
    roadmap_id: str
    status: RoadmapStatus
    completion_percentage: int = Field(ge=0, le=100)
    total_milestones: int
    completed_milestones: int
    in_progress_milestones: int
    total_tasks: int
    completed_tasks: int
    in_progress_tasks: int
    pending_tasks: int
    estimated_remaining_hours: int


class RoadmapRead(BaseModel):
    id: str
    user_id: str
    target_role_id: str
    target_role_title: str
    source_skill_gap_analysis_id: str
    title: str
    description: str
    estimated_duration_days: int
    milestones: List[MilestoneDTO] = Field(default_factory=list)
    status: RoadmapStatus = "active"
    completion_percentage: int = Field(ge=0, le=100, default=0)
    is_stale: bool = False
    ai_metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class RoadmapListResponse(BaseModel):
    items: List[RoadmapRead]
    total: int

