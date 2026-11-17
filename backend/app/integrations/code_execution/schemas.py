from enum import Enum
from typing import Dict, Optional
from pydantic import BaseModel, Field


class ExecutionVerdict(str, Enum):
    ACCEPTED = "accepted"
    WRONG_ANSWER = "wrong_answer"
    TIME_LIMIT_EXCEEDED = "time_limit_exceeded"
    MEMORY_LIMIT_EXCEEDED = "memory_limit_exceeded"
    COMPILATION_ERROR = "compilation_error"
    RUNTIME_ERROR = "runtime_error"
    INTERNAL_ERROR = "internal_error"
    PENDING = "pending"


class LanguageConfig(BaseModel):
    judge0_id: int
    slug: str
    name: str
    monaco_id: str
    extension: str
    is_compiled: bool = False
    version: str = "latest"


SUPPORTED_LANGUAGES: Dict[str, LanguageConfig] = {
    "python": LanguageConfig(
        judge0_id=71,
        slug="python",
        name="Python 3",
        monaco_id="python",
        extension="py",
        is_compiled=False,
        version="3.8.1+",
    ),
    "javascript": LanguageConfig(
        judge0_id=63,
        slug="javascript",
        name="JavaScript (Node.js)",
        monaco_id="javascript",
        extension="js",
        is_compiled=False,
        version="12.14.0+",
    ),
    "typescript": LanguageConfig(
        judge0_id=74,
        slug="typescript",
        name="TypeScript",
        monaco_id="typescript",
        extension="ts",
        is_compiled=True,
        version="3.7.4+",
    ),
    "java": LanguageConfig(
        judge0_id=62,
        slug="java",
        name="Java",
        monaco_id="java",
        extension="java",
        is_compiled=True,
        version="OpenJDK 13.0.1+",
    ),
    "cpp": LanguageConfig(
        judge0_id=54,
        slug="cpp",
        name="C++ (GCC)",
        monaco_id="cpp",
        extension="cpp",
        is_compiled=True,
        version="GCC 9.2.0+",
    ),
    "go": LanguageConfig(
        judge0_id=60,
        slug="go",
        name="Go",
        monaco_id="go",
        extension="go",
        is_compiled=True,
        version="1.13.5+",
    ),
}


class ExecutionRequest(BaseModel):
    source_code: str = Field(..., max_length=65536)
    language: str
    stdin: Optional[str] = Field(None, max_length=16384)
    expected_output: Optional[str] = None
    cpu_time_limit: float = 2.0
    memory_limit_mb: int = 128


class ExecutionResult(BaseModel):
    verdict: ExecutionVerdict
    stdout: Optional[str] = None
    stderr: Optional[str] = None
    compile_output: Optional[str] = None
    exit_code: Optional[int] = None
    execution_time_ms: Optional[float] = None
    memory_kb: Optional[int] = None
    passed: bool = False
    error_message: Optional[str] = None
