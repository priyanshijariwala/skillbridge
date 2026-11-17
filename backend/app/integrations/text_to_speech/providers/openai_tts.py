import logging
from typing import Optional
from fastapi import status
import httpx

from app.core.errors import AppException
from app.integrations.text_to_speech.base import BaseTTSProvider

logger = logging.getLogger(__name__)


class OpenAITTSProvider(BaseTTSProvider):
    def __init__(
        self,
        api_key: Optional[str] = None,
        model: str = "tts-1",
        default_voice: str = "alloy",
        base_url: Optional[str] = None,
        timeout_seconds: int = 30,
    ) -> None:
        self._api_key = api_key
        self._model = model
        self._default_voice = default_voice
        self._base_url = (base_url or "https://api.openai.com/v1").rstrip("/")
        self._timeout_seconds = timeout_seconds

    @property
    def provider_name(self) -> str:
        return "openai_tts"

    @property
    def model_name(self) -> str:
        return self._model

    @property
    def output_format(self) -> str:
        return "mp3"

    async def synthesize(
        self,
        text: str,
        voice: Optional[str] = None,
        speed: Optional[float] = None,
    ) -> bytes:
        if not self._api_key or not self._api_key.strip():
            logger.error("OpenAITTSProvider invoked without AI_API_KEY configured.")
            raise AppException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                code="TTS_PROVIDER_NOT_CONFIGURED",
                message="Text-to-speech service is not configured. Please set AI_API_KEY.",
            )

        url = f"{self._base_url}/audio/speech"
        headers = {
            "Authorization": f"Bearer {self._api_key.strip()}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": self._model,
            "input": text,
            "voice": voice or self._default_voice,
            "response_format": "mp3",
        }
        if speed is not None:
            payload["speed"] = max(0.5, min(2.0, float(speed)))

        try:
            async with httpx.AsyncClient(timeout=self._timeout_seconds) as client:
                response = await client.post(url, headers=headers, json=payload)

                if response.status_code == status.HTTP_401_UNAUTHORIZED:
                    logger.error("OpenAI TTS authentication failed: Invalid API key.")
                    raise AppException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        code="TTS_AUTH_ERROR",
                        message="Text-to-speech provider authentication failed.",
                    )

                if response.status_code == status.HTTP_429_TOO_MANY_REQUESTS:
                    logger.warning("OpenAI TTS rate limit reached.")
                    raise AppException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        code="TTS_RATE_LIMIT",
                        message="Text-to-speech service is experiencing high load. Please try again.",
                    )

                if response.is_error:
                    logger.error(
                        "OpenAI TTS returned HTTP %d: %s",
                        response.status_code,
                        response.text[:200],
                    )
                    raise AppException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        code="TTS_PROVIDER_ERROR",
                        message="Failed to generate speech audio from provider.",
                    )

                return response.content

        except httpx.TimeoutException:
            logger.error("Timeout during speech synthesis (timeout=%ds).", self._timeout_seconds)
            raise AppException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                code="TTS_TIMEOUT",
                message=f"Speech synthesis timed out after {self._timeout_seconds} seconds.",
            )
        except AppException:
            raise
        except Exception as exc:
            logger.exception("Unexpected error in OpenAI TTS synthesis: %s", exc)
            raise AppException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                code="TTS_COMMUNICATION_ERROR",
                message="Unexpected error communicating with speech synthesis service.",
            )

