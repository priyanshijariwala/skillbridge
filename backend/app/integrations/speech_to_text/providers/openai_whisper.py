import logging
from typing import Any, Dict, Optional
from fastapi import status
import httpx

from app.core.errors import AppException
from app.integrations.speech_to_text.base import BaseSTTProvider

logger = logging.getLogger(__name__)


class OpenAIWhisperSTTProvider(BaseSTTProvider):
    def __init__(
        self,
        api_key: Optional[str] = None,
        model: str = "whisper-1",
        base_url: Optional[str] = None,
        timeout_seconds: int = 30,
    ) -> None:
        self._api_key = api_key
        self._model = model
        self._base_url = (base_url or "https://api.openai.com/v1").rstrip("/")
        self._timeout_seconds = timeout_seconds

    @property
    def provider_name(self) -> str:
        return "openai_whisper"

    @property
    def model_name(self) -> str:
        return self._model

    async def transcribe(
        self,
        audio_bytes: bytes,
        filename: str,
        content_type: str,
    ) -> Dict[str, Any]:
        if not self._api_key or not self._api_key.strip():
            logger.error("OpenAIWhisperSTTProvider invoked without AI_API_KEY configured.")
            raise AppException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                code="STT_PROVIDER_NOT_CONFIGURED",
                message="Speech-to-text service is not configured. Please set AI_API_KEY.",
            )

        url = f"{self._base_url}/audio/transcriptions"
        headers = {
            "Authorization": f"Bearer {self._api_key.strip()}",
        }

        files = {
            "file": (filename, audio_bytes, content_type),
        }
        data = {
            "model": self._model,
            "response_format": "verbose_json",
        }

        try:
            async with httpx.AsyncClient(timeout=self._timeout_seconds) as client:
                response = await client.post(
                    url,
                    headers=headers,
                    data=data,
                    files=files,
                )

                if response.status_code == status.HTTP_401_UNAUTHORIZED:
                    logger.error("OpenAI Whisper authentication failed: Invalid API key.")
                    raise AppException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        code="STT_AUTH_ERROR",
                        message="Speech-to-text provider authentication failed.",
                    )

                if response.status_code == status.HTTP_429_TOO_MANY_REQUESTS:
                    logger.warning("OpenAI Whisper rate limit reached.")
                    raise AppException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        code="STT_RATE_LIMIT",
                        message="Speech transcription service is experiencing high load. Please try again.",
                    )

                if response.is_error:
                    logger.error(
                        "OpenAI Whisper returned HTTP %d: %s",
                        response.status_code,
                        response.text[:200],
                    )
                    raise AppException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        code="STT_PROVIDER_ERROR",
                        message="Failed to transcribe audio from speech provider.",
                    )

                result = response.json()
                text = result.get("text", "").strip()
                duration = result.get("duration")
                language = result.get("language")

                return {
                    "text": text,
                    "duration_seconds": float(duration) if duration is not None else None,
                    "language": language,
                    "confidence": 0.95 if text else 0.0,
                }

        except httpx.TimeoutException:
            logger.error("Timeout during speech transcription (timeout=%ds).", self._timeout_seconds)
            raise AppException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                code="STT_TIMEOUT",
                message=f"Speech transcription timed out after {self._timeout_seconds} seconds.",
            )
        except AppException:
            raise
        except Exception as exc:
            logger.exception("Unexpected error in OpenAI Whisper transcription: %s", exc)
            raise AppException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                code="STT_COMMUNICATION_ERROR",
                message="Unexpected error communicating with speech transcription service.",
            )

