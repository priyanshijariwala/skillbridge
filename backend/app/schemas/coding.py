from datetime import datetime
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field

ProblemDifficulty = Literal["easy", "medium", "hard"]


class ProblemExampleResponse(BaseModel):
    input: str
    output: str
    explanation: Optional[str] = None


class SampleTestCaseResponse(BaseModel):
    input: str
    expected_output: str


class ProblemListItemResponse(BaseModel):
    id: str
    title: str
    slug: str
    difficulty: ProblemDifficulty
    category: str
    topics: List[str] = Field(default_factory=list)
    is_solved: bool = False

    model_config = ConfigDict(from_attributes=True)


class ProblemListResponse(BaseModel):
    items: List[ProblemListItemResponse]
    total: int
    page: int
    page_size: int


class ProblemDetailResponse(BaseModel):
    id: str
    title: str
    slug: str
    description: str
    difficulty: ProblemDifficulty
    category: str
    topics: List[str] = Field(default_factory=list)
    constraints: List[str] = Field(default_factory=list)
    examples: List[ProblemExampleResponse] = Field(default_factory=list)
    sample_test_cases: List[SampleTestCaseResponse] = Field(default_factory=list)
    supported_languages: List[str] = Field(default_factory=list)
    starter_code: Dict[str, str] = Field(default_factory=dict)
    is_solved: bool = False

    model_config = ConfigDict(from_attributes=True)


class RunCodeRequest(BaseModel):
    problem_id: str
    source_code: str = Field(..., max_length=65536)
    language: str
    custom_stdin: Optional[str] = Field(None, max_length=16384)


class TestCaseResultItem(BaseModel):
    test_case_index: int
    passed: bool
    verdict: str
    input: Optional[str] = None
    expected_output: Optional[str] = None
    stdout: Optional[str] = None
    stderr: Optional[str] = None
    compile_output: Optional[str] = None
    execution_time_ms: Optional[float] = None
    memory_kb: Optional[int] = None
    is_hidden: bool = False


class RunCodeResponse(BaseModel):
    verdict: str
    passed: bool
    test_cases_passed: int
    total_test_cases: int
    execution_time_ms: Optional[float] = None
    memory_kb: Optional[int] = None
    error_message: Optional[str] = None
    test_case_results: List[TestCaseResultItem] = Field(default_factory=list)


class SubmitCodeRequest(BaseModel):
    problem_id: str
    source_code: str = Field(..., max_length=65536)
    language: str


class AICodeReviewResponse(BaseModel):
    summary: str
    correctness_observations: str
    strengths: List[str] = Field(default_factory=list)
    improvements: List[str] = Field(default_factory=list)
    potential_edge_cases: List[str] = Field(default_factory=list)
    time_complexity: str
    space_complexity: str
    optimized_approach: Optional[str] = None
    learning_recommendations: List[str] = Field(default_factory=list)
    model: Optional[str] = None


class SubmissionResponse(BaseModel):
    id: str
    user_id: str
    problem_id: str
    problem_title: str
    problem_slug: str
    language: str
    source_code: str
    execution_status: str
    test_cases_passed: int
    total_test_cases: int
    execution_time_ms: Optional[float] = None
    memory_kb: Optional[int] = None
    error_message: Optional[str] = None
    test_case_results: List[TestCaseResultItem] = Field(default_factory=list)
    ai_review: Optional[AICodeReviewResponse] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class SubmissionListResponse(BaseModel):
    items: List[SubmissionResponse]
    total: int
    page: int
    page_size: int
