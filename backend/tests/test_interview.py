import pytest
from typing import Any, Dict
from httpx import AsyncClient
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.integrations.ai.base import BaseAIProvider
from app.services.interview.interview_evaluation_service import InterviewEvaluationService
from app.services.interview.interview_feedback_service import InterviewFeedbackService
from app.services.interview.interview_question_service import InterviewQuestionService
from tests.conftest import register_and_login


class MockInterviewAIProvider(BaseAIProvider):
    @property
    def provider_name(self) -> str:
        return "mock"

    @property
    def model_name(self) -> str:
        return "mock-interview-v1"

    async def generate_json(
        self,
        system_prompt: str,
        user_prompt: str,
    ) -> Dict[str, Any]:
        if "experienced technical interviewer" in system_prompt:
            return {
                "question": "Can you explain how the Python GIL impacts concurrency in multithreaded applications?",
                "expected_topics": ["GIL", "CPU-bound vs IO-bound", "multiprocessing"],
                "question_type": "technical",
                "difficulty": "intermediate",
            }
        elif "adaptive technical interviewer" in system_prompt:
            if "Candidate's Answer: Brief answer" in user_prompt:
                return {
                    "decision": "follow_up",
                    "evaluation": {
                        "score": 60,
                        "strengths": ["Recognized that GIL affects threads"],
                        "improvements": ["Did not differentiate between CPU and IO bound workloads"],
                    },
                    "next_question": "How does the GIL behave differently during IO-bound operations such as network calls?",
                    "reason": "Answer lacked depth on IO-bound operations",
                }
            else:
                return {
                    "decision": "next_question",
                    "evaluation": {
                        "score": 88,
                        "strengths": ["Comprehensive explanation of thread synchronization and GIL release"],
                        "improvements": ["Could briefly mention Python 3.13 free-threaded builds"],
                    },
                    "next_question": "How would you design a distributed task queue using Celery and Redis?",
                    "reason": "Candidate provided a thorough explanation; moving to system design",
                }
        elif "senior hiring committee chair" in system_prompt:
            return {
                "overall_score": 85,
                "category_scores": [
                    {"category": "Technical Knowledge", "score": 90, "max_score": 100},
                    {"category": "Problem Solving", "score": 82, "max_score": 100},
                    {"category": "Communication", "score": 84, "max_score": 100},
                ],
                "summary": "Strong candidate with comprehensive knowledge of backend paradigms.",
                "strengths": ["In-depth understanding of concurrency", "Clear communication"],
                "improvements": ["Quantify edge cases and failure modes"],
                "recommended_practice": ["Review distributed consensus algorithms", "Practice system design scalability"],
                "answers_analysis": [
                    {
                        "question": "Explain GIL",
                        "answer": "GIL locks thread execution",
                        "score": 85,
                        "feedback": "Solid answer covering core memory management concepts.",
                    }
                ],
            }
        return {}


# 1. Unit Tests for Services with AI & Fallback
@pytest.mark.asyncio
async def test_question_service_with_ai():
    mock_provider = MockInterviewAIProvider()
    service = InterviewQuestionService(ai_provider=mock_provider)
    q = await service.generate_opening_question(
        role_title="Backend Developer",
        role_description="Build scalable APIs",
        interview_type="technical",
        difficulty="intermediate",
    )
    assert "GIL" in q


@pytest.mark.asyncio
async def test_question_service_fallback():
    class FailingProvider(BaseAIProvider):
        @property
        def provider_name(self) -> str:
            return "failing"

        @property
        def model_name(self) -> str:
            return "failing"

        async def generate_json(self, *args, **kwargs) -> Dict[str, Any]:
            raise RuntimeError("API timeout")

    service = InterviewQuestionService(ai_provider=FailingProvider())
    q = service.get_fallback_question("Backend Developer", "technical", "intermediate", 1)
    assert len(q) > 20
    assert "REST" in q or "APIs" in q or "database" in q


