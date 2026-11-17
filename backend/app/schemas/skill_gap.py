from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class SkillGapAnalyzeRequest(BaseModel):
    target_role_id: str = Field(..., description="Target Job Role ID or Slug")
    resume_id: Optional[str] = Field(None, description="Optional resume ID; defaults to latest uploaded resume")


class MatchedSkillDTO(BaseModel):
    name: str
    importance: int = Field(ge=1, le=5)
    category: str = "General"
    evidence: Optional[str] = None


class PartialSkillDTO(BaseModel):
    name: str
    importance: int = Field(ge=1, le=5)
    category: str = "General"
    reason: Optional[str] = None


class MissingSkillDTO(BaseModel):
    name: str
    importance: int = Field(ge=1, le=5)
    category: str = "General"


class OptionalSkillDTO(BaseModel):
    name: str
    importance: int = Field(ge=1, le=5)
    category: str = "General"
    status: str = "missing"  # "matched" | "partial" | "missing"


class SkillRecommendationDTO(BaseModel):
    skill: str
    priority: str = "medium"  # "high" | "medium" | "low"
    reason: str
    practical_project: Optional[str] = None
    learning_activity: Optional[str] = None


class SkillGapCountsDTO(BaseModel):
    matched: int = 0
    partial: int = 0
    missing: int = 0
    optional: int = 0
    total_required: int = 0


class SkillGapAnalysisRead(BaseModel):
    id: str
    user_id: str
    resume_id: str
    resume_analysis_id: str
    target_role_id: str
    target_role_title: str
    match_percentage: int = Field(ge=0, le=100)
    summary: Optional[str] = None
    counts: SkillGapCountsDTO = Field(default_factory=SkillGapCountsDTO)
    matched_skills: List[MatchedSkillDTO] = Field(default_factory=list)
    partially_matched_skills: List[PartialSkillDTO] = Field(default_factory=list)
    missing_skills: List[MissingSkillDTO] = Field(default_factory=list)
    optional_skills: List[OptionalSkillDTO] = Field(default_factory=list)
    recommendations: List[SkillRecommendationDTO] = Field(default_factory=list)
    is_stale: bool = False
    ai_metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class SkillGapAnalysisListResponse(BaseModel):
    items: List[SkillGapAnalysisRead]
    total: int

