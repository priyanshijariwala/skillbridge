from abc import ABC, abstractmethod
from typing import Any, Dict


class BaseSTTProvider(ABC):
    """Abstract interface for Speech-to-Text (STT) transcription providers."""

    @abstractmethod
    async def transcribe(
        self,
        audio_bytes: bytes,
        filename: str,
        content_type: str,
    ) -> Dict[str, Any]:
        """
        Transcribe audio bytes into text.
        Returns dictionary with:
        - text: str
        - duration_seconds: Optional[float]
        - language: Optional[str]
        - confidence: Optional[float]
        """
        ...

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Name of provider (e.g. 'openai_whisper', 'mock')."""
        ...

    @property
    @abstractmethod
    def model_name(self) -> str:
        """Underlying model name (e.g. 'whisper-1')."""
        ...

