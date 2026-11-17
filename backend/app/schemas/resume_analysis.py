from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class ScoreBreakdown(BaseModel):
    content_quality: int = Field(ge=0, le=100, default=70)
    skills_presentation: int = Field(ge=0, le=100, default=70)
    experience_descriptions: int = Field(ge=0, le=100, default=70)
    structure_readability: int = Field(ge=0, le=100, default=70)
    ats_readability: int = Field(ge=0, le=100, default=70)


class ExperienceItem(BaseModel):
    title: str = ""
    company: str = ""
    duration: Optional[str] = None
    highlights: List[str] = Field(default_factory=list)


class EducationItem(BaseModel):
    degree: str = ""
    institution: str = ""
    graduation_year: Optional[int] = None


class ProjectItem(BaseModel):
    name: str = ""
    description: Optional[str] = None
    technologies: List[str] = Field(default_factory=list)


class ExtractedData(BaseModel):
    headline: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    experience: List[ExperienceItem] = Field(default_factory=list)
    education: List[EducationItem] = Field(default_factory=list)
    projects: List[ProjectItem] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)


class ResumeAuditItem(BaseModel):
    id: str
    type: str = "strength"  # "strength" | "improvement" | "format"
    title: str
    description: str
    recommendation: Optional[str] = None


class DetectedSkill(BaseModel):
    id: str
    name: str
    category: str = "Languages"
    status: str = "verified"  # "verified" | "partial" | "gap" | "critical_gap"
    evidence_snippet: Optional[str] = None


class ResumeAnalysisResult(BaseModel):
    """Structured JSON schema output returned by the AI provider."""
    overall_score: int = Field(ge=0, le=100)
    score_breakdown: ScoreBreakdown
    summary: str
    extracted_data: ExtractedData = Field(default_factory=ExtractedData)
    strengths: List[ResumeAuditItem] = Field(default_factory=list)
    improvements: List[ResumeAuditItem] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)
    missing_information: List[str] = Field(default_factory=list)
    ats_observations: List[str] = Field(default_factory=list)
    detected_skills: List[DetectedSkill] = Field(default_factory=list)
    recommended_roles: List[str] = Field(default_factory=list)


class ResumeAnalysisRead(BaseModel):
    """Full API representation of a stored resume analysis."""
    id: str
    user_id: str
    resume_id: str
    status: str = "completed"
    overall_score: int
    score_breakdown: ScoreBreakdown
    summary: str
    extracted_data: ExtractedData
    strengths: List[ResumeAuditItem]
    improvements: List[ResumeAuditItem]
    recommendations: List[str]
    missing_information: List[str]
    ats_observations: List[str]
    detected_skills: List[DetectedSkill]
    recommended_roles: List[str]
    ai_metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

