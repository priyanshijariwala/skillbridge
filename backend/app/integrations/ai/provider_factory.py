import logging
from app.core.config import settings
from app.integrations.ai.base import BaseAIProvider
from app.integrations.ai.providers.openai_provider import OpenAIProvider

logger = logging.getLogger(__name__)


def get_ai_provider() -> BaseAIProvider:
    """
    Factory function returning the configured AI provider instance.
    Can be replaced or extended to support other providers (Anthropic, Gemini, etc.).
    """
    provider_name = settings.AI_PROVIDER.lower().strip()
    if provider_name == "openai":
        return OpenAIProvider(
            api_key=settings.AI_API_KEY,
            model=settings.AI_MODEL,
            base_url=settings.AI_BASE_URL,
            timeout_seconds=settings.AI_TIMEOUT_SECONDS,
        )

    # Fallback to OpenAI provider interface if custom provider configured
    logger.info("Using OpenAIProvider for provider: %s", provider_name)
    return OpenAIProvider(
        api_key=settings.AI_API_KEY,
        model=settings.AI_MODEL,
        base_url=settings.AI_BASE_URL,
        timeout_seconds=settings.AI_TIMEOUT_SECONDS,
    )

