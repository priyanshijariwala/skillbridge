import pytest
from httpx import AsyncClient
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.services.skill_gap.skill_normalization_service import SkillNormalizationService
from app.services.skill_gap.skill_matching_service import SkillMatchingService
from app.services.skill_gap.recommendation_service import RecommendationService
from tests.conftest import register_and_login


# 1. Skill Normalization Unit Tests
def test_skill_normalization_aliases():
    assert SkillNormalizationService.get_canonical_name("js") == "JavaScript"
    assert SkillNormalizationService.get_canonical_name("  Javascript  ") == "JavaScript"
    assert SkillNormalizationService.get_canonical_name("es6") == "JavaScript"
    assert SkillNormalizationService.get_canonical_name("ts") == "TypeScript"
    assert SkillNormalizationService.get_canonical_name("reactjs") == "React"
    assert SkillNormalizationService.get_canonical_name("react.js") == "React"
    assert SkillNormalizationService.get_canonical_name("node") == "Node.js"
    assert SkillNormalizationService.get_canonical_name("nodejs") == "Node.js"
    assert SkillNormalizationService.get_canonical_name("postgres") == "PostgreSQL"
    assert SkillNormalizationService.get_canonical_name("postgresql") == "PostgreSQL"
    assert SkillNormalizationService.get_canonical_name("k8s") == "Kubernetes"
    assert SkillNormalizationService.get_canonical_name("py") == "Python"
    assert SkillNormalizationService.get_canonical_name("fast api") == "FastAPI"

    # Equivalence checks
    assert SkillNormalizationService.are_skills_equivalent("JS", "javascript") is True
    assert SkillNormalizationService.are_skills_equivalent("node.js", "Node") is True
    assert SkillNormalizationService.are_skills_equivalent("postgres", "PostgreSQL") is True

    # Critical distinction safety checks
    assert SkillNormalizationService.are_skills_equivalent("Java", "JavaScript") is False
    assert SkillNormalizationService.are_skills_equivalent("React", "Angular") is False
    assert SkillNormalizationService.are_skills_equivalent("SQL", "MongoDB") is False
    assert SkillNormalizationService.are_skills_equivalent("C++", "C#") is False


# 2. Skill Matching and Weighted Scoring Tests
def test_skill_matching_weighted_score():
    candidate_skills_map = {
        "python": {
            "name": "Python",
            "category": "Languages",
            "status": "verified",
            "evidence": "3 years of Python",
        },
        "fastapi": {
            "name": "FastAPI",
            "category": "Frameworks",
            "status": "verified",
            "evidence": "Built async APIs",
        },
        "postgresql": {
            "name": "PostgreSQL",
            "category": "Databases",
            "status": "partial",
            "evidence": "Basic SQL queries",
        },
    }

    required_skills = [
        {"name": "Python", "importance": 5, "category": "Languages"},  # Matched -> 5 * 1.0 = 5.0
        {"name": "FastAPI", "importance": 4, "category": "Frameworks"},  # Matched -> 4 * 1.0 = 4.0
        {"name": "PostgreSQL", "importance": 4, "category": "Databases"},  # Partial -> 4 * 0.5 = 2.0
        {"name": "Docker", "importance": 3, "category": "DevOps"},  # Missing -> 3 * 0.0 = 0.0
    ]
    # Total required importance = 5 + 4 + 4 + 3 = 16
    # Earned importance = 5.0 + 4.0 + 2.0 + 0.0 = 11.0
    # Expected match % = round((11.0 / 16.0) * 100) = round(68.75) = 69%

    optional_skills = [
        {"name": "Redis", "importance": 2, "category": "Databases"},  # Missing optional
    ]

    result = SkillMatchingService.match_role(
        candidate_skills_map=candidate_skills_map,
        required_skills=required_skills,
        optional_skills=optional_skills,
    )

    assert result.match_percentage == 69
    assert len(result.matched_skills) == 2
    assert len(result.partially_matched_skills) == 1
    assert len(result.missing_skills) == 1
    assert result.missing_skills[0]["name"] == "Docker"
    assert result.counts["total_required"] == 4
    assert result.counts["matched"] == 2
    assert result.counts["partial"] == 1
    assert result.counts["missing"] == 1
    assert result.counts["optional"] == 1


