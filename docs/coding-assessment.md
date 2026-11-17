# AI-Powered Coding Assessment & Practice — SkillBridge Day 14

## 1. Feature Overview

The Coding Assessment & Practice feature allows users to browse a curated catalogue of coding problems, write and run solutions in an in-browser code editor backed by an isolated execution sandbox, and submit for full evaluation against both sample and hidden test cases. After submission, users can request an AI-generated code review that covers correctness, complexity, strengths, and learning recommendations.

Key capabilities:
- Browse and filter problems by difficulty, category, or topic
- Write code in Monaco editor with 6 supported languages
- Run code against sample test cases instantly (no submission stored)
- Submit for full evaluation including hidden test cases
- View per-test-case verdicts with timing and memory metrics
- Request AI code review powered by the configured LLM provider
- Track submission history and solved problem status

---

## 2. Architecture

```
React Frontend (Monaco Editor)
        │
        │  HTTPS REST
        ▼
FastAPI Backend (/api/v1/coding/*)
        │
        │  CodingService
        ▼
Code Execution Adapter (CodeExecutionService)
        │
        ├── Mock Provider   (default: local dev & tests)
        └── Judge0 Provider (production / self-hosted)
```

**Layers:**

| Layer | Responsibility |
|-------|---------------|
| `app/api/v1/endpoints/coding.py` | HTTP routing, auth enforcement, request parsing |
| `app/services/coding/coding_service.py` | Business logic: seed lookup, test-case assembly, result persistence |
| `app/integrations/code_execution/service.py` | Test-case orchestration, result aggregation, hidden-test redaction |
| `app/integrations/code_execution/providers/` | Pluggable adapters (Mock, Judge0) |
| `app/repositories/` | MongoDB CRUD for problems, submissions, assessments |
| `app/services/coding/code_review_service.py` | AI review generation via configured LLM |

---

## 3. Code Execution Architecture

### Isolation Model

> [!IMPORTANT]
> User-submitted code is **never** executed inside the FastAPI process. All execution is delegated to an external sandbox via the provider adapter.

- **Mock provider** — deterministic simulation for development and CI; never actually runs user code on the host.
- **Judge0 provider** — production-grade sandbox (Docker-isolated, resource-limited). The FastAPI server submits source code over HTTP to the Judge0 API and polls for results.

### Provider Adapter Pattern

All providers implement `BaseCodeExecutionProvider`:

```python
class BaseCodeExecutionProvider(ABC):
    @property
    def provider_name(self) -> str: ...

    async def execute(self, request: ExecutionRequest) -> ExecutionResult: ...
```

`CodeExecutionService.execute_test_cases()` calls the active provider per test case, aggregates results, and redacts hidden test case details before returning to the service layer.

### Security Considerations

- Source code is transmitted to the external sandbox over HTTPS; it is never `eval`'d or `exec`'d by the application server.
- Result redaction happens server-side before any response leaves the API.
- Submission ownership is enforced before returning results or triggering AI review.

---

## 4. Execution Provider Configuration

### Mock Provider (default — local dev & testing)

```env
CODE_EXECUTION_PROVIDER=mock
```

The mock provider returns deterministic verdicts based on sentinel tokens in the source code:

| Sentinel in code | Verdict |
|-----------------|---------|
| `__COMPILATION_ERROR__` or `def (` | `compilation_error` |
| `__RUNTIME_ERROR__` or `ZeroDivisionError` or `raise`/`throw` | `runtime_error` |
| `__TIME_LIMIT_EXCEEDED__` or `time.sleep` or `while True:` | `time_limit_exceeded` |
| `__WRONG_ANSWER__` | `wrong_answer` |
| *(anything else)* | `accepted` |

### Judge0 Provider (production)

```env
CODE_EXECUTION_PROVIDER=judge0
JUDGE0_URL=https://judge0.yourdomain.com   # or https://api.judge0.com
JUDGE0_API_KEY=your-rapidapi-key            # if using Judge0 CE Cloud
JUDGE0_AUTH_TOKEN=your-auth-token           # if using self-hosted with auth
CODE_EXECUTION_TIMEOUT_SECONDS=5.0
```

