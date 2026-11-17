import asyncio
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import logging
import smtplib
import uuid
from typing import Optional
from app.core.config import settings
from app.integrations.email.base import BaseEmailProvider, EmailDeliveryResult

logger = logging.getLogger(__name__)


class SmtpEmailProvider(BaseEmailProvider):
    """
    Production-ready SMTP email provider utilizing standard Python smtplib run in an executor thread.
    Supports STARTTLS and authenticated SMTP transport.
    """

    def __init__(
        self,
        host: Optional[str] = None,
        port: Optional[int] = None,
        username: Optional[str] = None,
        password: Optional[str] = None,
        use_tls: Optional[bool] = None,
        from_address: Optional[str] = None,
        from_name: Optional[str] = None,
    ) -> None:
        self.host = host or settings.SMTP_HOST
        self.port = port or settings.SMTP_PORT
        self.username = username or settings.SMTP_USERNAME
        self.password = password or settings.SMTP_PASSWORD
        self.use_tls = use_tls if use_tls is not None else settings.SMTP_USE_TLS
        self.from_address = from_address or settings.EMAIL_FROM_ADDRESS
        self.from_name = from_name or settings.EMAIL_FROM_NAME

    @property
    def provider_name(self) -> str:
        return "smtp"

    def _sync_send(self, to_email: str, subject: str, html_content: str, text_content: str) -> str:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{self.from_name} <{self.from_address}>"
        msg["To"] = to_email
        msg_id = f"smtp-{uuid.uuid4().hex[:12]}"
        msg["Message-ID"] = f"<{msg_id}@{self.host}>"

        part1 = MIMEText(text_content, "plain", "utf-8")
        part2 = MIMEText(html_content, "html", "utf-8")
        msg.attach(part1)
        msg.attach(part2)

        server = smtplib.SMTP(self.host, self.port, timeout=10.0)
        try:
            if self.use_tls:
                server.starttls()
            if self.username and self.password:
                server.login(self.username, self.password)
            server.sendmail(self.from_address, [to_email], msg.as_string())
        finally:
            try:
                server.quit()
            except Exception:
                pass

        return msg_id

    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: str,
    ) -> EmailDeliveryResult:
        try:
            msg_id = await asyncio.to_thread(
                self._sync_send, to_email, subject, html_content, text_content
            )
            return EmailDeliveryResult(
                success=True,
                provider=self.provider_name,
                message_id=msg_id,
            )
        except (smtplib.SMTPConnectError, smtplib.SMTPServerDisconnected, TimeoutError, OSError) as e:
            logger.warning("Transient SMTP failure sending to %s: %s", to_email, str(e))
            return EmailDeliveryResult(
                success=False,
                provider=self.provider_name,
                error_message=str(e),
                is_transient=True,
            )
        except Exception as e:
            logger.error("Permanent SMTP failure sending to %s: %s", to_email, str(e), exc_info=True)
            return EmailDeliveryResult(
                success=False,
                provider=self.provider_name,
                error_message=str(e),
                is_transient=False,
            )

