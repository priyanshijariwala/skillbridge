import logging
from app.core.errors import AppException
from app.integrations.code_execution.base import BaseCodeExecutionProvider
from app.integrations.code_execution.schemas import (
    SUPPORTED_LANGUAGES,
    ExecutionRequest,
    ExecutionResult,
    ExecutionVerdict,
)

logger = logging.getLogger(__name__)


class MockExecutionProvider(BaseCodeExecutionProvider):
    """
    Deterministic simulated sandbox provider for test suites and offline environments.
    Strictly avoids executing arbitrary code on the application server.
    """

    @property
    def provider_name(self) -> str:
        return "mock"

    async def execute(self, request: ExecutionRequest) -> ExecutionResult:
        lang_config = SUPPORTED_LANGUAGES.get(request.language.lower())
        if not lang_config:
            raise AppException(
                status_code=400,
                code="UNSUPPORTED_LANGUAGE",
                message=f"Language '{request.language}' is not supported.",
            )

        code = request.source_code

        # 1. Simulated Compilation Error
        if "__COMPILATION_ERROR__" in code or "syntax error" in code.lower() or "def (" in code:
            return ExecutionResult(
                verdict=ExecutionVerdict.COMPILATION_ERROR,
                compile_output="SyntaxError: invalid syntax on line 1",
                exit_code=1,
                execution_time_ms=5.0,
                memory_kb=1024,
                passed=False,
                error_message="Compilation failed: invalid syntax",
            )

        # 2. Simulated Runtime Error
        if "__RUNTIME_ERROR__" in code or "ZeroDivisionError" in code or "raise " in code or "throw " in code:
            return ExecutionResult(
                verdict=ExecutionVerdict.RUNTIME_ERROR,
                stderr="ZeroDivisionError: division by zero",
                exit_code=1,
                execution_time_ms=12.0,
                memory_kb=2048,
                passed=False,
                error_message="Runtime Error: division by zero",
            )

        # 3. Simulated Timeout
        if "__TIME_LIMIT_EXCEEDED__" in code or "time.sleep" in code or "while True:" in code:
            return ExecutionResult(
                verdict=ExecutionVerdict.TIME_LIMIT_EXCEEDED,
                execution_time_ms=round(request.cpu_time_limit * 1000, 2),
                memory_kb=4096,
                passed=False,
                error_message=f"Time limit of {request.cpu_time_limit}s exceeded.",
            )

        # 4. Simulated Wrong Answer
        if "__WRONG_ANSWER__" in code:
            expected = request.expected_output or ""
            return ExecutionResult(
                verdict=ExecutionVerdict.WRONG_ANSWER,
                stdout="[0, 0]",
                exit_code=0,
                execution_time_ms=15.0,
                memory_kb=1520,
                passed=False,
                error_message=f"Output '[0, 0]' did not match expected output '{expected}'",
            )

        # 5. Default Successful Execution
        output = request.expected_output if request.expected_output is not None else "Execution completed."
        return ExecutionResult(
            verdict=ExecutionVerdict.ACCEPTED,
            stdout=output,
            exit_code=0,
            execution_time_ms=24.5,
            memory_kb=1820,
            passed=True,
        )
