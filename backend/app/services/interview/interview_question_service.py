import json
import logging
from typing import Any, Dict, List, Optional

from app.integrations.ai.base import BaseAIProvider
from app.integrations.ai.provider_factory import get_ai_provider
from app.services.interview.interview_prompt_service import (
    QUESTION_SYSTEM_PROMPT,
    InterviewPromptService,
)

logger = logging.getLogger(__name__)

# Fallback question bank organized by interview type & keywords
FALLBACK_QUESTIONS: Dict[str, List[Dict[str, Any]]] = {
    "technical": [
        {
            "question": "Can you explain how you design and implement scalable RESTful APIs, including how you handle authentication, error handling, and rate limiting?",
            "expected_topics": ["REST conventions", "JWT/OAuth", "HTTP status codes", "rate limiting"],
        },
        {
            "question": "Walk me through how you optimize database performance in a production application when query latency begins to degrade.",
            "expected_topics": ["indexing", "query execution plans", "connection pooling", "caching"],
        },
        {
            "question": "Describe how you manage state, component rendering, and asynchronous side effects in modern frontend applications.",
            "expected_topics": ["state management", "memoization", "re-render prevention", "lifecycle"],
        },
        {
            "question": "How do you design a robust CI/CD pipeline that balances deployment velocity with test reliability and zero-downtime releases?",
            "expected_topics": ["automated testing", "containerization", "blue-green/canary deployment", "rollbacks"],
        },
        {
            "question": "How would you handle eventual consistency in a distributed system or microservice architecture?",
            "expected_topics": ["message queues", "idempotency", "event-driven architecture", "compensating transactions"],
        },
    ],
    "behavioral": [
        {
            "question": "Tell me about a time you disagreed with an architectural or technical decision made by your team. How did you handle the situation and what was the outcome?",
            "expected_topics": ["communication", "conflict resolution", "STAR method", "pragmatism"],
        },
        {
            "question": "Describe a situation where a critical production bug occurred under tight deadlines. How did you diagnose, resolve, and prevent it from recurring?",
            "expected_topics": ["incident management", "debugging", "post-mortem", "resilience"],
        },
        {
            "question": "Can you share an experience where you had to quickly learn and adopt a new technology or domain to deliver a key project deliverable?",
            "expected_topics": ["adaptability", "growth mindset", "resourcefulness", "initiative"],
        },
    ],
    "hr": [
        {
            "question": "What specifically attracted you to this role, and how does it align with your medium and long-term career aspirations?",
            "expected_topics": ["company interest", "career vision", "motivation", "values alignment"],
        },
        {
            "question": "How do you prioritize competing deadlines and manage communication with non-technical stakeholders when scope changes occur?",
            "expected_topics": ["prioritization", "stakeholder management", "time management", "transparency"],
        },
    ],
    "mixed": [
        {
            "question": "Describe a challenging technical project you led or contributed to significantly. What trade-offs did you face, and how did you keep your team aligned?",
            "expected_topics": ["technical leadership", "architecture trade-offs", "collaboration", "STAR method"],
        },
        {
            "question": "Walk me through how you balance technical debt versus delivering new customer-facing features when planning development sprints.",
            "expected_topics": ["pragmatism", "refactoring strategy", "business value", "communication"],
        },
    ],
}


class InterviewQuestionService:
    def __init__(self, ai_provider: Optional[BaseAIProvider] = None) -> None:
        self.ai_provider = ai_provider

    def _get_provider(self) -> BaseAIProvider:
        if self.ai_provider is not None:
            return self.ai_provider
        return get_ai_provider()

    async def generate_opening_question(
        self,
        role_title: str,
        role_description: str,
        interview_type: str = "technical",
        difficulty: str = "intermediate",
        key_skills: Optional[List[str]] = None,
        candidate_gaps: Optional[List[str]] = None,
    ) -> str:
        """Generates the opening interview question using AI or a deterministic fallback."""
        prompt = InterviewPromptService.build_first_question_prompt(
            role_title=role_title,
            role_description=role_description,
            interview_type=interview_type,
            difficulty=difficulty,
            key_skills=key_skills,
            candidate_gaps=candidate_gaps,
        )

        try:
            provider = self._get_provider()
            data = await provider.generate_json(
                system_prompt=QUESTION_SYSTEM_PROMPT,
                user_prompt=prompt,
            )

            question = data.get("question")
            if question and isinstance(question, str) and len(question.strip()) > 10:
                return question.strip()
        except Exception as e:
            logger.warning("AI generation failed for opening question, using deterministic fallback: %s", e)

        return self.get_fallback_question(role_title, interview_type, difficulty, question_number=1)

    def get_fallback_question(
        self,
        role_title: str,
        interview_type: str = "technical",
        difficulty: str = "intermediate",
        question_number: int = 1,
    ) -> str:
        """Returns a deterministic fallback question tailored to role and type."""
        pool = FALLBACK_QUESTIONS.get(interview_type.lower()) or FALLBACK_QUESTIONS["technical"]
        idx = (question_number - 1) % len(pool)
        base_q = pool[idx]["question"]

        # If it's question 1 for a technical interview, personalize with role title
        if question_number == 1 and interview_type == "technical":
            return f"As a candidate for the {role_title} role, {base_q[0].lower() + base_q[1:]}"
        return base_q
