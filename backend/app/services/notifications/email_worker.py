import asyncio
import logging
from typing import Any, Dict, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.config import settings
from app.integrations.email.base import BaseEmailProvider
from app.integrations.email.provider_factory import get_email_provider
from app.repositories.email_log_repository import EmailLogRepository

logger = logging.getLogger(__name__)


class EmailWorker:
    """
    Asynchronous transactional email dispatcher with persistent audit logging,
    bounded exponential backoff for transient failures, and fail-safe idempotency.
    """

    def __init__(
        self,
        db: AsyncIOMotorDatabase,
        provider: Optional[BaseEmailProvider] = None,
    ) -> None:
        self.db = db
        self.provider = provider or get_email_provider()
        self.log_repo = EmailLogRepository(db)

    async def send_transactional_email(
        self,
        user_id: str,
        to_email: str,
        template: str,
        subject: str,
        html_content: str,
        text_content: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> str:
        """
        Creates an email_log entry and executes delivery with bounded retries.
        Returns the log_id.
        """
        log_entry = await self.log_repo.create({
            "user_id": user_id,
            "recipient_email": to_email,
            "template": template,
            "subject": subject,
            "status": "pending",
            "provider": self.provider.provider_name,
            "metadata": metadata or {},
        })
        log_id = log_entry["id"]

        max_retries = max(1, settings.EMAIL_MAX_RETRIES)
        base_backoff = max(0.1, settings.EMAIL_RETRY_BACKOFF_SECONDS)
        attempt = 0
        last_error: Optional[str] = None

        while attempt < max_retries:
            attempt += 1
            try:
                result = await self.provider.send_email(
                    to_email=to_email,
                    subject=subject,
                    html_content=html_content,
                    text_content=text_content,
                )

                if result.success:
                    await self.log_repo.update_status(
                        log_id=log_id,
                        status="sent",
                        attempt_count=attempt,
                        provider_message_id=result.message_id,
                        last_error=None,
                    )
                    logger.info("Email '%s' to %s successfully delivered on attempt %d", subject, to_email, attempt)
                    return log_id

                last_error = result.error_message or "Email provider rejected message"
                if not result.is_transient:
                    # Permanent failure, do not retry
                    logger.warning("Permanent failure sending email '%s' to %s: %s", subject, to_email, last_error)
                    break

                logger.warning(
                    "Transient failure sending email '%s' to %s (attempt %d/%d): %s",
                    subject,
                    to_email,
                    attempt,
                    max_retries,
                    last_error,
                )
            except Exception as e:
                last_error = str(e)
                logger.error("Exception during email dispatch to %s (attempt %d): %s", to_email, attempt, last_error)

            if attempt < max_retries:
                backoff = base_backoff * (2 ** (attempt - 1))
                await asyncio.sleep(backoff)

        # Record final failed status
        await self.log_repo.update_status(
            log_id=log_id,
            status="failed",
            attempt_count=attempt,
            last_error=last_error,
        )
        logger.error("Email '%s' to %s permanently failed after %d attempts: %s", subject, to_email, attempt, last_error)
        return log_id

