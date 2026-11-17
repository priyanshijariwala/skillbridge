from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


class EducationDTO(BaseModel):
    degree: str = Field(..., min_length=1, max_length=200)
    institution: str = Field(..., min_length=1, max_length=200)
    graduation_year: Optional[int] = Field(None, ge=1950, le=2100)


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    headline: Optional[str] = Field(None, max_length=200)
    bio: Optional[str] = Field(None, max_length=1000)
    target_role_id: Optional[str] = Field(None, max_length=100)
    target_role_title: Optional[str] = Field(None, max_length=200)
    target_seniority: Optional[str] = Field(None)
    years_of_experience: Optional[int] = Field(None, ge=0, le=60)
    skills: Optional[List[str]] = Field(None)
    education: Optional[List[EducationDTO]] = None
    linkedin_url: Optional[str] = Field(None, max_length=500)
    github_url: Optional[str] = Field(None, max_length=500)
    portfolio_url: Optional[str] = Field(None, max_length=500)

    @field_validator("target_seniority")
    @classmethod
    def validate_seniority(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        allowed = {"Junior", "Mid", "Senior", "Lead", "Staff", "Principal"}
        if v not in allowed:
            raise ValueError(f"target_seniority must be one of: {', '.join(sorted(allowed))}")
        return v

    @field_validator("linkedin_url", "github_url", "portfolio_url", mode="before")
    @classmethod
    def validate_url(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v == "":
            return None
        v = v.strip()
        if v and not (v.startswith("http://") or v.startswith("https://")):
            raise ValueError("URL must start with http:// or https://")
        return v

    @field_validator("skills", mode="before")
    @classmethod
    def validate_skills(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        if v is None:
            return v
        cleaned = [s.strip() for s in v if s and s.strip()]
        if len(cleaned) > 100:
            raise ValueError("Cannot store more than 100 skills")
        return cleaned


class ProfileRead(BaseModel):
    id: Optional[str] = None
    user_id: str
    full_name: str
    email: str
    headline: Optional[str] = None
    bio: Optional[str] = None
    target_role_id: Optional[str] = None
    target_role_title: Optional[str] = None
    target_seniority: Optional[str] = None
    years_of_experience: Optional[int] = None
    skills: List[str] = []
    education: List[EducationDTO] = []
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