@pytest.mark.asyncio
async def test_evaluation_service_follow_up():
    mock_provider = MockInterviewAIProvider()
    service = InterviewEvaluationService(ai_provider=mock_provider)
    res = await service.evaluate_answer(
        role_title="Backend Developer",
        interview_type="technical",
        difficulty="intermediate",
        current_question_number=1,
        current_follow_up_depth=0,
        max_questions_limit=5,
        max_follow_up_depth=2,
        latest_question="Explain GIL",
        candidate_answer="Brief answer",
        recent_transcript=[],
    )
    assert res["decision"] == "follow_up"
    assert res["evaluation"]["score"] == 60
    assert "IO-bound" in res["next_question"]


@pytest.mark.asyncio
async def test_evaluation_service_depth_limit_enforced():
    """When current_follow_up_depth reaches limit, follow_up must be overridden to next_question or complete."""
    mock_provider = MockInterviewAIProvider()
    service = InterviewEvaluationService(ai_provider=mock_provider)
    res = await service.evaluate_answer(
        role_title="Backend Developer",
        interview_type="technical",
        difficulty="intermediate",
        current_question_number=1,
        current_follow_up_depth=2,
        max_questions_limit=5,
        max_follow_up_depth=2,
        latest_question="Explain GIL",
        candidate_answer="Brief answer",
        recent_transcript=[],
    )
    assert res["decision"] == "next_question"
    assert res["next_question"] is not None


@pytest.mark.asyncio
async def test_feedback_service():
    mock_provider = MockInterviewAIProvider()
    service = InterviewFeedbackService(ai_provider=mock_provider)
    fb = await service.generate_feedback(
        role_title="Backend Developer",
        interview_type="technical",
        difficulty="intermediate",
        duration_minutes=30,
        messages=[
            {"role": "assistant", "content": "Explain GIL"},
            {"role": "user", "content": "GIL locks thread execution"},
        ],
    )
    assert fb["overall_score"] == 85
    assert len(fb["category_scores"]) >= 3
    assert len(fb["strengths"]) > 0


