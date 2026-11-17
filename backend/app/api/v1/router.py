from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, profiles, resumes, job_roles, skill_gap, roadmaps, interviews, speech

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(profiles.router)
api_router.include_router(resumes.router)
api_router.include_router(job_roles.router)
api_router.include_router(skill_gap.router)
api_router.include_router(roadmaps.router)
api_router.include_router(interviews.router)
api_router.include_router(speech.router)
