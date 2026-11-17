from datetime import datetime
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator

InterviewType = Literal["technical", "behavioral", "hr", "mixed"]
InterviewDifficulty = Literal["beginner", "intermediate", "advanced", "junior", "mid", "senior"]
InterviewStatus = Literal["created", "in_progress", "completed", "abandoned"]
MessageRole = Literal["assistant", "user"]
MessageType = Literal["question", "answer", "follow_up"]


class InterviewSettingsDTO(BaseModel):
    main_question_limit: int = Field(default=5, ge=1, le=15)
    follow_up_limit_per_question: int = Field(default=2, ge=0, le=4)
    duration_minutes: int = Field(default=30, ge=10, le=120)


class InterviewCreateRequest(BaseModel):
    target_role_id: str = Field(..., description="Target Job Role ID or Slug")
    interview_type: InterviewType = "technical"
    difficulty: InterviewDifficulty = "intermediate"
    duration_minutes: int = Field(default=30, ge=10, le=120)
    question_limit: Optional[int] = Field(None, ge=1, le=15)
    mode: Literal["text", "voice"] = "text"

    @field_validator("difficulty", mode="before")
    @classmethod
    def normalize_difficulty(cls, v: str) -> str:
        mapping = {
            "junior": "beginner",
            "mid": "intermediate",
            "senior": "advanced",
        }
        val = str(v).lower().strip()
        return mapping.get(val, val)


class InterviewMessageDTO(BaseModel):
    id: str
    interview_id: str
    sequence: int
    role: MessageRole
    message_type: MessageType
    content: str
    question_number: int
    follow_up_depth: int
    parent_message_id: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class AnswerEvaluationDTO(BaseModel):
    score: int = Field(ge=0, le=100)
    strengths: List[str] = Field(default_factory=list)
    improvements: List[str] = Field(default_factory=list)


class InterviewResponse(BaseModel):
    id: str
    target_role_id: str
    target_role_title: str
    interview_type: InterviewType
    difficulty: str
    mode: str = "text"
    status: InterviewStatus
    settings: InterviewSettingsDTO
    current_question_number: int
    current_follow_up_depth: int
    current_question: Optional[InterviewMessageDTO] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class InterviewAnswerRequest(BaseModel):
    question_id: str = Field(..., description="ID of the question being answered")
    answer: str = Field(..., min_length=2, max_length=10000, description="Candidate response text")


class InterviewAnswerResponse(BaseModel):
    saved_answer_id: str
    evaluation: Optional[AnswerEvaluationDTO] = None
    next_message: Optional[InterviewMessageDTO] = None
    interview_status: InterviewStatus
    is_completed: bool = False
    message: Optional[str] = None


class CategoryScoreDTO(BaseModel):
    category: str
    score: int = Field(ge=0, le=100)
    max_score: int = 100


class AnswerAnalysisItemDTO(BaseModel):
    question: str
    answer: str
    score: int = Field(ge=0, le=100)
    feedback: str


class InterviewFeedbackResponse(BaseModel):
    id: str
    interview_id: str
    overall_score: int = Field(ge=0, le=100)
    category_scores: List[CategoryScoreDTO] = Field(default_factory=list)
    summary: str
    strengths: List[str] = Field(default_factory=list)
    improvements: List[str] = Field(default_factory=list)
    recommended_practice: List[str] = Field(default_factory=list)
    answers_analysis: List[AnswerAnalysisItemDTO] = Field(default_factory=list)
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class InterviewListItemDTO(BaseModel):
    id: str
    target_role_title: str
    interview_type: str
    difficulty: str
    status: str
    duration_minutes: int
    overall_score: Optional[int] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class InterviewListResponse(BaseModel):
    items: List[InterviewListItemDTO]
    total: int
    page: int
    page_size: int

