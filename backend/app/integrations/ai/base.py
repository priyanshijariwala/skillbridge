from abc import ABC, abstractmethod
from typing import Any, Dict


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

