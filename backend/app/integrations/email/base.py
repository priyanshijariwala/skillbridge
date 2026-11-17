from abc import ABC, abstractmethod
from typing import Optional
from pydantic import BaseModel


class EmailDeliveryResult(BaseModel):
    success: bool
    provider: str
    message_id: Optional[str] = None
    error_message: Optional[str] = None
    is_transient: bool = False


class BaseEmailProvider(ABC):
    @property
    @abstractmethod
    def provider_name(self) -> str:
        pass

    @abstractmethod
    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: str,
    ) -> EmailDeliveryResult:
        pass

