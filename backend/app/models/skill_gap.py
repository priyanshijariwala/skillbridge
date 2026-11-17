from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional


@dataclass
class MatchedSkillInDB:
    name: str
    importance: int
    category: str
    evidence: Optional[str] = None


@dataclass
class PartialSkillInDB:
    name: str
    importance: int
    category: str
    reason: Optional[str] = None


@dataclass
class MissingSkillInDB:
    name: str
    importance: int
    category: str


@dataclass
class OptionalSkillInDB:
    name: str
    importance: int
    category: str
    status: str  # "matched", "partial", "missing"


@dataclass
class RecommendationInDB:
    skill: str
    priority: str  # "high", "medium", "low"
    reason: str
    practical_project: Optional[str] = None
    learning_activity: Optional[str] = None


@dataclass
class SkillGapAnalysisInDB:
    user_id: str
    resume_id: str
    resume_analysis_id: str
    target_role_id: str
    target_role_title: str
    match_percentage: int
    matched_skills: List[MatchedSkillInDB] = field(default_factory=list)
    partially_matched_skills: List[PartialSkillInDB] = field(default_factory=list)
    missing_skills: List[MissingSkillInDB] = field(default_factory=list)
    optional_skills: List[OptionalSkillInDB] = field(default_factory=list)
    recommendations: List[RecommendationInDB] = field(default_factory=list)
    summary: Optional[str] = None
    is_stale: bool = False
    ai_metadata: Dict[str, Any] = field(default_factory=dict)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

