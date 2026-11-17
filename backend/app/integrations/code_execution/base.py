from abc import ABC, abstractmethod
from typing import List
from app.integrations.code_execution.schemas import ExecutionRequest, ExecutionResult


class BaseCodeExecutionProvider(ABC):
    """
    Abstract interface for isolated code execution backends (e.g., Judge0, Docker isolated worker, Mock).
    Main application server never executes user code directly.
    """

    @property
    @abstractmethod
    def provider_name(self) -> str:
        ...

    @abstractmethod
    async def execute(self, request: ExecutionRequest) -> ExecutionResult:
        """Execute a single source code submission against standard input."""
        ...

    async def execute_batch(self, requests: List[ExecutionRequest]) -> List[ExecutionResult]:
        """
        Execute multiple test cases. Default implementation executes sequentially or in coroutines.
        Can be overridden by providers supporting batch endpoints.
        """
        results: List[ExecutionResult] = []
        for req in requests:
            res = await self.execute(req)
            results.append(res)
        return results
