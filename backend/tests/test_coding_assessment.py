import pytest
from httpx import AsyncClient
from motor.motor_asyncio import AsyncIOMotorDatabase
from tests.conftest import register_and_login


@pytest.mark.asyncio
async def test_list_coding_problems_and_filtering(async_client: AsyncClient):
    headers = await register_and_login(async_client, email="coder1@example.com")

    # 1. List all problems
    resp = await async_client.get("/api/v1/coding/problems", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 5
    assert len(data["items"]) >= 5

    # 2. Filter by difficulty
    resp_easy = await async_client.get("/api/v1/coding/problems?difficulty=easy", headers=headers)
    assert resp_easy.status_code == 200
    for item in resp_easy.json()["items"]:
        assert item["difficulty"] == "easy"

    # 3. Filter by category
    resp_cat = await async_client.get("/api/v1/coding/problems?category=arrays", headers=headers)
    assert resp_cat.status_code == 200
    assert resp_cat.json()["total"] >= 1
    assert any(p["slug"] == "two-sum" for p in resp_cat.json()["items"])

    # 4. Search query
    resp_search = await async_client.get("/api/v1/coding/problems?search=Parentheses", headers=headers)
    assert resp_search.status_code == 200
    assert resp_search.json()["total"] == 1
    assert resp_search.json()["items"][0]["slug"] == "valid-parentheses"


@pytest.mark.asyncio
async def test_get_problem_details_no_hidden_test_cases(async_client: AsyncClient):
    headers = await register_and_login(async_client, email="coder2@example.com")

    # 1. Get problem by slug
    resp = await async_client.get("/api/v1/coding/problems/two-sum", headers=headers)
    assert resp.status_code == 200
    prob = resp.json()
    assert prob["title"] == "Two Sum"
    assert "starter_code" in prob
    assert "python" in prob["starter_code"]
    assert "sample_test_cases" in prob
    assert len(prob["sample_test_cases"]) > 0

    # Security check: hidden_test_cases must NOT be present in response
    assert "hidden_test_cases" not in prob

    # 2. Non-existent problem
    resp_404 = await async_client.get("/api/v1/coding/problems/non-existent-problem", headers=headers)
    assert resp_404.status_code == 404


@pytest.mark.asyncio
async def test_run_sample_code_executions(async_client: AsyncClient):
    headers = await register_and_login(async_client, email="runner@example.com")

    # 1. Run accepted code
    run_resp = await async_client.post(
        "/api/v1/coding/submissions/run",
        headers=headers,
        json={
            "problem_id": "two-sum",
            "language": "python",
            "source_code": "def twoSum(nums, target):\n    return [0, 1]\n",
        },
    )
    assert run_resp.status_code == 200
    data = run_resp.json()
    assert data["verdict"] == "accepted"
    assert data["passed"] is True
    assert data["test_cases_passed"] == data["total_test_cases"]

    # 2. Run compilation error code
    comp_resp = await async_client.post(
        "/api/v1/coding/submissions/run",
        headers=headers,
        json={
            "problem_id": "two-sum",
            "language": "python",
            "source_code": "def (__COMPILATION_ERROR__):\n    invalid syntax\n",
        },
    )
    assert comp_resp.status_code == 200
    assert comp_resp.json()["verdict"] == "compilation_error"
    assert comp_resp.json()["passed"] is False

    # 3. Run runtime error code
    re_resp = await async_client.post(
        "/api/v1/coding/submissions/run",
        headers=headers,
        json={
            "problem_id": "two-sum",
            "language": "python",
            "source_code": "def twoSum(nums, target):\n    raise ZeroDivisionError('boom')\n",
        },
    )
    assert re_resp.status_code == 200
    assert re_resp.json()["verdict"] == "runtime_error"
    assert re_resp.json()["passed"] is False

    # 4. Run time limit exceeded code
    tle_resp = await async_client.post(
        "/api/v1/coding/submissions/run",
        headers=headers,
        json={
            "problem_id": "two-sum",
            "language": "python",
            "source_code": "def twoSum(nums, target):\n    # __TIME_LIMIT_EXCEEDED__\n    import time; time.sleep(10)\n",
        },
    )
    assert tle_resp.status_code == 200
    assert tle_resp.json()["verdict"] == "time_limit_exceeded"
    assert tle_resp.json()["passed"] is False


@pytest.mark.asyncio
async def test_submit_solution_full_suite_and_hidden_protection(async_client: AsyncClient):
    headers = await register_and_login(async_client, email="submitter@example.com")

    # Submit solution
    sub_resp = await async_client.post(
        "/api/v1/coding/submissions",
        headers=headers,
        json={
            "problem_id": "two-sum",
            "language": "python",
            "source_code": "def twoSum(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        diff = target - n\n        if diff in seen:\n            return [seen[diff], i]\n        seen[n] = i\n",
        },
    )
    assert sub_resp.status_code == 201
    data = sub_resp.json()
    assert data["execution_status"] == "accepted"
    assert data["test_cases_passed"] == data["total_test_cases"]
    assert data["total_test_cases"] >= 5  # sample (2) + hidden (3)

    # Security check: hidden test case results must redact input and expected output
    hidden_results = [r for r in data["test_case_results"] if r.get("is_hidden")]
    assert len(hidden_results) > 0
    for hr in hidden_results:
        assert hr["input"] == "[HIDDEN]"
        assert hr["expected_output"] == "[HIDDEN]"


@pytest.mark.asyncio
async def test_submission_ownership_and_cross_user_isolation(async_client: AsyncClient):
    headers_u1 = await register_and_login(async_client, email="user1_coding@example.com")
    headers_u2 = await register_and_login(async_client, email="user2_coding@example.com")

    # User 1 submits solution
    sub_resp = await async_client.post(
        "/api/v1/coding/submissions",
        headers=headers_u1,
        json={
            "problem_id": "binary-search",
            "language": "python",
            "source_code": "def search(nums, target): return 0\n",
        },
    )
    sub_id = sub_resp.json()["id"]

    # User 1 can fetch their submission
    assert (await async_client.get(f"/api/v1/coding/submissions/{sub_id}", headers=headers_u1)).status_code == 200

    # User 2 cannot access User 1's submission (404)
    assert (await async_client.get(f"/api/v1/coding/submissions/{sub_id}", headers=headers_u2)).status_code == 404

    # User 2 cannot request review on User 1's submission (404)
    assert (await async_client.post(f"/api/v1/coding/submissions/{sub_id}/review", headers=headers_u2)).status_code == 404


@pytest.mark.asyncio
async def test_submission_history_and_solved_status(async_client: AsyncClient):
    headers = await register_and_login(async_client, email="history_coder@example.com")

    # Submit solution
    await async_client.post(
        "/api/v1/coding/submissions",
        headers=headers,
        json={
            "problem_id": "two-sum",
            "language": "python",
            "source_code": "def twoSum(nums, target): return [0, 1]\n",
        },
    )

    # Verify history endpoint
    hist_resp = await async_client.get("/api/v1/coding/submissions", headers=headers)
    assert hist_resp.status_code == 200
    assert hist_resp.json()["total"] >= 1
    assert hist_resp.json()["items"][0]["problem_slug"] == "two-sum"

    # Verify problem list marks Two Sum as is_solved: True
    probs_resp = await async_client.get("/api/v1/coding/problems", headers=headers)
    assert probs_resp.status_code == 200
    two_sum_item = next(p for p in probs_resp.json()["items"] if p["slug"] == "two-sum")
    assert two_sum_item["is_solved"] is True


@pytest.mark.asyncio
async def test_ai_code_review_generation(async_client: AsyncClient):
    headers = await register_and_login(async_client, email="reviewer_candidate@example.com")

    # 1. Submit solution
    sub_resp = await async_client.post(
        "/api/v1/coding/submissions",
        headers=headers,
        json={
            "problem_id": "valid-parentheses",
            "language": "python",
            "source_code": "def isValid(s):\n    stack = []\n    mapping = {')': '(', '}': '{', ']': '['}\n    for char in s:\n        if char in mapping:\n            top = stack.pop() if stack else '#'\n            if mapping[char] != top: return False\n        else: stack.append(char)\n    return not stack\n",
        },
    )
    sub_id = sub_resp.json()["id"]

    # 2. Generate AI review
    rev_resp = await async_client.post(f"/api/v1/coding/submissions/{sub_id}/review", headers=headers)
    assert rev_resp.status_code == 200
    rev_data = rev_resp.json()
    assert "summary" in rev_data
    assert "time_complexity" in rev_data
    assert "space_complexity" in rev_data
    assert len(rev_data["strengths"]) > 0
    assert len(rev_data["improvements"]) > 0


@pytest.mark.asyncio
async def test_code_validation_and_size_limits(async_client: AsyncClient):
    headers = await register_and_login(async_client, email="security_tester@example.com")

    # 1. Unsupported language
    unsupported_resp = await async_client.post(
        "/api/v1/coding/submissions/run",
        headers=headers,
        json={
            "problem_id": "two-sum",
            "language": "cobol",
            "source_code": "IDENTIFICATION DIVISION.\n",
        },
    )
    assert unsupported_resp.status_code == 400
    assert unsupported_resp.json()["error"]["code"] == "UNSUPPORTED_LANGUAGE"

    # 2. Excessively large source code (> 64 KB)
    huge_code = "# " + ("A" * 70000)
    huge_resp = await async_client.post(
        "/api/v1/coding/submissions/run",
        headers=headers,
        json={
            "problem_id": "two-sum",
            "language": "python",
            "source_code": huge_code,
        },
    )
    assert huge_resp.status_code == 422 or huge_resp.status_code == 400
