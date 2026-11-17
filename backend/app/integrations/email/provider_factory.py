from app.core.config import settings
from app.integrations.email.base import BaseEmailProvider
from app.integrations.email.mock_provider import mock_email_instance
from app.integrations.email.smtp_provider import SmtpEmailProvider


def get_email_provider() -> BaseEmailProvider:
    provider_name = (settings.EMAIL_PROVIDER or "mock").lower().strip()
    if provider_name == "smtp":
        return SmtpEmailProvider()
    return mock_email_instance

