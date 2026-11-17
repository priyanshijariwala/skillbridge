import logging
from app.core.config import settings
from app.integrations.text_to_speech.base import BaseTTSProvider
from app.integrations.text_to_speech.providers.mock_tts import MockTTSProvider
from app.integrations.text_to_speech.providers.openai_tts import OpenAITTSProvider

logger = logging.getLogger(__name__)


def get_tts_provider() -> BaseTTSProvider:
    """Factory returning configured TTS provider with graceful mock fallback."""
    provider_name = (settings.TTS_PROVIDER or "openai").lower().strip()

    if provider_name == "mock":
        return MockTTSProvider()

    if provider_name in ("openai", "openai_tts"):
        if not settings.AI_API_KEY:
            logger.info("AI_API_KEY not configured; using MockTTSProvider for speech synthesis.")
            return MockTTSProvider()

        return OpenAITTSProvider(
            api_key=settings.AI_API_KEY,
            model=settings.TTS_MODEL,
            default_voice=settings.TTS_VOICE,
            base_url=settings.AI_BASE_URL,
            timeout_seconds=settings.TTS_TIMEOUT_SECONDS,
        )

    logger.warning("Unrecognized TTS provider '%s', defaulting to MockTTSProvider.", provider_name)
    return MockTTSProvider()

