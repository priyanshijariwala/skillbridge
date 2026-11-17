# Profile Management

> Day 7 — SkillBridge AI

## Overview

User profiles are stored in a dedicated `profiles` collection separate from the `users` collection. The `/api/v1/profiles/me` endpoint returns a merged view of career profile data plus the user's `display_name` and `email` from the `users` collection.

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/v1/users/me` | Bearer | Return current user account |
| `PATCH` | `/api/v1/users/me` | Bearer | Update display name |
| `GET` | `/api/v1/profiles/me` | Bearer | Get career profile (creates default on first access) |
| `PUT` | `/api/v1/profiles/me` | Bearer | Upsert career profile |

## Profile Fields

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `full_name` | string | 2–100 chars | Stored in `users.display_name` |
| `email` | string | read-only | From `users.email` |
| `headline` | string | max 200 chars | Professional headline |
| `bio` | string | max 1000 chars | Career summary |
| `target_role_title` | string | max 200 chars | Target job title |
| `target_seniority` | enum | Junior / Mid / Senior / Lead / Staff / Principal | — |
| `years_of_experience` | int | 0–60 | — |
| `skills` | string[] | max 100 entries | Stored in `profiles` collection |
| `education` | EducationDTO[] | — | degree, institution, graduation_year |
| `linkedin_url` | string | must start `https://` | Optional |
| `github_url` | string | must start `https://` | Optional |
| `portfolio_url` | string | must start `https://` | Optional |

## Ownership Rules

- **Never trust user_id from frontend.** The `user_id` is always taken from the JWT `sub` claim via the `get_current_user` dependency.
- Unauthenticated requests return `401`.
- Users can only access and modify their own profile.

## Database Design

### `users` collection
```
{ _id, email, display_name, password_hash, role, is_active, email_verified, created_at, updated_at }
```

### `profiles` collection
```
{ user_id, headline, bio, target_role_title, target_seniority, years_of_experience, skills, education, linkedin_url, github_url, portfolio_url, created_at, updated_at }
```

**Indexes:**
- `profiles.user_id` — unique index

## Default Profile Behaviour

On first `GET /api/v1/profiles/me`, if no document exists for the user, a minimal default profile is inserted with `skills: []`. The response always returns a valid `ProfileRead` object.

## Frontend Integration

- **Hook:** `useGetProfile()` — TanStack Query, 5-minute stale time
- **Hook:** `useUpdateProfile()` — mutation with cache setData on success
- **Service:** `profileService.getMyProfile()` / `updateProfile(payload)`
- **Screen:** `ProfileScreen.tsx` populates form via `useEffect` on profile data load
- Email field is **read-only** in the UI
- `full_name` changes also update `users.display_name` via `PATCH /users/me`

## Validation

**Backend (Pydantic):**
- URLs validated to start with `http://` or `https://`
- `target_seniority` must be one of the allowed enum values
- Skill list capped at 100 entries

**Frontend (Zod):**
- Same URL validation
- `full_name` min 2 chars
- Headline max 200 chars, bio max 1000 chars