# 2. Integration Tests via Endpoints
@pytest.mark.asyncio
async def test_create_and_manage_interview_flow(
    async_client: AsyncClient,
    test_db: AsyncIOMotorDatabase,
):
    auth_headers = await register_and_login(async_client, email="interview_user@example.com")

    # 1. Create interview session
    create_res = await async_client.post(
        "/api/v1/interviews",
        headers=auth_headers,
        json={
            "target_role_id": "backend-developer",
            "interview_type": "technical",
            "difficulty": "intermediate",
            "duration_minutes": 30,
            "question_limit": 2,
        },
    )
    assert create_res.status_code == 201
    interview_data = create_res.json()
    interview_id = interview_data["id"]
    assert interview_data["status"] == "in_progress"
    assert interview_data["current_question_number"] == 1
    assert interview_data["current_question"] is not None
    q1_id = interview_data["current_question"]["id"]
    assert len(interview_data["current_question"]["content"]) > 10

    # 2. Retrieve interview
    get_res = await async_client.get(
        f"/api/v1/interviews/{interview_id}",
        headers=auth_headers,
    )
    assert get_res.status_code == 200
    assert get_res.json()["id"] == interview_id

    # 3. Retrieve messages
    msg_res = await async_client.get(
        f"/api/v1/interviews/{interview_id}/messages",
        headers=auth_headers,
    )
    assert msg_res.status_code == 200
    messages = msg_res.json()
    assert len(messages) == 1
    assert messages[0]["role"] == "assistant"

    # 4. Submit first answer (detailed)
    ans1_res = await async_client.post(
        f"/api/v1/interviews/{interview_id}/answers",
        headers=auth_headers,
        json={
            "question_id": q1_id,
            "answer": "In our backend architecture we use FastAPI with dependency injection, PostgreSQL for relational data with proper indexes, and Redis for distributed caching. We enforce rate limiting using Redis token bucket.",
        },
    )
    assert ans1_res.status_code == 200
    ans1_data = ans1_res.json()
    assert ans1_data["saved_answer_id"] is not None
    assert ans1_data["evaluation"] is not None
    assert ans1_data["evaluation"]["score"] >= 0

    # 5. Check duplicate answer rejected
    dup_res = await async_client.post(
        f"/api/v1/interviews/{interview_id}/answers",
        headers=auth_headers,
        json={
            "question_id": q1_id,
            "answer": "Second attempt at answering same question.",
        },
    )
    assert dup_res.status_code == 409

    # 6. Check messages transcript has question and answer (and follow-up or next question)
    msg_res2 = await async_client.get(
        f"/api/v1/interviews/{interview_id}/messages",
        headers=auth_headers,
    )
    assert len(msg_res2.json()) >= 2

    # 7. Complete interview manually
    comp_res = await async_client.post(
        f"/api/v1/interviews/{interview_id}/complete",
        headers=auth_headers,
    )
    assert comp_res.status_code == 200
    feedback = comp_res.json()
    assert 0 <= feedback["overall_score"] <= 100
    assert len(feedback["category_scores"]) >= 3
    assert len(feedback["strengths"]) > 0

    # 8. Check that answer on completed interview is rejected
    if ans1_data.get("next_message"):
        post_comp_ans = await async_client.post(
            f"/api/v1/interviews/{interview_id}/answers",
            headers=auth_headers,
            json={
                "question_id": ans1_data["next_message"]["id"],
                "answer": "This should fail because interview is already completed.",
            },
        )
        assert post_comp_ans.status_code == 400

    # 9. Get feedback report endpoint
    fb_res = await async_client.get(
        f"/api/v1/interviews/{interview_id}/feedback",
        headers=auth_headers,
    )
    assert fb_res.status_code == 200
    assert fb_res.json()["interview_id"] == interview_id

    # 10. List interviews
    list_res = await async_client.get(
        "/api/v1/interviews",
        headers=auth_headers,
    )
    assert list_res.status_code == 200
    list_data = list_res.json()
    assert list_data["total"] >= 1
    assert list_data["items"][0]["overall_score"] is not None


@pytest.mark.asyncio
async def test_cross_user_isolation(
    async_client: AsyncClient,
    test_db: AsyncIOMotorDatabase,
):
    auth_a = await register_and_login(async_client, email="user_a@example.com")
    auth_b = await register_and_login(async_client, email="user_b@example.com")

    # User A creates interview
    create_res = await async_client.post(
        "/api/v1/interviews",
        headers=auth_a,
        json={
            "target_role_id": "frontend-developer",
            "interview_type": "technical",
            "difficulty": "intermediate",
        },
    )
    assert create_res.status_code == 201
    interview_id = create_res.json()["id"]

    # User B cannot access User A's interview
    get_res = await async_client.get(
        f"/api/v1/interviews/{interview_id}",
        headers=auth_b,
    )
    assert get_res.status_code == 404

    # User B cannot view messages
    msg_res = await async_client.get(
        f"/api/v1/interviews/{interview_id}/messages",
        headers=auth_b,
    )
    assert msg_res.status_code == 404

    # User B cannot submit answer
    ans_res = await async_client.post(
        f"/api/v1/interviews/{interview_id}/answers",
        headers=auth_b,
        json={
            "question_id": "dummy",
            "answer": "Unauthorized attempt",
        },
    )
    assert ans_res.status_code == 404


@pytest.mark.asyncio
async def test_abandon_interview(
    async_client: AsyncClient,
    test_db: AsyncIOMotorDatabase,
):
    auth_headers = await register_and_login(async_client, email="abandon_user@example.com")

    create_res = await async_client.post(
        "/api/v1/interviews",
        headers=auth_headers,
        json={"target_role_id": "devops-engineer"},
    )
    interview_id = create_res.json()["id"]

    abandon_res = await async_client.patch(
        f"/api/v1/interviews/{interview_id}/abandon",
        headers=auth_headers,
    )
    assert abandon_res.status_code == 200
    assert abandon_res.json()["status"] == "abandoned"
