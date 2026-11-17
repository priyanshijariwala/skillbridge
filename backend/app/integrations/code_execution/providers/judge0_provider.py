import logging
from typing import Optional
import httpx
from app.core.errors import AppException
from app.integrations.code_execution.base import BaseCodeExecutionProvider
from app.integrations.code_execution.schemas import (
    SUPPORTED_LANGUAGES,
    ExecutionRequest,
    ExecutionResult,
    ExecutionVerdict,
)

logger = logging.getLogger(__name__)


class Judge0ExecutionProvider(BaseCodeExecutionProvider):
    """
    Judge0 CE / Extra CE remote isolated execution provider.
    Submits code to Judge0 sandbox API and retrieves resource metrics and outputs.
    """

    def __init__(
        self,
        base_url: str = "http://localhost:2358",
        api_key: Optional[str] = None,
        auth_token: Optional[str] = None,
        timeout_seconds: float = 10.0,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.auth_token = auth_token
        self.timeout_seconds = timeout_seconds

    @property
    def provider_name(self) -> str:
        return "judge0"

    def _get_headers(self) -> dict:
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["X-RapidAPI-Key"] = self.api_key
        if self.auth_token:
            headers["X-Auth-Token"] = self.auth_token
        return headers

    def _map_judge0_status(self, status_id: int) -> ExecutionVerdict:
        # Judge0 status codes:
        # 3: Accepted
        # 4: Wrong Answer
        # 5: Time Limit Exceeded
        # 6: Compilation Error
        # 7-12: Runtime Errors (SIGSEGV, SIGXFSZ, SIGFPE, SIGABRT, NZEC, other)
        # 13: Internal Error
        # 14: Exec Format Error
        if status_id == 3:
            return ExecutionVerdict.ACCEPTED
        elif status_id == 4:
            return ExecutionVerdict.WRONG_ANSWER
        elif status_id == 5:
            return ExecutionVerdict.TIME_LIMIT_EXCEEDED
        elif status_id == 6:
            return ExecutionVerdict.COMPILATION_ERROR
        elif 7 <= status_id <= 12 or status_id == 14:
            return ExecutionVerdict.RUNTIME_ERROR
        elif status_id in (1, 2):
            return ExecutionVerdict.PENDING
        else:
            return ExecutionVerdict.INTERNAL_ERROR

    async def execute(self, request: ExecutionRequest) -> ExecutionResult:
        lang_config = SUPPORTED_LANGUAGES.get(request.language.lower())
        if not lang_config:
            raise AppException(
                status_code=400,
                code="UNSUPPORTED_LANGUAGE",
                message=f"Language '{request.language}' is not supported.",
            )

        payload = {
            "source_code": request.source_code,
            "language_id": lang_config.judge0_id,
            "stdin": request.stdin or "",
            "expected_output": request.expected_output or "",
            "cpu_time_limit": request.cpu_time_limit,
            "memory_limit": request.memory_limit_mb * 1024,  # Judge0 takes KB
        }

        url = f"{self.base_url}/submissions?base64_encoded=false&wait=true"

        try:
            async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                resp = await client.post(url, json=payload, headers=self._get_headers())
                if resp.status_code >= 400:
                    logger.error("Judge0 API returned HTTP %s: %s", resp.status_code, resp.text)
                    return ExecutionResult(
                        verdict=ExecutionVerdict.INTERNAL_ERROR,
                        error_message="Isolated code execution provider returned an error.",
                    )

                data = resp.json()
                status_obj = data.get("status", {})
                status_id = status_obj.get("id", 13)
                verdict = self._map_judge0_status(status_id)

                stdout = data.get("stdout")
                stderr = data.get("stderr")
                compile_output = data.get("compile_output")
                time_sec = float(data.get("time") or 0.0)
                memory_kb = int(data.get("memory") or 0)
                exit_code = data.get("exit_code")

                # Verify against expected_output if present and status is Accepted
                passed = verdict == ExecutionVerdict.ACCEPTED
                if request.expected_output is not None and stdout is not None:
                    passed = stdout.strip() == request.expected_output.strip()
                    if not passed and verdict == ExecutionVerdict.ACCEPTED:
                        verdict = ExecutionVerdict.WRONG_ANSWER

                return ExecutionResult(
                    verdict=verdict,
                    stdout=stdout,
                    stderr=stderr,
                    compile_output=compile_output,
                    exit_code=exit_code,
                    execution_time_ms=round(time_sec * 1000, 2),
                    memory_kb=memory_kb,
                    passed=passed,
                    error_message=stderr or compile_output or status_obj.get("description"),
                )

        except httpx.TimeoutException:
            logger.warning("Judge0 request timed out after %s seconds", self.timeout_seconds)
            return ExecutionResult(
                verdict=ExecutionVerdict.TIME_LIMIT_EXCEEDED,
                execution_time_ms=round(request.cpu_time_limit * 1000, 2),
                passed=False,
                error_message="Execution timed out.",
            )
        except Exception as e:
            logger.error("Failed to communicate with Judge0: %s", e)
            return ExecutionResult(
                verdict=ExecutionVerdict.INTERNAL_ERROR,
                passed=False,
                error_message="Could not connect to code execution sandbox.",
            )
