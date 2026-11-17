from typing import Any, Dict, Optional
from app.integrations.speech_to_text.base import BaseSTTProvider


class MockSTTProvider(BaseSTTProvider):
    def __init__(
        self,
        canned_text: Optional[str] = None,
        duration_seconds: float = 8.5,
        language: str = "en",
    ) -> None:
        self._canned_text = canned_text
        self._duration_seconds = duration_seconds
        self._language = language

    @property
    def provider_name(self) -> str:
        return "mock_stt"

    @property
    def model_name(self) -> str:
        return "mock-whisper-v1"

    async def transcribe(
        self,
        audio_bytes: bytes,
        filename: str,
        content_type: str,
    ) -> Dict[str, Any]:
        text = self._canned_text or (
            "In our architecture, we use FastAPI with dependency injection and PostgreSQL for persistence. "
            "To prevent race conditions during rate limiting, we execute token bucket increments atomically using Redis Lua scripts."
        )
        return {
            "text": text,
            "duration_seconds": self._duration_seconds,
            "language": self._language,
            "confidence": 0.98,
        }

