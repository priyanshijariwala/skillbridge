# SkillBridge AI — API Design

**Base path:** `/api/v1` · Initial MVP REST contract

## Conventions
- JSON except file uploads (`multipart/form-data`).
- `snake_case` fields; MongoDB IDs exposed as strings.
- UTC ISO 8601 timestamps.
- Protected endpoints require authentication.
- Scope user-owned resources to the current authenticated user.
- Pagination: `page`, `page_size`; cap page size (e.g. 100).
- Use `202 Accepted` for asynchronous AI processing.

## Auth
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auth/register` | Register |
| POST | `/auth/login` | Login |
| POST | `/auth/refresh` | Rotate refresh token |
| POST | `/auth/logout` | Revoke session |
| GET | `/auth/me` | Current user |

## User/profile
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/users/me` | Get user |
| PATCH | `/users/me` | Update account fields |
| GET | `/profiles/me` | Get career profile |
| PUT | `/profiles/me` | Create/update profile |

## Resume
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/resumes` | Upload |
| GET | `/resumes` | List |
| GET | `/resumes/{resume_id}` | Metadata |
| DELETE | `/resumes/{resume_id}` | Delete |
| POST | `/resumes/{resume_id}/analysis` | Start analysis |
| GET | `/resumes/{resume_id}/analysis` | Get latest analysis/status |

Use singular `/analysis` for latest analysis. If analysis history is needed, add `/resume-analyses/{analysis_id}`.

## Roles, skill-gap, roadmap
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/job-roles` | List/search roles |
| GET | `/job-roles/{role_id}` | Role detail |
| POST | `/skill-gap-analyses` | Generate gap analysis |
| GET | `/skill-gap-analyses` | List user's analyses |
| GET | `/skill-gap-analyses/{analysis_id}` | Get analysis |
| POST | `/roadmaps` | Generate roadmap |
| GET | `/roadmaps` | List |
| GET | `/roadmaps/{roadmap_id}` | Get roadmap |
| PATCH | `/roadmaps/{roadmap_id}/tasks/{task_id}` | Update task |

## Interviews
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/interviews` | Create session/first question |
| GET | `/interviews` | History |
| GET | `/interviews/{interview_id}` | Session details |
| GET | `/interviews/{interview_id}/messages` | Transcript |
| POST | `/interviews/{interview_id}/answers` | Submit answer; next prompt |
| POST | `/interviews/{interview_id}/complete` | Finish and generate report |
| GET | `/interviews/{interview_id}/feedback` | Final report |

## Dashboard
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/dashboard/summary` | Progress, active roadmap, recent activity |

## Example: create interview
`POST /api/v1/interviews`

```json
{
  "target_role_id": "665000000000000000000001",
  "interview_type": "technical",
  "difficulty": "medium",
  "mode": "text",
  "settings": {"main_question_limit": 8, "follow_up_limit_per_question": 2}
}
```

`201 Created`:

```json
{
  "id": "665000000000000000000010",
  "target_role_title": "Backend Engineer",
  "interview_type": "technical",
  "difficulty": "medium",
  "mode": "text",
  "status": "in_progress",
  "current_question": {
    "message_id": "665000000000000000000011",
    "sequence": 1,
    "role": "assistant",
    "message_type": "question",
    "content": "Explain dependency injection in FastAPI."
  },
  "created_at": "2026-11-04T10:00:00Z"
}
```

## Example: submit answer
`POST /api/v1/interviews/{interview_id}/answers`

```json
{"answer": "Dependency injection allows reusable dependencies..."}
```

Example response:

```json
{
  "saved_answer_id": "665000000000000000000012",
  "evaluation": {
    "score": 4,
    "strengths": ["Correct core concept"],
    "improvements": ["Give a practical example"]
  },
  "next_message": {
    "message_id": "665000000000000000000013",
    "role": "assistant",
    "message_type": "follow_up",
    "content": "How would you use dependency injection for database access?"
  },
  "interview_status": "in_progress"
}
```

## Example: start skill-gap analysis
`POST /api/v1/skill-gap-analyses`

```json
{"resume_id": "665000000000000000000020", "target_role_id": "665000000000000000000001"}
```

Possible `202 Accepted` response:

```json
{"id": "665000000000000000000021", "status": "processing"}
```

## Error format
```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "The requested resource was not found.",
    "details": [],
    "request_id": "opaque-request-id"
  }
}
```

| Status | Meaning |
|---|---|
| 400 | Invalid request/business rule |
| 401 | Missing/invalid authentication |
| 403 | Authenticated but forbidden |
| 404 | Missing/inaccessible resource |
| 409 | Conflict (e.g. duplicate email) |
| 413 | File too large |
| 422 | Validation error |
| 429 | Rate limit exceeded |
| 500 | Unexpected error |
| 502/503 | AI/dependency unavailable |

Do not return stack traces, database errors, or provider secrets.

## Validation rules
- Validate IDs, enums, upload size/type, and resource references.
- Reject answers for completed interviews.
- Verify roadmap task belongs to the user's roadmap.
- Verify resume and role are accessible.
- Rate-limit uploads and AI requests.
- Use request IDs for diagnostics.
- Keep schemas explicit; do not return raw MongoDB documents.

## Implementation order
1. Auth/current user
2. Profile
3. Resume upload/list/delete
4. Resume analysis
5. Job roles
6. Skill-gap
7. Roadmap
8. Interview flow/report
9. Dashboard