> [!TIP]
> For self-hosted Judge0, deploy it with Docker Compose from the [official Judge0 repository](https://github.com/judge0/judge0). No `JUDGE0_API_KEY` is needed for a self-hosted instance without auth.

---

## 5. MongoDB Collections

### `coding_problems`

Stores problem definitions including hidden test cases (never sent to the client).

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Auto-generated MongoDB ID |
| `slug` | string (unique) | URL-safe identifier, e.g. `two-sum` |
| `title` | string | Display title |
| `description` | string | Markdown-formatted problem statement |
| `difficulty` | `easy` \| `medium` \| `hard` | Problem tier |
| `category` | string | e.g. `arrays`, `dynamic-programming` |
| `topics` | string[] | e.g. `["Hash Table", "Arrays"]` |
| `constraints` | string[] | Problem constraints |
| `examples` | object[] | `{input, output, explanation?}` |
| `sample_test_cases` | object[] | `{input, expected_output, is_hidden: false}` |
| `hidden_test_cases` | object[] | `{input, expected_output, is_hidden: true}` |
| `supported_languages` | string[] | e.g. `["python", "javascript"]` |
| `starter_code` | object | Per-language starter templates |
| `is_active` | boolean | Soft-delete / visibility flag |
| `created_at` | datetime | UTC timestamp |
| `updated_at` | datetime | UTC timestamp |

**Indexes:** `slug` (unique), `is_active`, `difficulty`, `category`

---

### `code_submissions`

Stores every submission with full execution results.

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Auto-generated MongoDB ID |
| `user_id` | string | Owning user's ID |
| `problem_id` | string | Reference to `coding_problems._id` |
| `problem_title` | string | Denormalised for display |
| `problem_slug` | string | Denormalised for routing |
| `language` | string | e.g. `python` |
| `source_code` | string | Full submitted source |
| `execution_status` | SubmissionStatus | Aggregate verdict |
| `test_cases_passed` | int | Count of passing test cases |
| `total_test_cases` | int | Total test cases evaluated |
| `execution_time_ms` | float? | Average execution time |
| `memory_kb` | int? | Peak memory usage |
| `error_message` | string? | Human-readable error |
| `test_case_results` | object[] | Per-test-case breakdown |
| `ai_review` | object? | AI review if requested |
| `created_at` | datetime | UTC submission time |
| `updated_at` | datetime | UTC last updated |

**Indexes:** `(user_id, created_at DESC)`, `(problem_id, user_id)`

---

### `coding_assessments`

Tracks structured assessment sessions (future timed-assessment use).

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Auto-generated MongoDB ID |
| `user_id` | string | Owning user's ID |
| `title` | string | Assessment title |
| `assessment_type` | string | `practice` (default) |
| `difficulty` | string | `easy`, `medium`, `hard`, or `mixed` |
| `problem_ids` | string[] | Problems in this assessment |
| `status` | string | `in_progress` or `completed` |
| `score` | float? | Final score when completed |
| `started_at` | datetime | UTC start time |
| `completed_at` | datetime? | UTC completion time |

**Indexes:** `(user_id, created_at DESC)`

---

## 6. API Reference

All endpoints require a valid `Authorization: Bearer <access_token>` header.

### GET `/api/v1/coding/problems`

List problems with optional filtering and pagination.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `difficulty` | string? | Filter: `easy`, `medium`, `hard` |
| `category` | string? | Filter by category slug |
| `topic` | string? | Filter by topic tag |
| `search` | string? | Full-text search on title/slug/topics |
| `page` | int (≥1, default 1) | Page number |
| `page_size` | int (1–100, default 20) | Results per page |

**Response** `200 OK`:
```json
{
  "items": [
    {
      "id": "...",
      "title": "Two Sum",
      "slug": "two-sum",
      "difficulty": "easy",
      "category": "arrays",
      "topics": ["Arrays", "Hash Table"],
      "is_solved": false
    }
  ],
  "total": 6,
  "page": 1,
  "page_size": 20
}
```

---

### GET `/api/v1/coding/problems/{problem_id}`

Get full problem details. `problem_id` accepts either a MongoDB ObjectId or a slug.

> [!IMPORTANT]
> `hidden_test_cases` are **never** included in the response. Only `sample_test_cases` are exposed.

**Response** `200 OK`:
```json
{
  "id": "...",
  "title": "Two Sum",
  "slug": "two-sum",
  "description": "...",
  "difficulty": "easy",
  "category": "arrays",
  "topics": ["Arrays", "Hash Table"],
  "constraints": ["2 <= nums.length <= 10^4"],
  "examples": [{"input": "...", "output": "...", "explanation": "..."}],
  "sample_test_cases": [{"input": "...", "expected_output": "..."}],
  "supported_languages": ["python", "javascript", "typescript", "java", "cpp", "go"],
  "starter_code": {"python": "def twoSum(...): pass\n"},
  "is_solved": false
}
```

---

### POST `/api/v1/coding/submissions/run`

Run code against **sample test cases only** (not persisted to database).

**Request Body:**
```json
{
  "problem_id": "two-sum",
  "language": "python",
  "source_code": "def twoSum(nums, target):\n    ...",
  "custom_stdin": null
}
```

**Response** `200 OK`:
```json
{
  "verdict": "accepted",
  "passed": true,
  "test_cases_passed": 2,
  "total_test_cases": 2,
  "execution_time_ms": 24.5,
  "memory_kb": 1820,
  "error_message": null,
  "test_case_results": [
    {
      "test_case_index": 0,
      "passed": true,
      "verdict": "accepted",
      "input": "[2,7,11,15]\n9",
      "expected_output": "[0, 1]",
      "stdout": "[0, 1]",
      "execution_time_ms": 24.5,
      "memory_kb": 1820,
      "is_hidden": false
    }
  ]
}
```

---

### POST `/api/v1/coding/submissions`

Submit solution for full evaluation (sample + hidden test cases). Result is persisted.

**Request Body:**
```json
{
  "problem_id": "two-sum",
  "language": "python",
  "source_code": "def twoSum(nums, target):\n    ..."
}
```

**Response** `201 Created` — `SubmissionResponse` (see GET `/submissions/{id}` below).

> [!NOTE]
> Hidden test case results have `input` and `expected_output` redacted to `"[HIDDEN]"` in the response.

---

### GET `/api/v1/coding/submissions/{submission_id}`

Retrieve a submission by ID. Returns `404` if the submission belongs to another user.

**Response** `200 OK`:
```json
{
  "id": "...",
  "user_id": "...",
  "problem_id": "...",
  "problem_title": "Two Sum",
  "problem_slug": "two-sum",
  "language": "python",
  "source_code": "...",
  "execution_status": "accepted",
  "test_cases_passed": 5,
  "total_test_cases": 5,
  "execution_time_ms": 24.5,
  "memory_kb": 1820,
  "error_message": null,
  "test_case_results": [...],
  "ai_review": null,
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

### GET `/api/v1/coding/submissions`

List the authenticated user's submission history with optional filters.

**Query Parameters:** `problem_id`, `status`, `language`, `page`, `page_size`

**Response** `200 OK` — paginated `SubmissionListResponse`

---

### POST `/api/v1/coding/submissions/{submission_id}/review`

Generate an AI code review for an existing submission. Returns `404` if the submission belongs to another user.

**Response** `200 OK` — `AICodeReviewResponse` (see §9 AI Code Review)

---

## 7. Supported Languages

| Language | Slug | Judge0 ID | Compiled |
|----------|------|-----------|---------|
| Python 3 | `python` | 71 | No |
| JavaScript (Node.js) | `javascript` | 63 | No |
| TypeScript | `typescript` | 74 | Yes |
| Java (OpenJDK) | `java` | 62 | Yes |
| C++ (GCC) | `cpp` | 54 | Yes |
| Go | `go` | 60 | Yes |

---

## 8. Test Case Evaluation

### Sample vs Hidden Test Cases

- **Sample test cases** are shown to the user (in the problem details and run results). They are stored in `coding_problems.sample_test_cases` with `is_hidden: false`.
- **Hidden test cases** are stored in `coding_problems.hidden_test_cases` with `is_hidden: true`. They are only used during a full submission evaluation (not in Run Code).

### Evaluation Flow

1. `POST /submissions` → `CodingService.submit_solution()`
2. Service assembles all test cases (`sample + hidden`), marks hidden ones with `is_hidden: true`
3. `CodeExecutionService.execute_test_cases()` calls the active provider for each test case
4. After all results are collected, any result with `is_hidden: true` has its `input` and `expected_output` replaced with `"[HIDDEN]"` before the response is serialised
5. The aggregate verdict follows the most severe failure across all test cases

### Verdict Priority (worst-first)

`compilation_error` > `runtime_error` > `time_limit_exceeded` > `memory_limit_exceeded` > `wrong_answer` > `accepted`

---

## 9. AI Code Review

Triggered by `POST /api/v1/coding/submissions/{submission_id}/review`. The review is **advisory only** and does not affect the execution verdict or score.

The AI is given the problem title, description, constraints, language, source code, execution status, and pass/fail counts.

### Response Schema (`AICodeReviewResponse`)

| Field | Type | Description |
|-------|------|-------------|
| `summary` | string | High-level assessment of the solution |
| `correctness_observations` | string | Comments on correctness relative to test results |
| `strengths` | string[] | What the solution does well |
| `improvements` | string[] | Specific actionable improvements |
| `potential_edge_cases` | string[] | Edge cases the solution may miss |
| `time_complexity` | string | Big-O time complexity, e.g. `O(n)` |
| `space_complexity` | string | Big-O space complexity, e.g. `O(n)` |
| `optimized_approach` | string? | Description of a more optimal approach if applicable |
| `learning_recommendations` | string[] | Suggested topics/resources to study |
| `model` | string? | The AI model used for this review |

The review is persisted to `code_submissions.ai_review` after generation, so subsequent fetches of the submission include it.

---

## 10. Security Considerations

| Concern | Mitigation |
|---------|------------|
| **Execution isolation** | User code runs only inside the external Judge0 sandbox (Docker-isolated). The FastAPI process never executes user code. |
| **Code size limits** | `source_code` is validated at the Pydantic schema layer: max **64 KB** (`MAX_SOURCE_CODE_SIZE_BYTES = 65536`). Requests exceeding this return `422`. |
| **Time limits** | Each test case is bounded by `DEFAULT_CPU_TIME_LIMIT_SECONDS` (default **2s**). The global API timeout is `CODE_EXECUTION_TIMEOUT_SECONDS` (default **5s**). |
| **Memory limits** | Each test case is bounded by `DEFAULT_MEMORY_LIMIT_MB` (default **128 MB**). |
| **Hidden test case protection** | Hidden inputs and expected outputs are redacted to `"[HIDDEN]"` server-side before any HTTP response leaves the API. The raw values are only stored in MongoDB and accessed server-side. |
| **Submission ownership** | `get_submission` and `generate_ai_review` query by `(submission_id, user_id)`. A submission belonging to another user returns `404`, not `403`, to avoid confirming existence. |
| **stdin size limits** | Custom stdin is capped at **16 KB** (`MAX_STDIN_SIZE_BYTES = 16384`). |

> [!CAUTION]
> Without a production Judge0 deployment, the mock provider is active. The mock never executes user code, but it also does not validate logical correctness — any code without sentinel tokens returns `accepted`. Do not use the mock provider for real assessments.

---

## 11. Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CODE_EXECUTION_PROVIDER` | Active execution backend: `mock` or `judge0` | `mock` |
| `JUDGE0_URL` | Base URL of the Judge0 API | `http://localhost:2358` |
| `JUDGE0_API_KEY` | RapidAPI key for Judge0 CE Cloud | *(none)* |
| `JUDGE0_AUTH_TOKEN` | Auth token for self-hosted Judge0 with auth | *(none)* |
| `CODE_EXECUTION_TIMEOUT_SECONDS` | Total timeout per execution request (seconds) | `5.0` |
| `MAX_SOURCE_CODE_SIZE_BYTES` | Maximum source code payload size (bytes) | `65536` (64 KB) |
| `MAX_STDIN_SIZE_BYTES` | Maximum stdin payload size (bytes) | `16384` (16 KB) |
| `DEFAULT_CPU_TIME_LIMIT_SECONDS` | Per-test-case CPU time limit (seconds) | `2.0` |
| `DEFAULT_MEMORY_LIMIT_MB` | Per-test-case memory limit (MB) | `128` |
| `AI_PROVIDER` | LLM provider for AI review: `openai` | `openai` |
| `AI_API_KEY` | API key for the AI provider | *(none)* |
| `AI_MODEL` | Model identifier | `gpt-4o-mini` |
| `MONGODB_URL` | MongoDB connection string | `mongodb://localhost:27017` |
| `MONGODB_DB_NAME` | Database name | `skillbridge` |

---

## 12. Local Development Setup

### 1. Seed Coding Problems

The seed script runs automatically on each backend startup and test run. To seed manually:

```bash
cd backend
.venv/bin/python -c "
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from app.db.seeds.coding_problems import seed_coding_problems

async def main():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]
    await seed_coding_problems(db)
    client.close()
    print('Seeded OK')

asyncio.run(main())
"
```

The seed is idempotent: existing problems are updated in-place, new ones are inserted.

### 2. Run the Backend

```bash
cd backend
cp .env.example .env          # configure AI_API_KEY etc.
.venv/bin/uvicorn app.main:app --reload --port 8000
```

### 3. Run the Frontend

```bash
cd frontend
npm install
npm run dev                   # starts Vite dev server on http://localhost:5173
```

Navigate to **Coding Practice** in the sidebar to access the feature.

---

## 13. Testing Instructions

### Backend Tests

```bash
cd backend
.venv/bin/python -m pytest tests/test_coding_assessment.py -v
```

The test suite uses an isolated `skillbridge_test` MongoDB database (cleaned between each test). The mock execution provider is active automatically (no `AI_API_KEY` required for most tests; the AI review test uses a mock LLM client if configured).

### Frontend Tests

```bash
cd frontend
npm test -- --testPathPattern=coding --run
```

### TypeScript Type Check

```bash
cd frontend
npx tsc --noEmit
```

---

## 14. Known Limitations

- **Judge0 not configured by default.** The mock provider is used in development and tests. Code correctness is simulated, not actually evaluated.
- **No real network isolation without Docker-based Judge0 deployment.** The mock provider runs in-process without any sandboxing.
- **No timed assessments.** The `coding_assessments` collection is defined but timed/proctored assessment workflows are not yet implemented (tracked as future work).
- **AI review requires a configured LLM API key.** Without `AI_API_KEY`, the AI review endpoint will fail with an internal error. Configure a mock AI provider for tests if needed.
- **No WebSocket live execution updates.** The run and submit endpoints are synchronous HTTP; there is no streaming progress for long-running submissions.
