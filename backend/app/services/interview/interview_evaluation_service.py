import json
import logging
from typing import Any, Dict, List, Optional, Tuple

from app.integrations.ai.base import BaseAIProvider
from app.integrations.ai.provider_factory import get_ai_provider
from app.services.interview.interview_prompt_service import (
    ADAPTIVE_DECISION_SYSTEM_PROMPT,
    InterviewPromptService,
)
from app.services.interview.interview_question_service import InterviewQuestionService

logger = logging.getLogger(__name__)


class InterviewEvaluationService:
    def __init__(self, ai_provider: Optional[BaseAIProvider] = None) -> None:
        self.ai_provider = ai_provider
        self.question_service = InterviewQuestionService(ai_provider=ai_provider)

    def _get_provider(self) -> BaseAIProvider:
        if self.ai_provider is not None:
            return self.ai_provider
        return get_ai_provider()

    async def evaluate_answer(
        self,
        role_title: str,
        interview_type: str,
        difficulty: str,
        current_question_number: int,
        current_follow_up_depth: int,
        max_questions_limit: int,
        max_follow_up_depth: int,
        latest_question: str,
        candidate_answer: str,
        recent_transcript: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Evaluates candidate answer and determines the next adaptive step:
        'follow_up', 'next_question', or 'complete'.
        """
        prompt = InterviewPromptService.build_adaptive_decision_prompt(
            role_title=role_title,
            interview_type=interview_type,
            difficulty=difficulty,
            current_question_number=current_question_number,
            current_follow_up_depth=current_follow_up_depth,
            max_questions_limit=max_questions_limit,
            max_follow_up_depth=max_follow_up_depth,
            latest_question=latest_question,
            candidate_answer=candidate_answer,
            recent_transcript=recent_transcript,
        )

        try:
            provider = self._get_provider()
            data = await provider.generate_json(
                system_prompt=ADAPTIVE_DECISION_SYSTEM_PROMPT,
                user_prompt=prompt,
            )

            return self._normalize_and_validate_decision(
                data=data,
                role_title=role_title,
                interview_type=interview_type,
                difficulty=difficulty,
                current_question_number=current_question_number,
                current_follow_up_depth=current_follow_up_depth,
                max_questions_limit=max_questions_limit,
                max_follow_up_depth=max_follow_up_depth,
            )
        except Exception as e:
            logger.warning("AI evaluation failed, applying deterministic fallback logic: %s", e)
            return self._fallback_evaluation(
                role_title=role_title,
                interview_type=interview_type,
                difficulty=difficulty,
                current_question_number=current_question_number,
                current_follow_up_depth=current_follow_up_depth,
                max_questions_limit=max_questions_limit,
                max_follow_up_depth=max_follow_up_depth,
                candidate_answer=candidate_answer,
            )

    def _normalize_and_validate_decision(
        self,
        data: Dict[str, Any],
        role_title: str,
        interview_type: str,
        difficulty: str,
        current_question_number: int,
        current_follow_up_depth: int,
        max_questions_limit: int,
        max_follow_up_depth: int,
    ) -> Dict[str, Any]:
        raw_decision = str(data.get("decision", "")).strip().lower()
        evaluation_data = data.get("evaluation") or {}
        raw_score = evaluation_data.get("score", 70)
        try:
            score = max(0, min(100, int(raw_score)))
        except (ValueError, TypeError):
            score = 70

        strengths = evaluation_data.get("strengths") or ["Clear structured communication."]
        if not isinstance(strengths, list) or not strengths:
            strengths = ["Structured approach to the problem."]

        improvements = evaluation_data.get("improvements") or ["Could provide deeper architectural details."]
        if not isinstance(improvements, list) or not improvements:
            improvements = ["Provide more specific metrics or trade-offs."]

        next_question = data.get("next_question")

        # Guardrails against illegal AI transitions
        # 1. If AI chose follow_up but max depth already reached:
        if raw_decision == "follow_up" and current_follow_up_depth >= max_follow_up_depth:
            if current_question_number < max_questions_limit:
                raw_decision = "next_question"
                next_question = self.question_service.get_fallback_question(
                    role_title=role_title,
                    interview_type=interview_type,
                    difficulty=difficulty,
                    question_number=current_question_number + 1,
                )
            else:
                raw_decision = "complete"
                next_question = None

        # 2. If AI chose next_question but max question count reached:
        elif raw_decision == "next_question" and current_question_number >= max_questions_limit:
            raw_decision = "complete"
            next_question = None

        # 3. If decision is follow_up but next_question was omitted by AI:
        elif raw_decision == "follow_up" and not next_question:
            next_question = "Could you elaborate on the practical trade-offs and edge cases for that approach?"

        # 4. If decision is next_question but next_question was omitted by AI:
        elif raw_decision == "next_question" and not next_question:
            next_question = self.question_service.get_fallback_question(
                role_title=role_title,
                interview_type=interview_type,
                difficulty=difficulty,
                question_number=current_question_number + 1,
            )

        # 5. Default fallback for unexpected raw_decision
        if raw_decision not in ("follow_up", "next_question", "complete"):
            if current_question_number < max_questions_limit:
                raw_decision = "next_question"
                next_question = self.question_service.get_fallback_question(
                    role_title=role_title,
                    interview_type=interview_type,
                    difficulty=difficulty,
                    question_number=current_question_number + 1,
                )
            else:
                raw_decision = "complete"
                next_question = None

        return {
            "decision": raw_decision,
            "evaluation": {
                "score": score,
                "strengths": [str(s) for s in strengths[:3]],
                "improvements": [str(i) for i in improvements[:3]],
            },
            "next_question": next_question if raw_decision != "complete" else None,
            "reason": data.get("reason", "Automated interview progression evaluation."),
        }

    def _fallback_evaluation(
        self,
        role_title: str,
        interview_type: str,
        difficulty: str,
        current_question_number: int,
        current_follow_up_depth: int,
        max_questions_limit: int,
        max_follow_up_depth: int,
        candidate_answer: str,
    ) -> Dict[str, Any]:
        """Deterministic rule-based fallback when AI is unavailable."""
        word_count = len(candidate_answer.strip().split())

        # Baseline score calculation
        if word_count < 15:
            score = 55
            strengths = ["Prompt and concise initial response."]
            improvements = ["Provide more in-depth explanations and concrete technical examples."]
            needs_follow_up = True
        elif word_count < 40:
            score = 72
            strengths = ["Identified core concepts clearly."]
            improvements = ["Elaborate on edge cases, scaling considerations, or operational trade-offs."]
            needs_follow_up = True
        else:
            score = 85
            strengths = ["Detailed response demonstrating thorough technical understanding."]
            improvements = ["Could mention real-world monitoring or failure-mode handling."]
            needs_follow_up = False

        if needs_follow_up and current_follow_up_depth < max_follow_up_depth:
            decision = "follow_up"
            next_question = "Could you walk through a concrete example or elaborate on the key trade-offs in that scenario?"
        elif current_question_number < max_questions_limit:
            decision = "next_question"
            next_question = self.question_service.get_fallback_question(
                role_title=role_title,
                interview_type=interview_type,
                difficulty=difficulty,
                question_number=current_question_number + 1,
            )
        else:
            decision = "complete"
            next_question = None

        return {
            "decision": decision,
            "evaluation": {
                "score": score,
                "strengths": strengths,
                "improvements": improvements,
            },
            "next_question": next_question,
            "reason": f"Fallback rule evaluation based on response depth (word count: {word_count}).",
        }
