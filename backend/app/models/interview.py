from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional


@dataclass
class InterviewSettingsInDB:
    main_question_limit: int = 5
    follow_up_limit_per_question: int = 2
    duration_minutes: int = 30


@dataclass
class InterviewInDB:
    user_id: str
    target_role_id: str
    target_role_title: str
    interview_type: str  # "technical", "behavioral", "hr", "mixed"
    difficulty: str  # "beginner", "intermediate", "advanced" (or "junior", "mid", "senior")
    mode: str = "text"
    status: str = "in_progress"  # "created", "in_progress", "completed", "abandoned"
    settings: Dict[str, Any] = field(default_factory=dict)
    current_question_number: int = 1
    current_follow_up_depth: int = 0
    current_question_id: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


@dataclass
class InterviewMessageInDB:
    user_id: str
    interview_id: str
    sequence: int
    role: str  # "assistant" | "user"
    message_type: str  # "question" | "answer" | "follow_up"
    content: str
    parent_message_id: Optional[str] = None
    question_number: int = 1
    follow_up_depth: int = 0
    evaluation: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None


@dataclass
class CategoryScoreInDB:
    category: str
    score: int
    max_score: int = 100


@dataclass
class AnswerAnalysisInDB:
    question: str
    answer: str
    score: int
    feedback: str


@dataclass
class InterviewFeedbackInDB:
    user_id: str
    interview_id: str
    overall_score: int
    category_scores: List[Dict[str, Any]] = field(default_factory=list)
    summary: str = ""
    strengths: List[str] = field(default_factory=list)
    improvements: List[str] = field(default_factory=list)
    recommended_practice: List[str] = field(default_factory=list)
    answers_analysis: List[Dict[str, Any]] = field(default_factory=list)
    created_at: Optional[datetime] = None

