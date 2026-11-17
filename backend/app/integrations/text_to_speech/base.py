from abc import ABC, abstractmethod
from typing import Optional


class BaseTTSProvider(ABC):
    """Abstract interface for Text-to-Speech (TTS) synthesis providers."""

    @abstractmethod
    async def synthesize(
        self,
        text: str,
        voice: Optional[str] = None,
        speed: Optional[float] = None,
    ) -> bytes:
        """
        Synthesize text into audio bytes (e.g. MP3 format).
        Raises AppException on configuration, timeout, or provider failure.
        """
        ...

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Name of provider (e.g. 'openai_tts', 'mock')."""
        ...

    @property
    @abstractmethod
    def model_name(self) -> str:
        """Underlying model name (e.g. 'tts-1')."""
        ...

    @property
    @abstractmethod
    def output_format(self) -> str:
        """Output media format (e.g. 'mp3', 'wav')."""
        ...

