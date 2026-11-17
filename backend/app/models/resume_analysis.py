from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional


@dataclass
class ResumeAnalysisInDB:
    user_id: str
    resume_id: str
    overall_score: int
    score_breakdown: Dict[str, int]
    summary: str
    extracted_data: Dict[str, Any]
    strengths: List[Dict[str, Any]]
    improvements: List[Dict[str, Any]]
    recommendations: List[str]
    missing_information: List[str]
    ats_observations: List[str]
    detected_skills: List[Dict[str, Any]]
    recommended_roles: List[str]
    ai_metadata: Dict[str, Any]
    status: str = "completed"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

