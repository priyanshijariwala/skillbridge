from datetime import datetime, timezone
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field

ProblemDifficulty = Literal["easy", "medium", "hard"]
SubmissionStatus = Literal[
    "accepted",
    "wrong_answer",
    "time_limit_exceeded",
    "memory_limit_exceeded",
    "compilation_error",
    "runtime_error",
    "internal_error",
    "pending",
]


class ProblemExample(BaseModel):
    input: str
    output: str
    explanation: Optional[str] = None


class TestCase(BaseModel):
    input: str
    expected_output: str
    is_hidden: bool = False
    time_limit: float = 2.0
    memory_limit: int = 128


class CodingProblemInDB(BaseModel):
    id: str
    title: str
    slug: str
    description: str
    difficulty: ProblemDifficulty
    category: str
    topics: List[str] = Field(default_factory=list)
    constraints: List[str] = Field(default_factory=list)
    examples: List[ProblemExample] = Field(default_factory=list)
    sample_test_cases: List[TestCase] = Field(default_factory=list)
    hidden_test_cases: List[TestCase] = Field(default_factory=list)
    supported_languages: List[str] = Field(
        default_factory=lambda: ["python", "javascript", "typescript", "java", "cpp", "go"]
    )
    starter_code: Dict[str, str] = Field(default_factory=dict)
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = ConfigDict(from_attributes=True)


class CodeSubmissionInDB(BaseModel):
    id: str
    user_id: str
    problem_id: str
    problem_title: str
    problem_slug: str
    language: str
    source_code: str
    execution_status: SubmissionStatus
    test_cases_passed: int = 0
    total_test_cases: int = 0
    execution_time_ms: Optional[float] = None
    memory_kb: Optional[int] = None
    error_message: Optional[str] = None
    test_case_results: List[Dict[str, Any]] = Field(default_factory=list)
    ai_review: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = ConfigDict(from_attributes=True)


class CodingAssessmentInDB(BaseModel):
    id: str
    user_id: str
    title: str
    assessment_type: str = "practice"
    difficulty: str = "mixed"
    problem_ids: List[str] = Field(default_factory=list)
    status: str = "in_progress"
    score: Optional[float] = None
    started_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = ConfigDict(from_attributes=True)
