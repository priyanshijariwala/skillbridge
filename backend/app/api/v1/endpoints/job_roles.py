from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db.mongodb import get_database
from app.repositories.job_role_repository import JobRoleRepository
from app.schemas.job_role import JobRoleListResponse, JobRoleRead

router = APIRouter(prefix="/job-roles", tags=["Job Roles"])


@router.get("", response_model=JobRoleListResponse)
async def list_job_roles(
    q: Optional[str] = Query(None, description="Search by title, slug, or keywords"),
    category: Optional[str] = Query(None, description="Filter by category"),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> JobRoleListResponse:
    """List available target job roles with optional search and category filters."""
    repo = JobRoleRepository(db)
    roles = await repo.list_roles(search=q, category=category)
    return JobRoleListResponse(items=[JobRoleRead(**r) for r in roles], total=len(roles))


@router.get("/{role_id}", response_model=JobRoleRead)
async def get_job_role(
    role_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> JobRoleRead:
    """Retrieve detailed requirements and skills for a specific job role by ID or slug."""
    repo = JobRoleRepository(db)
    role = await repo.find_by_id_or_slug(role_id)
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job role '{role_id}' not found.",
        )
    return JobRoleRead(**role)