# 3. Recommendation Fallback Test
def test_recommendation_fallback():
    missing = [{"name": "Docker", "importance": 4, "category": "DevOps"}]
    partial = [{"name": "PostgreSQL", "importance": 4, "category": "Databases"}]

    output = RecommendationService._fallback_recommendations(
        role_title="Backend Developer",
        missing_skills=missing,
        partially_matched_skills=partial,
    )

    assert "summary" in output
    assert len(output["recommendations"]) >= 2
    assert any(r["skill"] == "Docker" for r in output["recommendations"])
    assert any(r["skill"] == "PostgreSQL" for r in output["recommendations"])


# 4. Job Roles Endpoints Tests
@pytest.mark.asyncio
async def test_job_roles_api(async_client: AsyncClient):
    # List all job roles (seeded 9 roles)
    resp = await async_client.get("/api/v1/job-roles")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 9
    titles = [item["title"] for item in data["items"]]
    assert "Frontend Developer" in titles
    assert "Backend Developer" in titles
    assert "Full Stack Developer" in titles

    # Query search
    resp_search = await async_client.get("/api/v1/job-roles?q=react")
    assert resp_search.status_code == 200
    search_data = resp_search.json()
    assert any(r["slug"] == "react-developer" for r in search_data["items"])

    # Get single role by slug
    resp_role = await async_client.get("/api/v1/job-roles/backend-developer")
    assert resp_role.status_code == 200
    role_data = resp_role.json()
    assert role_data["title"] == "Backend Developer"
    assert len(role_data["required_skills"]) > 0

    # 404 for non-existent role
    resp_not_found = await async_client.get("/api/v1/job-roles/non-existent-role-xyz")
    assert resp_not_found.status_code == 404


# 5. Skill Gap Analyze - Error Cases
@pytest.mark.asyncio
async def test_skill_gap_analyze_no_resume(async_client: AsyncClient):
    headers = await register_and_login(async_client, email="no_resume@example.com")

    resp = await async_client.post(
        "/api/v1/skill-gap/analyze",
        headers=headers,
        json={"target_role_id": "backend-developer"},
    )
    assert resp.status_code == 400
    data = resp.json()
    assert data["error"]["code"] == "NO_RESUME_UPLOADED"


@pytest.mark.asyncio
async def test_skill_gap_analyze_unanalyzed_resume(
    async_client: AsyncClient, test_db: AsyncIOMotorDatabase
):
    headers = await register_and_login(async_client, email="unanalyzed@example.com")

    # Fetch user id
    me_resp = await async_client.get("/api/v1/auth/me", headers=headers)
    user_id = me_resp.json()["id"]

    # Insert an unanalyzed resume doc directly
    from app.repositories.resume_repository import ResumeRepository
    resume_repo = ResumeRepository(test_db)
    resume = await resume_repo.create({
        "user_id": user_id,
        "original_filename": "resume.pdf",
        "storage_key": "private/test/resume.pdf",
        "file_type": "pdf",
        "file_size_bytes": 1024,
        "status": "uploaded",
    })

    resp = await async_client.post(
        "/api/v1/skill-gap/analyze",
        headers=headers,
        json={"target_role_id": "backend-developer", "resume_id": resume["id"]},
    )
    assert resp.status_code == 400
    data = resp.json()
    assert data["error"]["code"] == "RESUME_NOT_ANALYZED"


