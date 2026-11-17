import logging
from typing import Any, Dict, List, Optional
from app.core.config import settings
from app.core.errors import AppException
from app.integrations.code_execution.base import BaseCodeExecutionProvider
from app.integrations.code_execution.provider_factory import get_execution_provider
from app.integrations.code_execution.schemas import (
    SUPPORTED_LANGUAGES,
    ExecutionRequest,
    ExecutionVerdict,
)

logger = logging.getLogger(__name__)


class CodeExecutionService:
    """
    High-level service orchestrating code validation, sandbox execution,
    and test-case evaluation while enforcing strict security limits and hidden test protection.
    """

    def __init__(self, provider: Optional[BaseCodeExecutionProvider] = None) -> None:
        self.provider = provider or get_execution_provider()

    def validate_code_submission(
        self,
        source_code: str,
        language: str,
        stdin: Optional[str] = None,
    ) -> None:
        """Enforces language support and payload size limits."""
        lang_lower = language.lower().strip()
        if lang_lower not in SUPPORTED_LANGUAGES:
            supported = ", ".join(SUPPORTED_LANGUAGES.keys())
            raise AppException(
                status_code=400,
                code="UNSUPPORTED_LANGUAGE",
                message=f"Language '{language}' is not supported. Supported languages: {supported}",
            )

        code_bytes = len(source_code.encode("utf-8"))
        if code_bytes > settings.MAX_SOURCE_CODE_SIZE_BYTES:
            raise AppException(
                status_code=400,
                code="SOURCE_CODE_TOO_LARGE",
                message=f"Source code size ({code_bytes} bytes) exceeds maximum allowed limit ({settings.MAX_SOURCE_CODE_SIZE_BYTES} bytes).",
            )

        if stdin and len(stdin.encode("utf-8")) > settings.MAX_STDIN_SIZE_BYTES:
            raise AppException(
                status_code=400,
                code="STDIN_TOO_LARGE",
                message=f"Standard input size exceeds limit ({settings.MAX_STDIN_SIZE_BYTES} bytes).",
            )

    async def execute_test_cases(
        self,
        source_code: str,
        language: str,
        test_cases: List[Dict[str, Any]],
        is_sample_only: bool = False,
    ) -> Dict[str, Any]:
        """
        Executes code against a collection of test cases.
        Hidden test case inputs and expected outputs are NEVER returned in the output structure.
        """
        self.validate_code_submission(source_code, language)

        overall_verdict = ExecutionVerdict.ACCEPTED
        passed_count = 0
        total_count = len(test_cases)
        max_time_ms = 0.0
        max_memory_kb = 0
        first_error_message: Optional[str] = None

        evaluated_results: List[Dict[str, Any]] = []

        for idx, tc in enumerate(test_cases):
            tc_input = tc.get("input", "")
            expected_output = tc.get("expected_output", "")
            is_hidden = tc.get("is_hidden", False)

            req = ExecutionRequest(
                source_code=source_code,
                language=language.lower().strip(),
                stdin=tc_input,
                expected_output=expected_output,
                cpu_time_limit=tc.get("time_limit", settings.DEFAULT_CPU_TIME_LIMIT_SECONDS),
                memory_limit_mb=tc.get("memory_limit", settings.DEFAULT_MEMORY_LIMIT_MB),
            )

            res = await self.provider.execute(req)

            if res.execution_time_ms and res.execution_time_ms > max_time_ms:
                max_time_ms = res.execution_time_ms
            if res.memory_kb and res.memory_kb > max_memory_kb:
                max_memory_kb = res.memory_kb

            if res.passed:
                passed_count += 1
            else:
                if overall_verdict == ExecutionVerdict.ACCEPTED:
                    overall_verdict = res.verdict
                    first_error_message = res.error_message or f"Failed on test case #{idx + 1}"

            result_entry: Dict[str, Any] = {
                "test_case_index": idx + 1,
                "passed": res.passed,
                "verdict": res.verdict.value,
                "execution_time_ms": res.execution_time_ms,
                "memory_kb": res.memory_kb,
                "is_hidden": is_hidden,
            }

            # Only reveal stdout, input, and expected_output for sample (non-hidden) test cases
            if not is_hidden or is_sample_only:
                result_entry["input"] = tc_input
                result_entry["expected_output"] = expected_output
                result_entry["stdout"] = res.stdout
                result_entry["stderr"] = res.stderr
                result_entry["compile_output"] = res.compile_output
            else:
                # Security: Redact hidden test inputs and expected outputs
                result_entry["input"] = "[HIDDEN]"
                result_entry["expected_output"] = "[HIDDEN]"
                result_entry["stdout"] = "[HIDDEN]"

            evaluated_results.append(result_entry)

            # If compilation error, halt further test cases immediately
            if res.verdict == ExecutionVerdict.COMPILATION_ERROR:
                overall_verdict = ExecutionVerdict.COMPILATION_ERROR
                first_error_message = res.compile_output or res.error_message or "Compilation error"
                break

        return {
            "verdict": overall_verdict.value,
            "passed": passed_count == total_count and total_count > 0,
            "test_cases_passed": passed_count,
            "total_test_cases": total_count,
            "execution_time_ms": max_time_ms,
            "memory_kb": max_memory_kb,
            "error_message": first_error_message,
            "test_case_results": evaluated_results,
        }
