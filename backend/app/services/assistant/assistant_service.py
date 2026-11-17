import json
import logging
from datetime import datetime, timezone
from typing import Any, AsyncGenerator, Dict, List, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.errors import AppException
from app.integrations.ai.base import BaseAIProvider
from app.integrations.ai.provider_factory import get_ai_provider
from app.repositories.chat_conversation_repository import ChatConversationRepository
from app.repositories.chat_message_repository import ChatMessageRepository
from app.schemas.assistant import (
    ChatMessageListResponse,
    ChatMessageResponse,
    ContextSummaryResponse,
    ConversationListResponse,
    ConversationResponse,
)
from app.services.assistant.assistant_prompt_service import AssistantPromptService
from app.services.assistant.context_retrieval_service import ContextRetrievalService

logger = logging.getLogger(__name__)


class AssistantService:
    def __init__(
        self,
        db: AsyncIOMotorDatabase,
        ai_provider: Optional[BaseAIProvider] = None,
    ) -> None:
        self.db = db
        self.conversation_repo = ChatConversationRepository(db)
        self.message_repo = ChatMessageRepository(db)
        self.context_service = ContextRetrievalService(db)
        self.ai_provider = ai_provider or get_ai_provider()

    async def create_conversation(
        self, user_id: str, title: Optional[str] = None
    ) -> ConversationResponse:
        default_title = title.strip() if title and title.strip() else "New Career Conversation"
        doc = await self.conversation_repo.create({
            "user_id": user_id,
            "title": default_title,
            "status": "active",
        })
        return ConversationResponse.model_validate(doc)

    async def list_conversations(
        self,
        user_id: str,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> ConversationListResponse:
        skip = (page - 1) * page_size
        total = await self.conversation_repo.count_by_user(user_id=user_id, search=search)
        docs = await self.conversation_repo.list_by_user(
            user_id=user_id, search=search, skip=skip, limit=page_size
        )
        return ConversationListResponse(
            items=[ConversationResponse.model_validate(d) for d in docs],
            total=total,
            page=page,
            page_size=page_size,
        )

    async def get_conversation(
        self, conversation_id: str, user_id: str
    ) -> ConversationResponse:
        conv = await self.conversation_repo.find_by_id_and_user(conversation_id, user_id)
        if not conv:
            raise AppException(
                status_code=404,
                code="CONVERSATION_NOT_FOUND",
                message=f"Conversation '{conversation_id}' was not found.",
            )
        return ConversationResponse.model_validate(conv)

    async def rename_conversation(
        self, conversation_id: str, user_id: str, new_title: str
    ) -> ConversationResponse:
        clean_title = new_title.strip()
        if not clean_title:
            raise AppException(
                status_code=400,
                code="INVALID_TITLE",
                message="Conversation title cannot be empty.",
            )

        updated = await self.conversation_repo.update(
            conversation_id, user_id, {"title": clean_title}
        )
        if not updated:
            raise AppException(
                status_code=404,
                code="CONVERSATION_NOT_FOUND",
                message=f"Conversation '{conversation_id}' was not found.",
            )
        return ConversationResponse.model_validate(updated)

    async def delete_conversation(self, conversation_id: str, user_id: str) -> bool:
        success = await self.conversation_repo.delete(conversation_id, user_id)
        if not success:
            raise AppException(
                status_code=404,
                code="CONVERSATION_NOT_FOUND",
                message=f"Conversation '{conversation_id}' was not found.",
            )
        # Delete associated messages
        await self.message_repo.delete_by_conversation(conversation_id)
        return True

    async def list_messages(
        self,
        conversation_id: str,
        user_id: str,
        skip: int = 0,
        limit: int = 100,
    ) -> ChatMessageListResponse:
        # Verify ownership
        await self.get_conversation(conversation_id, user_id)

        total = await self.message_repo.count_by_conversation(conversation_id)
        docs = await self.message_repo.list_by_conversation(
            conversation_id=conversation_id, skip=skip, limit=limit, ascending=True
        )
        return ChatMessageListResponse(
            items=[ChatMessageResponse.model_validate(d) for d in docs],
            total=total,
            conversation_id=conversation_id,
        )

    async def get_context_summary(self, user_id: str) -> ContextSummaryResponse:
        context_data = await self.context_service.get_user_context(user_id)
        sources = context_data.get("sources", {})
        return ContextSummaryResponse(
            profile_available=sources.get("profile_available", False),
            resume_available=sources.get("resume_available", False),
            skill_gap_available=sources.get("skill_gap_available", False),
            roadmap_available=sources.get("roadmap_available", False),
            interview_available=sources.get("interview_available", False),
            target_role=context_data.get("target_role"),
            user_name=context_data.get("user_name"),
        )

    async def send_message(
        self, conversation_id: str, user_id: str, message_text: str
    ) -> ChatMessageResponse:
        """
        Process user message, retrieve context, query AI provider, persist, and return response.
        """
        cleaned_text = message_text.strip()
        if not cleaned_text:
            raise AppException(
                status_code=400,
                code="EMPTY_MESSAGE",
                message="Message content cannot be empty.",
            )

        # 1. Verify conversation ownership
        conv = await self.get_conversation(conversation_id, user_id)

        # 2. Persist user message
        now = datetime.now(timezone.utc)
        user_msg = await self.message_repo.create({
            "conversation_id": conversation_id,
            "user_id": user_id,
            "role": "user",
            "content": cleaned_text,
            "message_type": "text",
            "created_at": now,
        })

        # 3. Auto-update title if it's the first message
        new_title = None
        if conv.title == "New Career Conversation":
            new_title = AssistantPromptService.generate_conversation_title(cleaned_text)

        await self.conversation_repo.update_last_message_at(
            conversation_id=conversation_id,
            user_id=user_id,
            timestamp=now,
            new_title=new_title,
        )

        # 4. Retrieve user context & recent conversation turns
        user_context = await self.context_service.get_user_context(user_id)
        history = await self.message_repo.get_recent_history(conversation_id, limit=8)

        # Exclude the current message from history if already present
        filtered_history = [
            m for m in history if not (m.get("role") == "user" and m.get("content") == cleaned_text)
        ]

        # 5. Build prompt with persona & context
        system_prompt = AssistantPromptService.build_system_prompt_with_context(
            user_context.get("context_text", "")
        )

        # 6. Generate AI response
        try:
            assistant_text = await self.ai_provider.generate_text(
                system_prompt=system_prompt,
                user_prompt=cleaned_text,
                conversation_history=filtered_history,
                temperature=0.7,
            )
        except Exception as e:
            logger.error("Failed to generate response from AI provider: %s", e)
            # Fallback message preserves user message and provides helpful response
            assistant_text = (
                "I apologize, but I encountered a momentary connection issue. "
                "However, based on your profile context, I recommend reviewing your target role competencies "
                "and continuing with your next learning roadmap tasks. Please feel free to retry your question."
            )

        # 7. Persist assistant response
        assistant_msg = await self.message_repo.create({
            "conversation_id": conversation_id,
            "user_id": user_id,
            "role": "assistant",
            "content": assistant_text,
            "message_type": "text",
            "context_metadata": {
                "sources_included": [
                    k for k, v in user_context.get("sources", {}).items() if v
                ],
                "model": getattr(self.ai_provider, "model_name", "unknown"),
            },
            "created_at": datetime.now(timezone.utc),
        })

        return ChatMessageResponse.model_validate(assistant_msg)

    async def stream_message(
        self, conversation_id: str, user_id: str, message_text: str
    ) -> AsyncGenerator[str, None]:
        """
        Generate and yield Server-Sent Events (SSE) chunks while persisting complete response.
        """
        cleaned_text = message_text.strip()
        if not cleaned_text:
            yield f"data: {json.dumps({'error': 'Message cannot be empty'})}\n\n"
            return

        conv = await self.get_conversation(conversation_id, user_id)

        now = datetime.now(timezone.utc)
        await self.message_repo.create({
            "conversation_id": conversation_id,
            "user_id": user_id,
            "role": "user",
            "content": cleaned_text,
            "message_type": "text",
            "created_at": now,
        })

        new_title = None
        if conv.title == "New Career Conversation":
            new_title = AssistantPromptService.generate_conversation_title(cleaned_text)

        await self.conversation_repo.update_last_message_at(
            conversation_id=conversation_id,
            user_id=user_id,
            timestamp=now,
            new_title=new_title,
        )

        user_context = await self.context_service.get_user_context(user_id)
        history = await self.message_repo.get_recent_history(conversation_id, limit=8)
        filtered_history = [
            m for m in history if not (m.get("role") == "user" and m.get("content") == cleaned_text)
        ]

        system_prompt = AssistantPromptService.build_system_prompt_with_context(
            user_context.get("context_text", "")
        )

        accumulated_chunks: List[str] = []
        try:
            async for chunk in self.ai_provider.generate_stream(
                system_prompt=system_prompt,
                user_prompt=cleaned_text,
                conversation_history=filtered_history,
                temperature=0.7,
            ):
                accumulated_chunks.append(chunk)
                yield f"data: {json.dumps({'chunk': chunk})}\n\n"
        except Exception as e:
            logger.error("Error during assistant streaming: %s", e)
            fallback = " An issue occurred while generating the complete response. Please refresh or retry."
            accumulated_chunks.append(fallback)
            yield f"data: {json.dumps({'chunk': fallback})}\n\n"

        complete_response = "".join(accumulated_chunks).strip()
        if complete_response:
            # Persist the finalized assistant message
            saved_assistant = await self.message_repo.create({
                "conversation_id": conversation_id,
                "user_id": user_id,
                "role": "assistant",
                "content": complete_response,
                "message_type": "text",
                "context_metadata": {
                    "sources_included": [
                        k for k, v in user_context.get("sources", {}).items() if v
                    ],
                    "model": getattr(self.ai_provider, "model_name", "unknown"),
                },
                "created_at": datetime.now(timezone.utc),
            })
            yield f"data: {json.dumps({'done': True, 'message_id': saved_assistant['id']})}\n\n"
            yield "data: [DONE]\n\n"
        else:
            yield f"data: {json.dumps({'done': True})}\n\n"
            yield "data: [DONE]\n\n"
