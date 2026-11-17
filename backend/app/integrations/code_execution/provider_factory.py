import logging
from app.core.config import settings
from app.integrations.code_execution.base import BaseCodeExecutionProvider
from app.integrations.code_execution.providers.judge0_provider import Judge0ExecutionProvider
from app.integrations.code_execution.providers.mock_provider import MockExecutionProvider

logger = logging.getLogger(__name__)


def get_execution_provider() -> BaseCodeExecutionProvider:
    """
    Factory function returning the configured code execution sandbox provider.
    Defaults to MockExecutionProvider for tests/offline development or when JUDGE0_URL is unreachable.
    """
    provider_name = settings.CODE_EXECUTION_PROVIDER.lower().strip()

    if provider_name == "judge0" and settings.JUDGE0_URL:
        return Judge0ExecutionProvider(
            base_url=settings.JUDGE0_URL,
            api_key=settings.JUDGE0_API_KEY,
            auth_token=settings.JUDGE0_AUTH_TOKEN,
            timeout_seconds=settings.CODE_EXECUTION_TIMEOUT_SECONDS,
        )

    return MockExecutionProvider()
