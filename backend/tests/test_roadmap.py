import pytest
from httpx import AsyncClient
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.errors import AppException
from app.services.roadmap.roadmap_progress_service import RoadmapProgressService
from app.services.roadmap.roadmap_validation_service import RoadmapValidationService
from tests.conftest import register_and_login


# 1. Validation Service Tests
def test_roadmap_validation_success():
    raw_data = {
        "title": "Backend Engineering Curriculum",
        "description": "Deepen backend skills.",
        "estimated_duration_days": 45,
        "milestones": [
            {
                "title": "Phase 1: Core Systems",
                "description": "Learn core concepts.",
                "order": 1,
                "estimated_duration_days": 15,
                "priority": "high",
                "related_skills": ["Python", "FastAPI"],
                "tasks": [
                    {
                        "title": "Learn FastAPI Dependency Injection",
                        "description": "Understand Depends and sub-dependencies.",
                        "task_type": "learn",
                        "related_skill": "FastAPI",
                        "estimated_duration_hours": 5,
                        "priority": "high",
                        "resources": ["FastAPI Documentation"],
                    },
                    {
                        "title": "Build Async CRUD Service",
                        "description": "Develop full async CRUD endpoints.",
                        "task_type": "project",
                        "related_skill": "FastAPI",
                        "estimated_duration_hours": 8,
                        "priority": "high",
                    },
                ],
            }
        ],
    }

    validated = RoadmapValidationService.validate_and_normalize(raw_data)
    assert validated["title"] == "Backend Engineering Curriculum"
    assert len(validated["milestones"]) == 1
    m1 = validated["milestones"][0]
    assert m1["order"] == 1
    assert len(m1["tasks"]) == 2
    assert m1["tasks"][0]["task_type"] == "learn"
    assert m1["tasks"][1]["task_type"] == "project"


def test_roadmap_validation_rejects_empty():
    with pytest.raises(AppException) as exc_info:
        RoadmapValidationService.validate_and_normalize({"title": "Test", "milestones": []})
    assert exc_info.value.code == "EMPTY_ROADMAP_MILESTONES"

    with pytest.raises(AppException) as exc_info2:
        RoadmapValidationService.validate_and_normalize({
            "title": "Test",
            "milestones": [{"title": "Milestone with no tasks", "tasks": []}],
        })
    assert exc_info2.value.code == "EMPTY_MILESTONE_TASKS"


# 2. Progress Service Tests
def test_roadmap_progress_calculation():
    roadmap = {
        "id": "rd_123",
        "status": "active",
        "milestones": [
            {
                "id": "m_1",
                "title": "Milestone 1",
                "status": "not_started",
                "tasks": [
                    {"id": "t_1", "status": "completed", "estimated_duration_hours": 4},
                    {"id": "t_2", "status": "completed", "estimated_duration_hours": 6},
                ],
            },
            {
                "id": "m_2",
                "title": "Milestone 2",
                "status": "not_started",
                "tasks": [
                    {"id": "t_3", "status": "in_progress", "estimated_duration_hours": 5},
                    {"id": "t_4", "status": "not_started", "estimated_duration_hours": 5},
                ],
            },
        ],
    }

    progress = RoadmapProgressService.recalculate_roadmap_progress(roadmap)

    # Total tasks = 4, completed = 2 -> 50%
    assert progress["total_tasks"] == 4
    assert progress["completed_tasks"] == 2
    assert progress["in_progress_tasks"] == 1
    assert progress["pending_tasks"] == 1
    assert progress["completion_percentage"] == 50
    assert progress["estimated_remaining_hours"] == 10  # 5 + 5

    # Milestone 1: all tasks completed -> completed
    assert roadmap["milestones"][0]["status"] == "completed"
    # Milestone 2: 1 in_progress, 1 not_started -> in_progress
    assert roadmap["milestones"][1]["status"] == "in_progress"
    assert progress["completed_milestones"] == 1
    assert progress["in_progress_milestones"] == 1
    assert roadmap["status"] == "active"

    # Mark remaining tasks completed
    roadmap["milestones"][1]["tasks"][0]["status"] = "completed"
    roadmap["milestones"][1]["tasks"][1]["status"] = "completed"
    final_progress = RoadmapProgressService.recalculate_roadmap_progress(roadmap)
    assert final_progress["completion_percentage"] == 100
    assert roadmap["milestones"][1]["status"] == "completed"
    assert roadmap["status"] == "completed"


# 3. Roadmap Generate Error Cases
@pytest.mark.asyncio
async def test_roadmap_generate_no_skill_gap(async_client: AsyncClient):
    headers = await register_and_login(async_client, email="no_gap@example.com")

    resp = await async_client.post("/api/v1/roadmaps/generate", headers=headers)
    assert resp.status_code == 400
    data = resp.json()
    assert data["error"]["code"] == "NO_SKILL_GAP_ANALYSIS"


