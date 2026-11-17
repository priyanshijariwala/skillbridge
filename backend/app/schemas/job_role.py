from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class RoleSkillDTO(BaseModel):
    name: str
    importance: int = Field(ge=1, le=5, default=3)
    category: str = "General"
    description: Optional[str] = None


class JobRoleBase(BaseModel):
    slug: str
    title: str
    category: str
    description: str
    experience_level: str = "Mid"
    required_skills: List[RoleSkillDTO] = Field(default_factory=list)
    optional_skills: List[RoleSkillDTO] = Field(default_factory=list)
    is_active: bool = True


class JobRoleCreate(JobRoleBase):
    pass


class JobRoleRead(JobRoleBase):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class JobRoleListResponse(BaseModel):
    items: List[JobRoleRead]
    total: int

