from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional


@dataclass
class RoleSkillItem:
    name: str
    importance: int = 3  # 1 to 5 scale
    category: str = "General"
    description: Optional[str] = None


@dataclass
class JobRoleInDB:
    slug: str
    title: str
    category: str
    description: str
    required_skills: List[RoleSkillItem] = field(default_factory=list)
    optional_skills: List[RoleSkillItem] = field(default_factory=list)
    experience_level: str = "Mid"
    is_active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