# 6. Skill Gap Analyze - Success, Latest, Isolation & Stale Tests
@pytest.mark.asyncio
async def test_skill_gap_end_to_end_workflow(
    async_client: AsyncClient, test_db: AsyncIOMotorDatabase
):
    # Register candidate user
    headers = await register_and_login(async_client, email="candidate@example.com")

    me_resp = await async_client.get("/api/v1/auth/me", headers=headers)
    user_id = me_resp.json()["id"]

    # Create resume and completed resume analysis
    from app.repositories.resume_repository import ResumeRepository
    from app.repositories.resume_analysis_repository import ResumeAnalysisRepository

    resume_repo = ResumeRepository(test_db)
    resume = await resume_repo.create({
        "user_id": user_id,
        "original_filename": "candidate_cv.pdf",
        "storage_key": "private/test/candidate_cv.pdf",
        "file_type": "pdf",
        "file_size_bytes": 2048,
        "status": "completed",
    })

    analysis_repo = ResumeAnalysisRepository(test_db)
    resume_analysis = await analysis_repo.create({
        "user_id": user_id,
        "resume_id": resume["id"],
        "overall_score": 85,
        "score_breakdown": {
            "content_quality": 85,
            "skills_presentation": 80,
            "experience_descriptions": 85,
            "structure_readability": 85,
            "ats_readability": 90,
        },
        "summary": "Experienced Python backend engineer.",
        "extracted_data": {
            "skills": ["Python", "FastAPI", "Git", "REST APIs"],
        },
        "strengths": [{"title": "Strong API background"}],
        "improvements": [],
        "recommendations": [],
        "missing_information": [],
        "ats_observations": [],
        "detected_skills": [
            {"name": "Python", "category": "Languages", "status": "verified"},
            {"name": "FastAPI", "category": "Frameworks", "status": "verified"},
            {"name": "Git", "category": "Tools", "status": "verified"},
            {"name": "REST APIs", "category": "Architecture", "status": "verified"},
        ],
        "recommended_roles": ["Backend Developer"],
        "ai_metadata": {"provider": "mock"},
        "status": "completed",
    })

    # Trigger skill gap analysis
    resp = await async_client.post(
        "/api/v1/skill-gap/analyze",
        headers=headers,
        json={"target_role_id": "backend-developer"},
    )
    assert resp.status_code == 200
    gap_data = resp.json()
    analysis_id = gap_data["id"]

    assert gap_data["target_role_title"] == "Backend Developer"
    assert gap_data["match_percentage"] > 0
    assert len(gap_data["matched_skills"]) >= 4  # Python, FastAPI, Git, REST APIs
    assert len(gap_data["missing_skills"]) > 0  # PostgreSQL, MongoDB, Docker
    assert len(gap_data["recommendations"]) > 0
    assert gap_data["is_stale"] is False

    # Check GET /api/v1/skill-gap/latest
    latest_resp = await async_client.get("/api/v1/skill-gap/latest", headers=headers)
    assert latest_resp.status_code == 200
    latest_data = latest_resp.json()
    assert latest_data["id"] == analysis_id
    assert latest_data["target_role_title"] == "Backend Developer"

    # Verify profile was updated with target role
    prof_resp = await async_client.get("/api/v1/profiles/me", headers=headers)
    assert prof_resp.status_code == 200
    profile_data = prof_resp.json()
    assert profile_data["target_role_title"] == "Backend Developer"

    # Cross-user isolation check: User B cannot access User A's analysis
    headers_b = await register_and_login(async_client, email="user_b@example.com")

    resp_forbidden = await async_client.get(
        f"/api/v1/skill-gap/{analysis_id}", headers=headers_b
    )
    assert resp_forbidden.status_code == 404

    # Stale detection test: If user creates a newer resume analysis, gap analysis becomes stale
    await analysis_repo.create({
        "user_id": user_id,
        "resume_id": resume["id"],
        "overall_score": 90,
        "score_breakdown": {},
        "summary": "Updated resume analysis",
        "extracted_data": {"skills": ["Python", "FastAPI", "PostgreSQL", "Docker"]},
        "strengths": [],
        "improvements": [],
        "recommendations": [],
        "missing_information": [],
        "ats_observations": [],
        "detected_skills": [],
        "recommended_roles": [],
        "ai_metadata": {},
        "status": "completed",
    })

    stale_check_resp = await async_client.get("/api/v1/skill-gap/latest", headers=headers)
    assert stale_check_resp.status_code == 200
    assert stale_check_resp.json()["is_stale"] is True
