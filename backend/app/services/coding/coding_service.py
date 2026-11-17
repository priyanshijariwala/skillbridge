import logging
from typing import Any, Dict, List, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.errors import AppException
from app.integrations.code_execution.service import CodeExecutionService
from app.repositories.code_submission_repository import CodeSubmissionRepository
from app.repositories.coding_problem_repository import CodingProblemRepository
from app.schemas.coding import (
    AICodeReviewResponse,
    ProblemDetailResponse,
    ProblemListItemResponse,
    ProblemListResponse,
    RunCodeRequest,
    RunCodeResponse,
    SubmissionListResponse,
    SubmissionResponse,
    SubmitCodeRequest,
)
from app.services.coding.code_review_service import CodeReviewService

logger = logging.getLogger(__name__)


class CodingService:
    def __init__(
        self,
        db: AsyncIOMotorDatabase,
        execution_service: Optional[CodeExecutionService] = None,
        review_service: Optional[CodeReviewService] = None,
    ) -> None:
        self.db = db
        self.problem_repo = CodingProblemRepository(db)
        self.submission_repo = CodeSubmissionRepository(db)
        self.execution_service = execution_service or CodeExecutionService()
        self.review_service = review_service or CodeReviewService()

    async def list_problems(
        self,
        user_id: str,
        difficulty: Optional[str] = None,
        category: Optional[str] = None,
        topic: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> ProblemListResponse:
        docs, total = await self.problem_repo.list_problems(
            difficulty=difficulty,
            category=category,
            topic=topic,
            search=search,
            page=page,
            page_size=page_size,
        )

        solved_ids = await self.submission_repo.get_user_solved_problem_ids(user_id)

        items = [
            ProblemListItemResponse(
                id=doc["id"],
                title=doc["title"],
                slug=doc["slug"],
                difficulty=doc["difficulty"],
                category=doc["category"],
                topics=doc.get("topics", []),
                is_solved=doc["id"] in solved_ids or doc["slug"] in solved_ids,
            )
            for doc in docs
        ]

        return ProblemListResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
        )

    async def get_problem(self, problem_id: str, user_id: str) -> ProblemDetailResponse:
        doc = await self.problem_repo.find_by_id(problem_id)
        if not doc or not doc.get("is_active", True):
            raise AppException(
                status_code=404,
                code="PROBLEM_NOT_FOUND",
                message=f"Coding problem '{problem_id}' not found.",
            )

        solved_ids = await self.submission_repo.get_user_solved_problem_ids(user_id)
        is_solved = doc["id"] in solved_ids or doc["slug"] in solved_ids

        # Never return hidden test cases
        sample_cases = [
            {"input": tc["input"], "expected_output": tc["expected_output"]}
            for tc in doc.get("sample_test_cases", [])
        ]

        return ProblemDetailResponse(
            id=doc["id"],
            title=doc["title"],
            slug=doc["slug"],
            description=doc["description"],
            difficulty=doc["difficulty"],
            category=doc["category"],
            topics=doc.get("topics", []),
            constraints=doc.get("constraints", []),
            examples=doc.get("examples", []),
            sample_test_cases=sample_cases,
            supported_languages=doc.get("supported_languages", []),
            starter_code=doc.get("starter_code", {}),
            is_solved=is_solved,
        )

    async def run_code(self, user_id: str, payload: RunCodeRequest) -> RunCodeResponse:
        problem = await self.problem_repo.find_by_id(payload.problem_id)
        if not problem:
            raise AppException(
                status_code=404,
                code="PROBLEM_NOT_FOUND",
                message="Problem not found.",
            )

        if payload.custom_stdin is not None:
            test_cases = [{
                "input": payload.custom_stdin,
                "expected_output": "",
                "is_hidden": False,
            }]
        else:
            test_cases = [
                {
                    "input": tc.get("input", ""),
                    "expected_output": tc.get("expected_output", ""),
                    "is_hidden": False,
                }
                for tc in problem.get("sample_test_cases", [])
            ]

        results = await self.execution_service.execute_test_cases(
            source_code=payload.source_code,
            language=payload.language,
            test_cases=test_cases,
            is_sample_only=True,
        )

        return RunCodeResponse(**results)

    async def submit_solution(self, user_id: str, payload: SubmitCodeRequest) -> SubmissionResponse:
        problem = await self.problem_repo.find_by_id(payload.problem_id)
        if not problem:
            raise AppException(
                status_code=404,
                code="PROBLEM_NOT_FOUND",
                message="Problem not found.",
            )

        sample_cases = [
            {
                "input": tc.get("input", ""),
                "expected_output": tc.get("expected_output", ""),
                "is_hidden": False,
            }
            for tc in problem.get("sample_test_cases", [])
        ]
        hidden_cases = [
            {
                "input": tc.get("input", ""),
                "expected_output": tc.get("expected_output", ""),
                "is_hidden": True,
            }
            for tc in problem.get("hidden_test_cases", [])
        ]
        all_test_cases = sample_cases + hidden_cases

        exec_summary = await self.execution_service.execute_test_cases(
            source_code=payload.source_code,
            language=payload.language,
            test_cases=all_test_cases,
            is_sample_only=False,
        )

        submission_doc = {
            "user_id": user_id,
            "problem_id": problem["id"],
            "problem_title": problem["title"],
            "problem_slug": problem["slug"],
            "language": payload.language.lower().strip(),
            "source_code": payload.source_code,
            "execution_status": exec_summary["verdict"],
            "test_cases_passed": exec_summary["test_cases_passed"],
            "total_test_cases": exec_summary["total_test_cases"],
            "execution_time_ms": exec_summary["execution_time_ms"],
            "memory_kb": exec_summary["memory_kb"],
            "error_message": exec_summary["error_message"],
            "test_case_results": exec_summary["test_case_results"],
            "ai_review": None,
        }

        created = await self.submission_repo.create(submission_doc)
        return SubmissionResponse(**created)

    async def get_submission(self, submission_id: str, user_id: str) -> SubmissionResponse:
        doc = await self.submission_repo.find_by_id_and_user(submission_id, user_id)
        if not doc:
            raise AppException(
                status_code=404,
                code="SUBMISSION_NOT_FOUND",
                message="Submission not found.",
            )
        return SubmissionResponse(**doc)

    async def list_submissions(
        self,
        user_id: str,
        problem_id: Optional[str] = None,
        status: Optional[str] = None,
        language: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> SubmissionListResponse:
        docs, total = await self.submission_repo.list_by_user(
            user_id=user_id,
            problem_id=problem_id,
            status=status,
            language=language,
            page=page,
            page_size=page_size,
        )
        return SubmissionListResponse(
            items=[SubmissionResponse(**d) for d in docs],
            total=total,
            page=page,
            page_size=page_size,
        )

    async def generate_ai_review(self, submission_id: str, user_id: str) -> AICodeReviewResponse:
        submission = await self.submission_repo.find_by_id_and_user(submission_id, user_id)
        if not submission:
            raise AppException(
                status_code=404,
                code="SUBMISSION_NOT_FOUND",
                message="Submission not found or access denied.",
            )

        problem = await self.problem_repo.find_by_id(submission["problem_id"])
        problem_title = problem["title"] if problem else submission.get("problem_title", "Coding Problem")
        problem_desc = problem["description"] if problem else ""
        constraints = problem.get("constraints", []) if problem else []

        review = await self.review_service.review_submission(
            problem_title=problem_title,
            problem_description=problem_desc,
            constraints=constraints,
            language=submission["language"],
            source_code=submission["source_code"],
            execution_status=submission["execution_status"],
            test_cases_passed=submission["test_cases_passed"],
            total_test_cases=submission["total_test_cases"],
            error_message=submission.get("error_message"),
        )

        await self.submission_repo.update(
            submission_id,
            {"ai_review": review.model_dump()},
        )

        return review
