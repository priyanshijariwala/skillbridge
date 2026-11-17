import logging
from app.core.config import settings
from app.integrations.ai.base import BaseAIProvider
from app.integrations.ai.providers.mock_provider import MockAIProvider
from app.integrations.ai.providers.openai_provider import OpenAIProvider

logger = logging.getLogger(__name__)


def get_ai_provider() -> BaseAIProvider:
    """
    Factory function returning the configured AI provider instance.
    Falls back gracefully to MockAIProvider when AI_API_KEY is not configured or mock is chosen.
    """
    provider_name = settings.AI_PROVIDER.lower().strip()
    if provider_name == "mock" or not settings.AI_API_KEY:
        if not settings.AI_API_KEY and provider_name != "mock":
            logger.info("AI_API_KEY not set; using MockAIProvider.")
        return MockAIProvider()

    return OpenAIProvider(
        api_key=settings.AI_API_KEY,
        model=settings.AI_MODEL,
        base_url=settings.AI_BASE_URL,
        timeout_seconds=settings.AI_TIMEOUT_SECONDS,
    )

