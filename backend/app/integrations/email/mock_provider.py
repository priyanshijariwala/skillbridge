import logging
import uuid
from typing import Any, Dict, List, Optional
from app.integrations.email.base import BaseEmailProvider, EmailDeliveryResult

logger = logging.getLogger(__name__)


class MockEmailProvider(BaseEmailProvider):
    """
    In-memory mock email provider for local development, tests, and CI.
    Stores dispatched messages for assertion and allows simulating delivery failures.
    """

    def __init__(self) -> None:
        self.sent_emails: List[Dict[str, Any]] = []
        self._simulate_failure: Optional[str] = None
        self._simulate_transient: bool = False

    @property
    def provider_name(self) -> str:
        return "mock"

    def simulate_failure(self, error_message: str, is_transient: bool = False) -> None:
        self._simulate_failure = error_message
        self._simulate_transient = is_transient

    def clear(self) -> None:
        self.sent_emails.clear()
        self._simulate_failure = None
        self._simulate_transient = False

    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: str,
    ) -> EmailDeliveryResult:
        if self._simulate_failure:
            err = self._simulate_failure
            transient = self._simulate_transient
            logger.warning("Mock email provider simulating failure to %s: %s", to_email, err)
            return EmailDeliveryResult(
                success=False,
                provider=self.provider_name,
                error_message=err,
                is_transient=transient,
            )

        msg_id = f"mock-msg-{uuid.uuid4().hex[:12]}"
        email_record = {
            "message_id": msg_id,
            "to_email": to_email,
            "subject": subject,
            "html_content": html_content,
            "text_content": text_content,
        }
        self.sent_emails.append(email_record)
        logger.info("Mock email successfully dispatched to %s with subject: %s (id: %s)", to_email, subject, msg_id)

        return EmailDeliveryResult(
            success=True,
            provider=self.provider_name,
            message_id=msg_id,
        )


# Global singleton instance for testing assertions
mock_email_instance = MockEmailProvider()

