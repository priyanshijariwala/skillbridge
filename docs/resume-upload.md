# Resume Upload

> Day 7 — SkillBridge AI

## Overview

Resumes are uploaded as multipart/form-data, stored securely on the server filesystem, and their metadata is persisted in the `resumes` MongoDB collection. Binary file content is **never stored in MongoDB**.

> [!IMPORTANT]
> AI resume parsing and analysis are **not implemented in Day 7**. Resume status remains `uploaded` after upload. AI analysis will be added in a future phase.

## Supported File Formats

| Format | Extension | MIME Type |
|--------|-----------|-----------|
| PDF | `.pdf` | `application/pdf` |
| DOCX | `.docx` | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` |

**Maximum file size:** 5 MB (configurable via `MAX_RESUME_SIZE_MB` in `.env`)

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/v1/resumes` | Bearer | Upload resume (`multipart/form-data`, field: `file`) |
| `GET` | `/api/v1/resumes` | Bearer | List user's resumes (newest first) |
| `GET` | `/api/v1/resumes/{id}` | Bearer | Get resume metadata |
| `GET` | `/api/v1/resumes/{id}/download` | Bearer | Download resume file |
| `DELETE` | `/api/v1/resumes/{id}` | Bearer | Delete resume and file |

## File Validation

Each upload is validated in this order:

1. **Non-empty** — file size > 0 bytes
2. **Size limit** — file ≤ `MAX_RESUME_SIZE_MB` MB
3. **Extension whitelist** — `.pdf` or `.docx` only
4. **MIME type whitelist** — must match allowed MIME types
5. **Magic bytes check** — PDF must start with `%PDF-`; DOCX must start with `PK\x03\x04`

## Storage Architecture

```
LocalStorage (development)
  base_path = ./private_uploads/resumes   (from .env)
  storage_key = resumes/<uuid>.<ext>      (returned by save_file)

Future extensions:
  S3Storage → s3://bucket/resumes/<uuid>.<ext>
  CloudinaryStorage → cloudinary://...
```

Storage is abstracted via `BaseStorage` → `LocalStorage` / S3Storage.
The factory `get_storage()` returns the configured backend (cached).

> [!CAUTION]
> `private_uploads/` is in `.gitignore`. Do NOT commit uploaded files.

## MongoDB Schema (`resumes` collection)

```json
{
  "_id": ObjectId,
  "user_id": "string",
  "original_filename": "string",
  "storage_key": "string (internal only — never sent to client)",
  "file_type": "pdf | docx",
  "file_size_bytes": 123456,
  "content_hash": "sha256 hex string",
  "status": "uploaded",
  "created_at": ISODate,
  "updated_at": ISODate
}
```

**Indexes:**
- `(user_id, created_at)` compound index

## Security Measures

- `storage_key` (internal filesystem path) is **never exposed** in API responses
- Path traversal attacks prevented in `LocalStorage._resolve_safe()`
- Atomic file writes (temp → rename) prevent partial writes
- UUID-based filenames prevent collisions and enumeration
- All resume operations enforce ownership at the DB query level (`user_id` match)
- File is validated before storage write

## Download Flow

1. Client calls `GET /api/v1/resumes/{id}/download`
2. Server verifies ownership (user_id from JWT matches resume.user_id)
3. File is read from storage using `storage_key`
4. Response includes:
   - `Content-Type` matching file type
   - `Content-Disposition: attachment; filename="<original_name>"`  (RFC 5987 encoding)
5. Client receives binary content

## Delete Flow

1. `DELETE /api/v1/resumes/{id}` — ownership verified
2. File deleted from storage (`delete_file(storage_key)`)
3. If storage deletion fails → logs warning, continues
4. DB record removed regardless

## Frontend Integration

- **Hook:** `useListResumes()` — lists resumes with 2-minute stale time
- **Hook:** `useUploadResume()` — mutation with `onUploadProgress` callback
- **Hook:** `useDeleteResume()` — mutation with cache invalidation
- **Hook:** `useDownloadResume()` — triggers browser download via blob URL
- **Service:** `resumeService` in `src/services/resume.service.ts`
- **Client-side validation:** Zod schema checks extension, MIME, and size before upload
- File input uses `accept=".pdf,.docx"` and is hidden; triggered by click/drop zone

## Known Limitations (Day 7 Scope)

- Resume status stays `"uploaded"` — AI parsing is Day 8+
- No resume version history — each upload creates a new record
- No deduplication by content hash (hash stored but not enforced)
- Download uses full in-memory read — suitable for ≤5 MB files
- S3 / Cloudinary storage not implemented; `LocalStorage` only

