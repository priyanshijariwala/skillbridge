import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.errors import AppException
from app.integrations.ai.base import BaseAIProvider
from app.repositories.interview_feedback_repository import InterviewFeedbackRepository
from app.repositories.interview_message_repository import InterviewMessageRepository
from app.repositories.interview_repository import InterviewRepository
from app.repositories.job_role_repository import JobRoleRepository
from app.repositories.resume_analysis_repository import ResumeAnalysisRepository
from app.repositories.skill_gap_repository import SkillGapRepository
from app.schemas.interview import (
    InterviewAnswerRequest,
    InterviewAnswerResponse,
    InterviewCreateRequest,
    InterviewFeedbackResponse,
    InterviewListItemDTO,
    InterviewListResponse,
    InterviewMessageDTO,
    InterviewResponse,
    InterviewSettingsDTO,
)
from app.services.interview.interview_evaluation_service import InterviewEvaluationService
from app.services.interview.interview_feedback_service import InterviewFeedbackService
from app.services.interview.interview_question_service import InterviewQuestionService

logger = logging.getLogger(__name__)


class InterviewSessionService:
    def __init__(
        self,
        db: AsyncIOMotorDatabase,
        ai_provider: Optional[BaseAIProvider] = None,
    ) -> None:
        self.db = db
        self.interview_repo = InterviewRepository(db)
        self.message_repo = InterviewMessageRepository(db)
        self.feedback_repo = InterviewFeedbackRepository(db)
        self.job_role_repo = JobRoleRepository(db)
        self.resume_analysis_repo = ResumeAnalysisRepository(db)
        self.skill_gap_repo = SkillGapRepository(db)

        self.question_service = InterviewQuestionService(ai_provider=ai_provider)
        self.evaluation_service = InterviewEvaluationService(ai_provider=ai_provider)
        self.feedback_service = InterviewFeedbackService(ai_provider=ai_provider)

    async def create_interview(
        self, user_id: str, request: InterviewCreateRequest
    ) -> InterviewResponse:
        """Create a new interview session and generate the initial opening question."""
        # 1. Validate target job role
        role = await self.job_role_repo.find_by_id(request.target_role_id)
        if not role:
            role = await self.job_role_repo.find_by_slug(request.target_role_id)
        if not role:
            raise AppException(
                status_code=404,
                code="ROLE_NOT_FOUND",
                message=f"Target job role '{request.target_role_id}' not found.",
            )

        role_title = role.get("title", "Software Engineer")
        role_description = role.get("description", "")
        key_skills = [
            s.get("name") if isinstance(s, dict) else str(s)
            for s in role.get("required_skills", [])[:6]
        ]

        # 2. Extract candidate gap areas if available from latest skill gap analysis
        candidate_gaps: List[str] = []
        try:
            gap_analysis = await self.skill_gap_repo.find_latest_by_user(user_id)
            if gap_analysis and gap_analysis.get("missing_skills"):
                candidate_gaps = [
                    s.get("name") if isinstance(s, dict) else str(s)
                    for s in gap_analysis["missing_skills"][:4]
                ]
        except Exception as e:
            logger.debug("Could not fetch user skill gap context: %s", e)

        # 3. Generate first opening question
        opening_question = await self.question_service.generate_opening_question(
            role_title=role_title,
            role_description=role_description,
            interview_type=request.interview_type,
            difficulty=request.difficulty,
            key_skills=key_skills,
            candidate_gaps=candidate_gaps,
        )

        # 4. Settings configuration
        main_question_limit = request.question_limit or 5
        duration_minutes = request.duration_minutes
        settings = {
            "main_question_limit": main_question_limit,
            "follow_up_limit_per_question": 2,
            "duration_minutes": duration_minutes,
        }

        # 5. Insert interview document
        now = datetime.now(timezone.utc)
        interview_doc = await self.interview_repo.create({
            "user_id": user_id,
            "target_role_id": str(role.get("id", request.target_role_id)),
            "target_role_title": role_title,
            "interview_type": request.interview_type,
            "difficulty": request.difficulty,
            "mode": request.mode or "text",
            "status": "in_progress",
            "settings": settings,
            "current_question_number": 1,
            "current_follow_up_depth": 0,
            "started_at": now,
        })
        interview_id = interview_doc["id"]

        # 6. Insert first message (assistant opening question)
        first_message = await self.message_repo.create({
            "user_id": user_id,
            "interview_id": interview_id,
            "sequence": 1,
            "role": "assistant",
            "message_type": "question",
            "content": opening_question,
            "question_number": 1,
            "follow_up_depth": 0,
            "parent_message_id": None,
        })

        # Update interview with current question ID
        interview_doc = await self.interview_repo.update(
            interview_id, user_id, {"current_question_id": first_message["id"]}
        )

        return self._build_interview_response(interview_doc, first_message)

    async def get_interview(self, interview_id: str, user_id: str) -> InterviewResponse:
        """Get interview session details scoped to user."""
        interview = await self.interview_repo.find_by_id_and_user(interview_id, user_id)
        if not interview:
            raise AppException(
                status_code=404,
                code="INTERVIEW_NOT_FOUND",
                message=f"Interview session '{interview_id}' not found.",
            )

        current_q = None
        if interview.get("current_question_id"):
            current_q = await self.message_repo.find_by_id(interview["current_question_id"])

        return self._build_interview_response(interview, current_q)

    async def get_messages(self, interview_id: str, user_id: str) -> List[InterviewMessageDTO]:
        """Get ordered transcript messages for an interview session."""
        interview = await self.interview_repo.find_by_id_and_user(interview_id, user_id)
        if not interview:
            raise AppException(
                status_code=404,
                code="INTERVIEW_NOT_FOUND",
                message=f"Interview session '{interview_id}' not found.",
            )
        raw_messages = await self.message_repo.list_by_interview(interview_id)
        return [InterviewMessageDTO.model_validate(m) for m in raw_messages]

    async def submit_answer(
        self, interview_id: str, user_id: str, request: InterviewAnswerRequest
    ) -> InterviewAnswerResponse:
        """Submit candidate answer, evaluate adaptively, and advance session."""
        # 1. Fetch & validate interview
        interview = await self.interview_repo.find_by_id_and_user(interview_id, user_id)
        if not interview:
            raise AppException(
                status_code=404,
                code="INTERVIEW_NOT_FOUND",
                message=f"Interview session '{interview_id}' not found.",
            )

        if interview.get("status") != "in_progress":
            raise AppException(
                status_code=400,
                code="INTERVIEW_NOT_ACTIVE",
                message=f"Interview is {interview.get('status')} and cannot accept new answers.",
            )

        # 2. Fetch & validate question being answered
        target_question = await self.message_repo.find_by_id_and_interview(
            request.question_id, interview_id
        )
        if not target_question or target_question.get("role") != "assistant":
            raise AppException(
                status_code=404,
                code="QUESTION_NOT_FOUND",
                message=f"Target question '{request.question_id}' not found in this interview session.",
            )

        # 3. Duplicate answer check (idempotency)
        existing_answer = await self.message_repo.find_answer_for_question(
            interview_id, request.question_id
        )
        if existing_answer:
            raise AppException(
                status_code=409,
                code="ANSWER_ALREADY_SUBMITTED",
                message="An answer has already been submitted for this question.",
            )

        # 4. Save user answer message
        saved_answer = await self.message_repo.create({
            "user_id": user_id,
            "interview_id": interview_id,
            "role": "user",
            "message_type": "answer",
            "content": request.answer.strip(),
            "parent_message_id": request.question_id,
            "question_number": target_question.get("question_number", 1),
            "follow_up_depth": target_question.get("follow_up_depth", 0),
        })

        # 5. Fetch full conversation transcript for context
        all_messages = await self.message_repo.list_by_interview(interview_id)

        # 6. Run adaptive evaluation
        settings = interview.get("settings", {})
        max_questions_limit = settings.get("main_question_limit", 5)
        max_follow_up_depth = settings.get("follow_up_limit_per_question", 2)

        eval_result = await self.evaluation_service.evaluate_answer(
            role_title=interview.get("target_role_title", "Software Engineer"),
            interview_type=interview.get("interview_type", "technical"),
            difficulty=interview.get("difficulty", "intermediate"),
            current_question_number=target_question.get("question_number", 1),
            current_follow_up_depth=target_question.get("follow_up_depth", 0),
            max_questions_limit=max_questions_limit,
            max_follow_up_depth=max_follow_up_depth,
            latest_question=target_question.get("content", ""),
            candidate_answer=request.answer.strip(),
            recent_transcript=all_messages,
        )

        # 7. Persist evaluation on the answer message
        evaluation_data = eval_result.get("evaluation")
        if evaluation_data:
            await self.message_repo.update_evaluation(saved_answer["id"], evaluation_data)

        decision = eval_result.get("decision", "next_question")

        # 8. Process Decision
        if decision == "follow_up":
            next_follow_up_depth = target_question.get("follow_up_depth", 0) + 1
            follow_up_msg = await self.message_repo.create({
                "user_id": user_id,
                "interview_id": interview_id,
                "role": "assistant",
                "message_type": "follow_up",
                "content": eval_result.get("next_question", "Could you elaborate further?"),
                "question_number": target_question.get("question_number", 1),
                "follow_up_depth": next_follow_up_depth,
                "parent_message_id": saved_answer["id"],
            })

            await self.interview_repo.update(
                interview_id,
                user_id,
                {
                    "current_question_id": follow_up_msg["id"],
                    "current_follow_up_depth": next_follow_up_depth,
                },
            )

            return InterviewAnswerResponse(
                saved_answer_id=saved_answer["id"],
                evaluation=evaluation_data,
                next_message=InterviewMessageDTO.model_validate(follow_up_msg),
                interview_status="in_progress",
                is_completed=False,
                message="Follow-up question generated.",
            )

        elif decision == "next_question":
            next_q_num = target_question.get("question_number", 1) + 1
            next_q_msg = await self.message_repo.create({
                "user_id": user_id,
                "interview_id": interview_id,
                "role": "assistant",
                "message_type": "question",
                "content": eval_result.get("next_question", "Let's move on to the next topic."),
                "question_number": next_q_num,
                "follow_up_depth": 0,
                "parent_message_id": None,
            })

            await self.interview_repo.update(
                interview_id,
                user_id,
                {
                    "current_question_id": next_q_msg["id"],
                    "current_question_number": next_q_num,
                    "current_follow_up_depth": 0,
                },
            )

            return InterviewAnswerResponse(
                saved_answer_id=saved_answer["id"],
                evaluation=evaluation_data,
                next_message=InterviewMessageDTO.model_validate(next_q_msg),
                interview_status="in_progress",
                is_completed=False,
                message="Next question generated.",
            )

        else:
            # decision == "complete"
            now = datetime.now(timezone.utc)
            await self.interview_repo.update(
                interview_id,
                user_id,
                {
                    "status": "completed",
                    "completed_at": now,
                    "current_question_id": None,
                },
            )

            # Generate and persist final feedback report
            await self._finalize_feedback(interview_id, user_id, interview)

            return InterviewAnswerResponse(
                saved_answer_id=saved_answer["id"],
                evaluation=evaluation_data,
                next_message=None,
                interview_status="completed",
                is_completed=True,
                message="Interview completed! Evaluation report has been generated.",
            )

    async def complete_interview(
        self, interview_id: str, user_id: str
    ) -> InterviewFeedbackResponse:
        """Manually finalize session and generate feedback report."""
        interview = await self.interview_repo.find_by_id_and_user(interview_id, user_id)
        if not interview:
            raise AppException(
                status_code=404,
                code="INTERVIEW_NOT_FOUND",
                message=f"Interview session '{interview_id}' not found.",
            )

        if interview.get("status") == "abandoned":
            raise AppException(
                status_code=400,
                code="INTERVIEW_ABANDONED",
                message="Cannot complete an abandoned interview session.",
            )

        now = datetime.now(timezone.utc)
        if interview.get("status") != "completed":
            await self.interview_repo.update(
                interview_id,
                user_id,
                {
                    "status": "completed",
                    "completed_at": now,
                    "current_question_id": None,
                },
            )

        feedback_doc = await self._finalize_feedback(interview_id, user_id, interview)
        return InterviewFeedbackResponse.model_validate(feedback_doc)

    async def abandon_interview(
        self, interview_id: str, user_id: str
    ) -> InterviewResponse:
        """Mark interview session as abandoned."""
        interview = await self.interview_repo.find_by_id_and_user(interview_id, user_id)
        if not interview:
            raise AppException(
                status_code=404,
                code="INTERVIEW_NOT_FOUND",
                message=f"Interview session '{interview_id}' not found.",
            )

        updated = await self.interview_repo.update(
            interview_id,
            user_id,
            {
                "status": "abandoned",
                "completed_at": datetime.now(timezone.utc),
            },
        )
        return self._build_interview_response(updated, None)

    async def get_feedback(
        self, interview_id: str, user_id: str
    ) -> InterviewFeedbackResponse:
        """Retrieve feedback report for an interview session."""
        interview = await self.interview_repo.find_by_id_and_user(interview_id, user_id)
        if not interview:
            raise AppException(
                status_code=404,
                code="INTERVIEW_NOT_FOUND",
                message=f"Interview session '{interview_id}' not found.",
            )

        feedback = await self.feedback_repo.find_by_interview_id_and_user(interview_id, user_id)
        if not feedback:
            if interview.get("status") == "completed":
                # Generate missing feedback on-the-fly
                feedback = await self._finalize_feedback(interview_id, user_id, interview)
            else:
                raise AppException(
                    status_code=400,
                    code="INTERVIEW_NOT_COMPLETED",
                    message="Feedback report is only available after interview completion.",
                )

        return InterviewFeedbackResponse.model_validate(feedback)

    async def list_interviews(
        self,
        user_id: str,
        status: Optional[str] = None,
        interview_type: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> InterviewListResponse:
        """List user's interviews with score enrichment."""
        skip = (page - 1) * page_size
        total = await self.interview_repo.count_by_user(user_id, status, interview_type)
        docs = await self.interview_repo.list_by_user(
            user_id=user_id,
            status=status,
            interview_type=interview_type,
            skip=skip,
            limit=page_size,
        )

        items: List[InterviewListItemDTO] = []
        for d in docs:
            overall_score = None
            if d.get("status") == "completed":
                fb = await self.feedback_repo.find_by_interview_id_and_user(d["id"], user_id)
                if fb:
                    overall_score = fb.get("overall_score")

            settings = d.get("settings") or {}
            items.append(
                InterviewListItemDTO(
                    id=d["id"],
                    target_role_title=d.get("target_role_title", "Software Engineer"),
                    interview_type=d.get("interview_type", "technical"),
                    difficulty=d.get("difficulty", "intermediate"),
                    status=d.get("status", "in_progress"),
                    duration_minutes=settings.get("duration_minutes", 30),
                    overall_score=overall_score,
                    started_at=d.get("started_at"),
                    completed_at=d.get("completed_at"),
                    created_at=d.get("created_at"),
                )
            )

        return InterviewListResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
        )

    async def _finalize_feedback(
        self, interview_id: str, user_id: str, interview_doc: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate and save interview feedback if not already created."""
        existing = await self.feedback_repo.find_by_interview_id_and_user(interview_id, user_id)
        if existing:
            return existing

        all_messages = await self.message_repo.list_by_interview(interview_id)
        settings = interview_doc.get("settings") or {}
        duration = settings.get("duration_minutes", 30)

        feedback_data = await self.feedback_service.generate_feedback(
            role_title=interview_doc.get("target_role_title", "Software Engineer"),
            interview_type=interview_doc.get("interview_type", "technical"),
            difficulty=interview_doc.get("difficulty", "intermediate"),
            duration_minutes=duration,
            messages=all_messages,
        )

        feedback_doc = await self.feedback_repo.create({
            "user_id": user_id,
            "interview_id": interview_id,
            **feedback_data,
        })
        return feedback_doc

    def _build_interview_response(
        self, interview: Dict[str, Any], current_q: Optional[Dict[str, Any]]
    ) -> InterviewResponse:
        settings_raw = interview.get("settings") or {}
        settings = InterviewSettingsDTO(
            main_question_limit=settings_raw.get("main_question_limit", 5),
            follow_up_limit_per_question=settings_raw.get("follow_up_limit_per_question", 2),
            duration_minutes=settings_raw.get("duration_minutes", 30),
        )

        q_dto = InterviewMessageDTO.model_validate(current_q) if current_q else None

        return InterviewResponse(
            id=interview["id"],
            target_role_id=interview.get("target_role_id", ""),
            target_role_title=interview.get("target_role_title", ""),
            interview_type=interview.get("interview_type", "technical"),
            difficulty=interview.get("difficulty", "intermediate"),
            mode=interview.get("mode", "text"),
            status=interview.get("status", "in_progress"),
            settings=settings,
            current_question_number=interview.get("current_question_number", 1),
            current_follow_up_depth=interview.get("current_follow_up_depth", 0),
            current_question=q_dto,
            started_at=interview.get("started_at"),
            completed_at=interview.get("completed_at"),
            created_at=interview.get("created_at"),
        )

