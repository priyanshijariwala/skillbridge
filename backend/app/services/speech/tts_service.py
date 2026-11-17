import logging
from typing import Optional, Tuple
from fastapi import status

from app.core.config import settings
from app.core.errors import AppException
from app.integrations.text_to_speech.base import BaseTTSProvider
from app.integrations.text_to_speech.provider_factory import get_tts_provider
from app.schemas.speech import TTSRequest

logger = logging.getLogger(__name__)


class TextToSpeechService:
    def __init__(self, tts_provider: Optional[BaseTTSProvider] = None) -> None:
        self.tts_provider = tts_provider or get_tts_provider()

    async def synthesize_speech(self, request: TTSRequest) -> Tuple[bytes, str]:
        """
        Validate synthesis request and return generated audio bytes and media type.
        """
        cleaned_text = request.text.strip()
        if not cleaned_text:
            raise AppException(
                status_code=status.HTTP_400_BAD_REQUEST,
                code="EMPTY_TTS_INPUT",
                message="Text to synthesize cannot be empty.",
            )

        if len(cleaned_text) > settings.TTS_MAX_CHARACTERS:
            raise AppException(
                status_code=status.HTTP_400_BAD_REQUEST,
                code="TTS_INPUT_TOO_LONG",
                message=f"Text length exceeds maximum limit of {settings.TTS_MAX_CHARACTERS} characters.",
            )

        logger.info(
            "Synthesizing speech: length=%d chars, voice=%s, speed=%s",
            len(cleaned_text),
            request.voice or "default",
            request.speed or 1.0,
        )

        audio_bytes = await self.tts_provider.synthesize(
            text=cleaned_text,
            voice=request.voice,
            speed=request.speed,
        )

        if not audio_bytes or len(audio_bytes) < 40:
            raise AppException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                code="TTS_GENERATION_FAILED",
                message="Failed to generate valid audio output from speech provider.",
            )

        output_format = getattr(self.tts_provider, "output_format", "mp3")
        media_type = "audio/mpeg" if output_format == "mp3" else "audio/wav"
        return audio_bytes, media_type

