from abc import ABC, abstractmethod
from typing import Any, AsyncGenerator, Dict, List, Optional


class BaseAIProvider(ABC):
    """Abstract interface for AI analysis providers."""

    @abstractmethod
    async def generate_json(
        self,
        system_prompt: str,
        user_prompt: str,
    ) -> Dict[str, Any]:
        """
        Send prompt to AI provider and return parsed JSON dictionary response.
        Raises AppException on configuration, timeout, rate limit, or communication errors.
        """
        ...

    async def generate_text(
        self,
        system_prompt: str,
        user_prompt: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        temperature: float = 0.7,
    ) -> str:
        """
        Generate natural language text response.
        Default implementation returns an informative fallback response.
        """
        return "I am your SkillBridge AI Career Assistant. Based on your current profile and career trajectory, I'm here to help you strengthen your competencies, prepare for technical interviews, and achieve your milestones."

    async def generate_stream(
        self,
        system_prompt: str,
        user_prompt: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        temperature: float = 0.7,
    ) -> AsyncGenerator[str, None]:
        """
        Stream natural language text chunks.
        Default implementation yields the complete generated text.
        """
        full_text = await self.generate_text(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            conversation_history=conversation_history,
            temperature=temperature,
        )
        # Yield in natural token-sized chunks
        words = full_text.split(" ")
        for i, word in enumerate(words):
            yield word + (" " if i < len(words) - 1 else "")

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Name of the provider (e.g. 'openai', 'anthropic', 'mock')."""
        ...

    @property
    @abstractmethod
    def model_name(self) -> str:
        """Configured model name (e.g. 'gpt-4o-mini')."""
        ...

