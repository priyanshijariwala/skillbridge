import json
import logging
from typing import Any, Dict, Optional
from fastapi import status
import httpx

from app.core.errors import AppException
from app.integrations.ai.base import BaseAIProvider

logger = logging.getLogger(__name__)


class OpenAIProvider(BaseAIProvider):
    def __init__(
        self,
        api_key: Optional[str] = None,
        model: str = "gpt-4o-mini",
        base_url: Optional[str] = None,
        timeout_seconds: int = 60,
    ) -> None:
        self._api_key = api_key
        self._model = model
        self._base_url = (base_url or "https://api.openai.com/v1").rstrip("/")
        self._timeout_seconds = timeout_seconds

    @property
    def provider_name(self) -> str:
        return "openai"

    @property
    def model_name(self) -> str:
        return self._model

    async def generate_json(
        self,
        system_prompt: str,
        user_prompt: str,
    ) -> Dict[str, Any]:
        if not self._api_key or not self._api_key.strip():
            logger.error("OpenAIProvider invoked but AI_API_KEY is not configured.")
            raise AppException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                code="AI_PROVIDER_NOT_CONFIGURED",
                message="AI analysis provider is not configured. Please set AI_API_KEY in backend configuration.",
            )

        url = f"{self._base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self._api_key.strip()}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self._model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.2,
        }

        try:
            async with httpx.AsyncClient(timeout=self._timeout_seconds) as client:
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()
        except httpx.TimeoutException:
            logger.warning("OpenAI API request timed out after %d seconds.", self._timeout_seconds)
            raise AppException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                code="AI_GATEWAY_TIMEOUT",
                message="The AI analysis request timed out. Please try again.",
            )
        except httpx.HTTPStatusError as e:
            status_code = e.response.status_code
            logger.warning("OpenAI API returned error HTTP %d: %s", status_code, e.response.text[:200])

            if status_code in (401, 403):
                raise AppException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    code="AI_AUTHENTICATION_ERROR",
                    message="AI provider authentication failed. Please verify the configured API credentials.",
                )
            if status_code == 429:
                raise AppException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    code="AI_RATE_LIMIT_EXCEEDED",
                    message="AI provider rate limit reached. Please wait a moment and try again.",
                )
            if status_code >= 500:
                raise AppException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    code="AI_SERVICE_UNAVAILABLE",
                    message="The AI service is currently unavailable. Please try again later.",
                )
            raise AppException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                code="AI_PROVIDER_ERROR",
                message="An error occurred while communicating with the AI service.",
            )
        except Exception as e:
            logger.error("Unexpected error contacting OpenAI API: %s", e)
            raise AppException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                code="AI_CONNECTION_ERROR",
                message="Could not establish connection to the AI analysis provider.",
            )

        # Parse the JSON output from message content
        try:
            choices = data.get("choices", [])
            if not choices:
                raise ValueError("No choices in OpenAI response")
            content_str = choices[0]["message"]["content"]
            parsed_json = json.loads(content_str)
            if not isinstance(parsed_json, dict):
                raise ValueError("Parsed content is not a JSON object")
            return parsed_json
        except (KeyError, json.JSONDecodeError, ValueError) as e:
            logger.error("Failed to parse JSON response from OpenAI: %s", e)
            raise AppException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                code="INVALID_AI_RESPONSE",
                message="The AI provider returned an invalid response structure.",
            )