# 4. Roadmap Full Workflow: Generate, Current, Progress, Tasks, Cross-user & Archive
@pytest.mark.asyncio
async def test_roadmap_full_workflow(
    async_client: AsyncClient, test_db: AsyncIOMotorDatabase
):
    headers = await register_and_login(async_client, email="roadmap_dev@example.com")

    # Fetch user id
    me_resp = await async_client.get("/api/v1/auth/me", headers=headers)
    user_id = me_resp.json()["id"]

    # 1. Insert resume and resume analysis
    from app.repositories.resume_repository import ResumeRepository
    from app.repositories.resume_analysis_repository import ResumeAnalysisRepository
    from app.repositories.skill_gap_repository import SkillGapRepository

    resume_repo = ResumeRepository(test_db)
    resume = await resume_repo.create({
        "user_id": user_id,
        "original_filename": "dev_resume.pdf",
        "storage_key": "private/test/dev_resume.pdf",
        "file_type": "pdf",
        "file_size_bytes": 1024,
        "status": "completed",
    })

    analysis_repo = ResumeAnalysisRepository(test_db)
    resume_analysis = await analysis_repo.create({
        "user_id": user_id,
        "resume_id": resume["id"],
        "overall_score": 80,
        "score_breakdown": {},
        "summary": "Junior engineer",
        "extracted_data": {"skills": ["Python", "FastAPI"]},
        "strengths": [],
        "improvements": [],
        "recommendations": [],
        "missing_information": [],
        "ats_observations": [],
        "detected_skills": [
            {"name": "Python", "category": "Languages", "status": "verified"},
            {"name": "FastAPI", "category": "Frameworks", "status": "verified"},
        ],
        "recommended_roles": ["Backend Developer"],
        "ai_metadata": {},
        "status": "completed",
    })

    # 2. Insert skill-gap analysis
    gap_repo = SkillGapRepository(test_db)
    gap_doc = await gap_repo.create({
        "user_id": user_id,
        "resume_id": resume["id"],
        "resume_analysis_id": resume_analysis["id"],
        "target_role_id": "backend-developer",
        "target_role_title": "Backend Developer",
        "match_percentage": 65,
        "summary": "Candidate matches Python and FastAPI.",
        "matched_skills": [
            {"name": "Python", "importance": 5, "category": "Languages"},
            {"name": "FastAPI", "importance": 4, "category": "Frameworks"},
        ],
        "partially_matched_skills": [
            {"name": "PostgreSQL", "importance": 4, "category": "Databases", "reason": "Basic queries"}
        ],
        "missing_skills": [
            {"name": "Docker", "importance": 4, "category": "DevOps"},
            {"name": "REST APIs", "importance": 5, "category": "Architecture"},
        ],
        "optional_skills": [],
        "recommendations": [],
        "is_stale": False,
    })

    # 3. Generate learning roadmap
    gen_resp = await async_client.post(
        "/api/v1/roadmaps/generate",
        headers=headers,
        json={"available_hours_per_week": 15},
    )
    assert gen_resp.status_code == 201
    roadmap_data = gen_resp.json()
    roadmap_id = roadmap_data["id"]

    assert roadmap_data["target_role_title"] == "Backend Developer"
    assert roadmap_data["status"] == "active"
    assert roadmap_data["completion_percentage"] == 0
    assert len(roadmap_data["milestones"]) >= 2

    first_milestone = roadmap_data["milestones"][0]
    assert len(first_milestone["tasks"]) >= 1
    target_task = first_milestone["tasks"][0]
    task_id = target_task["id"]

    # 4. Fetch GET /api/v1/roadmaps/current
    curr_resp = await async_client.get("/api/v1/roadmaps/current", headers=headers)
    assert curr_resp.status_code == 200
    assert curr_resp.json()["id"] == roadmap_id

    # 5. Update task to in_progress
    patch_resp1 = await async_client.patch(
        f"/api/v1/roadmaps/{roadmap_id}/tasks/{task_id}",
        headers=headers,
        json={"status": "in_progress"},
    )
    assert patch_resp1.status_code == 200
    updated1 = patch_resp1.json()
    assert updated1["milestones"][0]["tasks"][0]["status"] == "in_progress"
    assert updated1["milestones"][0]["status"] == "in_progress"

    # 6. Update task to completed
    patch_resp2 = await async_client.patch(
        f"/api/v1/roadmaps/{roadmap_id}/tasks/{task_id}",
        headers=headers,
        json={"status": "completed"},
    )
    assert patch_resp2.status_code == 200
    updated2 = patch_resp2.json()
    assert updated2["milestones"][0]["tasks"][0]["status"] == "completed"
    assert updated2["milestones"][0]["tasks"][0]["completed_at"] is not None
    assert updated2["completion_percentage"] > 0

    # 7. Check progress endpoint
    prog_resp = await async_client.get(
        f"/api/v1/roadmaps/{roadmap_id}/progress", headers=headers
    )
    assert prog_resp.status_code == 200
    prog_data = prog_resp.json()
    assert prog_data["completed_tasks"] >= 1
    assert prog_data["completion_percentage"] > 0

    # 8. Cross-user isolation: User B cannot access User A's roadmap
    headers_b = await register_and_login(async_client, email="user_b_rd@example.com")
    resp_b = await async_client.get(f"/api/v1/roadmaps/{roadmap_id}", headers=headers_b)
    assert resp_b.status_code == 404

    resp_b_patch = await async_client.patch(
        f"/api/v1/roadmaps/{roadmap_id}/tasks/{task_id}",
        headers=headers_b,
        json={"status": "completed"},
    )
    assert resp_b_patch.status_code == 404

    # 9. Stale roadmap detection: If a newer skill gap analysis is inserted
    await gap_repo.create({
        "user_id": user_id,
        "resume_id": resume["id"],
        "resume_analysis_id": resume_analysis["id"],
        "target_role_id": "full-stack-developer",
        "target_role_title": "Full Stack Developer",
        "match_percentage": 50,
        "summary": "Newer gap analysis.",
        "matched_skills": [],
        "partially_matched_skills": [],
        "missing_skills": [],
        "optional_skills": [],
        "recommendations": [],
        "is_stale": False,
    })

    stale_resp = await async_client.get("/api/v1/roadmaps/current", headers=headers)
    assert stale_resp.status_code == 200
    assert stale_resp.json()["is_stale"] is True

    # 10. Archive roadmap
    archive_resp = await async_client.patch(
        f"/api/v1/roadmaps/{roadmap_id}/archive", headers=headers
    )
    assert archive_resp.status_code == 200
    assert archive_resp.json()["status"] == "archived"

