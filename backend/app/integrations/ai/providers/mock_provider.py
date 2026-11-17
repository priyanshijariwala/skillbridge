import json
from typing import Any, AsyncGenerator, Dict, List, Optional
from app.integrations.ai.base import BaseAIProvider


class MockAIProvider(BaseAIProvider):
    """
    Intelligent simulated AI provider for development, tests, and offline execution.
    Generates realistic career guidance responses tailored to user queries.
    """

    def __init__(self, canned_response: Optional[str] = None) -> None:
        self._canned_response = canned_response

    @property
    def provider_name(self) -> str:
        return "mock"

    @property
    def model_name(self) -> str:
        return "mock-career-assistant-v1"

    async def generate_json(
        self,
        system_prompt: str,
        user_prompt: str,
    ) -> Dict[str, Any]:
        from app.core.errors import AppException
        from fastapi import status
        raise AppException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            code="AI_PROVIDER_NOT_CONFIGURED",
            message="MockAIProvider does not provide arbitrary JSON; activating deterministic fallback.",
        )

    async def generate_text(
        self,
        system_prompt: str,
        user_prompt: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        temperature: float = 0.7,
    ) -> str:
        if self._canned_response:
            return self._canned_response

        lower_query = user_prompt.lower()

        if "skill" in lower_query or "gap" in lower_query:
            return (
                "Based on your latest skill-gap analysis, your highest-priority growth areas are "
                "containerization with Docker, scalable REST API architecture, and distributed caching with Redis. "
                "I recommend focusing on hands-on project milestones that demonstrate these skills in production scenarios."
            )
        elif "roadmap" in lower_query or "learn" in lower_query:
            return (
                "Looking at your active learning roadmap, your next recommended milestone focuses on "
                "building asynchronous microservices with FastAPI and database indexing in PostgreSQL. "
                "Allocating 5–6 hours this week will keep you right on schedule to achieve your target milestone."
            )
        elif "interview" in lower_query or "mock" in lower_query:
            return (
                "Reviewing your recent mock interview feedback, you demonstrated strong conceptual understanding "
                "of system architectures. To increase your benchmark rating, practice articulating concurrency trade-offs, "
                "edge-case failure modes, and using the STAR method for behavioral scenarios."
            )
        elif "resume" in lower_query:
            return (
                "From your resume analysis, your core technical experience is well-highlighted. "
                "To make your resume even more compelling to recruiters, quantify your impact with concrete metrics "
                "(e.g., latency reduction percentages, query throughput, or test coverage improvements)."
            )
        elif "project" in lower_query:
            return (
                "Here is an impactful portfolio project tailored to your missing competencies: "
                "Build a Distributed Task Queue & Rate-Limiter service using FastAPI, Redis token buckets, and Docker. "
                "This directly validates backend scalability, concurrency handling, and container deployment."
            )
        else:
            return (
                "Hello! As your SkillBridge AI Career Assistant, I'm here to support your career growth. "
                "I have context from your target role, resume analysis, skill gaps, learning roadmap, and mock interviews. "
                "How can I help you prepare or optimize your technical journey today?"
            )

    async def generate_stream(
        self,
        system_prompt: str,
        user_prompt: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        temperature: float = 0.7,
    ) -> AsyncGenerator[str, None]:
        full_text = await self.generate_text(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            conversation_history=conversation_history,
            temperature=temperature,
        )
        words = full_text.split(" ")
        for i, word in enumerate(words):
            yield word + (" " if i < len(words) - 1 else "")
