from datetime import datetime
from typing import List, Optional
from dataclasses import dataclass, field


@dataclass
class EducationItem:
    degree: str
    institution: str
    graduation_year: Optional[int] = None


@dataclass
class ProfileInDB:
    user_id: str
    headline: Optional[str] = None
    bio: Optional[str] = None
    target_role_id: Optional[str] = None
    target_role_title: Optional[str] = None
    target_seniority: Optional[str] = None
    years_of_experience: Optional[int] = None
    skills: List[str] = field(default_factory=list)
    education: List[EducationItem] = field(default_factory=list)
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

