import logging
from app.core.config import settings
from app.integrations.speech_to_text.base import BaseSTTProvider
from app.integrations.speech_to_text.providers.mock_stt import MockSTTProvider
from app.integrations.speech_to_text.providers.openai_whisper import OpenAIWhisperSTTProvider

logger = logging.getLogger(__name__)


def get_stt_provider() -> BaseSTTProvider:
    """Factory returning configured STT provider with graceful mock fallback."""
    provider_name = (settings.STT_PROVIDER or "openai").lower().strip()

    if provider_name == "mock":
        return MockSTTProvider()

    if provider_name in ("openai", "whisper", "openai_whisper"):
        if not settings.AI_API_KEY:
            logger.info("AI_API_KEY not configured; using MockSTTProvider for speech transcription.")
            return MockSTTProvider()

        return OpenAIWhisperSTTProvider(
            api_key=settings.AI_API_KEY,
            model=settings.STT_MODEL,
            base_url=settings.AI_BASE_URL,
            timeout_seconds=settings.STT_TIMEOUT_SECONDS,
        )

    logger.warning("Unrecognized STT provider '%s', defaulting to MockSTTProvider.", provider_name)
    return MockSTTProvider()

