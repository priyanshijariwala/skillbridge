import json
import logging
from typing import Any, Dict, List, Optional

from app.integrations.ai.base import BaseAIProvider
from app.integrations.ai.provider_factory import get_ai_provider
from app.services.interview.interview_prompt_service import (
    FEEDBACK_SYSTEM_PROMPT,
    InterviewPromptService,
)

logger = logging.getLogger(__name__)


class InterviewFeedbackService:
    def __init__(self, ai_provider: Optional[BaseAIProvider] = None) -> None:
        self.ai_provider = ai_provider

    def _get_provider(self) -> BaseAIProvider:
        if self.ai_provider is not None:
            return self.ai_provider
        return get_ai_provider()

    async def generate_feedback(
        self,
        role_title: str,
        interview_type: str,
        difficulty: str,
        duration_minutes: int,
        messages: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Generates full post-interview evaluation report using AI or deterministic fallback.
        """
        prompt = InterviewPromptService.build_feedback_prompt(
            role_title=role_title,
            interview_type=interview_type,
            difficulty=difficulty,
            duration_minutes=duration_minutes,
            full_transcript=messages,
        )

        try:
            provider = self._get_provider()
            data = await provider.generate_json(
                system_prompt=FEEDBACK_SYSTEM_PROMPT,
                user_prompt=prompt,
            )

            return self._normalize_feedback_data(data, messages, role_title)
        except Exception as e:
            logger.warning("AI feedback generation failed, generating fallback evaluation: %s", e)
            return self._fallback_feedback(
                role_title=role_title,
                interview_type=interview_type,
                difficulty=difficulty,
                messages=messages,
            )

    def _normalize_feedback_data(
        self,
        data: Dict[str, Any],
        messages: List[Dict[str, Any]],
        role_title: str,
    ) -> Dict[str, Any]:
        overall_score = data.get("overall_score", 75)
        try:
            overall_score = max(0, min(100, int(overall_score)))
        except (ValueError, TypeError):
            overall_score = 75

        raw_categories = data.get("category_scores") or []
        categories = []
        for cat in raw_categories:
            if isinstance(cat, dict) and "category" in cat and "score" in cat:
                try:
                    score = max(0, min(100, int(cat["score"])))
                    categories.append({
                        "category": str(cat["category"]),
                        "score": score,
                        "max_score": 100,
                    })
                except (ValueError, TypeError):
                    continue

        if not categories:
            categories = [
                {"category": "Technical Knowledge", "score": overall_score, "max_score": 100},
                {"category": "Problem Solving", "score": max(0, overall_score - 5), "max_score": 100},
                {"category": "Communication", "score": min(100, overall_score + 5), "max_score": 100},
            ]

        summary = str(data.get("summary") or f"Completed mock interview for {role_title} demonstrating solid foundation.").strip()
        strengths = [str(s) for s in data.get("strengths") or ["Clear conceptual understanding.", "Logical response structure."]]
        improvements = [str(i) for i in data.get("improvements") or ["Explore edge cases more thoroughly.", "Quantify performance impacts."]]
        recommended_practice = [str(p) for p in data.get("recommended_practice") or [f"Deepen hands-on practice in {role_title} system design.", "Practice STAR method responses."]]

        raw_answers_analysis = data.get("answers_analysis") or []
        answers_analysis = []
        for item in raw_answers_analysis:
            if isinstance(item, dict) and "question" in item and "answer" in item:
                try:
                    score = max(0, min(100, int(item.get("score", 70))))
                except (ValueError, TypeError):
                    score = 70
                answers_analysis.append({
                    "question": str(item["question"]),
                    "answer": str(item["answer"]),
                    "score": score,
                    "feedback": str(item.get("feedback") or "Good answer addressing key parts of the question."),
                })

        # If AI didn't return answers_analysis, construct it from transcript
        if not answers_analysis:
            answers_analysis = self._pair_qa_from_messages(messages)

        return {
            "overall_score": overall_score,
            "category_scores": categories,
            "summary": summary,
            "strengths": strengths,
            "improvements": improvements,
            "recommended_practice": recommended_practice,
            "answers_analysis": answers_analysis,
        }

    def _pair_qa_from_messages(self, messages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        pairs: List[Dict[str, Any]] = []
        last_question = ""
        for m in messages:
            role = m.get("role")
            content = m.get("content", "")
            if role == "assistant":
                last_question = content
            elif role == "user" and last_question:
                eval_data = m.get("evaluation") or {}
                score = eval_data.get("score", 75)
                feedback = "; ".join(eval_data.get("strengths", [])) or "Answer addressed core concepts."
                pairs.append({
                    "question": last_question,
                    "answer": content,
                    "score": score,
                    "feedback": feedback,
                })
        return pairs

    def _fallback_feedback(
        self,
        role_title: str,
        interview_type: str,
        difficulty: str,
        messages: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """Deterministic fallback when AI report generation fails."""
        qa_pairs = self._pair_qa_from_messages(messages)

        if qa_pairs:
            scores = [p["score"] for p in qa_pairs]
            avg_score = round(sum(scores) / len(scores))
        else:
            avg_score = 75

        category_scores = [
            {"category": "Technical Knowledge", "score": avg_score, "max_score": 100},
            {"category": "Problem Solving", "score": max(0, avg_score - 4), "max_score": 100},
            {"category": "Communication", "score": min(100, avg_score + 4), "max_score": 100},
        ]
        if interview_type in ("behavioral", "mixed", "hr"):
            category_scores.append({"category": "Behavioral Competency", "score": avg_score, "max_score": 100})

        return {
            "overall_score": avg_score,
            "category_scores": category_scores,
            "summary": f"Completed mock interview session for {role_title} ({interview_type.capitalize()}, {difficulty.capitalize()} level). Demonstrated foundational competencies with clear opportunities for refinement in architecture and trade-off evaluation.",
            "strengths": [
                "Good clarity and responsive communication during the session.",
                f"Demonstrated solid familiarity with core principles required for {role_title}.",
                "Handled sequential questioning constructively.",
            ],
            "improvements": [
                "Incorporate more quantitative metrics and architectural trade-offs.",
                "Structure answers with the STAR method or clear upfront problem framing.",
                "Deepen discussion of potential failure modes and recovery procedures.",
            ],
            "recommended_practice": [
                f"Review advanced production patterns and system design for {role_title}.",
                "Practice high-pressure technical interview problem breakdowns.",
                "Simulate behavioral interviews focusing on production incidents and conflict resolution.",
            ],
            "answers_analysis": qa_pairs,
        }
