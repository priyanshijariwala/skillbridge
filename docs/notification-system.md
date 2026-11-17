# Notification System & Email Integration — SkillBridge AI (Day 15)

## 1. Feature Overview

The **Notification System & Email Integration** module provides SkillBridge AI with a production-grade, centralized event-driven notification architecture. The system supports:
- **In-App Notifications**: Real-time actionable notifications displayed via the header notification bell, popover dropdown, and dedicated notification history center.
- **Transactional Emails**: Responsive, branded HTML and plain-text emails dispatched across critical candidate milestones (welcome, resume analysis, skill-gap benchmarks, learning roadmap generation, interview evaluations, and coding verdicts).
- **Granular Notification Preferences**: Self-service user preferences for master email controls and category-level opt-outs, with mandatory lock-in for critical account security alerts.
- **Asynchronous Background Delivery**: Non-blocking asynchronous task execution with bounded exponential backoff retries, ensuring API request latency is never impacted by downstream email delivery.
- **Delivery Audit Logs**: Comprehensive delivery tracking in `email_logs` without storing sensitive email contents.

---

## 2. Architecture

```text
 Domain Events (Registration, Resume, Skill Gap, Roadmap, Interview, Coding)
                                 │
                                 ▼
                     Notification Service
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
       In-App Notification              Preference Check
                 │                               │
                 ▼                               ▼
        MongoDB (notifications)          Asynchronous Email Job
                                                 │
                                                 ▼
                                        Email Worker & Retry Loop
                                                 │
                                                 ▼
                                        Email Provider Adapter
                                         (Mock / SMTP / API)
                                                 │
                                                 ▼
                                        MongoDB (email_logs)
```

### Event Flow
1. **Event Emission**: Domain endpoints (e.g. `/auth/register`, `/resumes/{id}/analysis`, `/interviews/{id}/complete`) emit a structured `NotificationEvent` upon successful state transitions.
2. **In-App Persistence**: The notification service persists the unread notification record in MongoDB collection `notifications`.
3. **Preference Validation**: Recipient preferences in `notification_preferences` are evaluated. If email delivery is opted out (and the event is not an essential security notification), email delivery is safely suppressed.
4. **Asynchronous Execution**: If approved, an asynchronous task is enqueued to process the email template, establish provider communication, handle retries, and write audit logs.

---

## 3. MongoDB Collection Design

### A. `notifications`
Stores in-app notifications per user.
```json
{
  "_id": "ObjectId",
  "user_id": "string",
  "title": "Resume Analysis Completed",
  "message": "Your resume analysis is ready. Overall profile match: 85%.",
  "type": "success",
  "category": "resume",
  "is_read": false,
  "action_url": "/resume",
  "metadata": {},
  "created_at": "ISODate",
  "read_at": null
}
```
**Indexes**:
- `(user_id, created_at: -1)`
- `(user_id, is_read: 1)`
- `(user_id, category: 1)`

### B. `notification_preferences`
Stores per-user notification and email settings.
```json
{
  "_id": "ObjectId",
  "user_id": "string",
  "email_enabled": true,
  "category_preferences": {
    "account": true,
    "resume": true,
    "skill_gap": true,
    "roadmap": true,
    "interview": true,
    "coding": true,
    "security": true
  },
  "created_at": "ISODate",
  "updated_at": "ISODate"
}
```
**Indexes**:
- `user_id` (Unique)

### C. `email_logs`
Tracks transactional email delivery attempts and provider message identifiers without persisting confidential message bodies.
```json
{
  "_id": "ObjectId",
  "user_id": "string",
  "recipient_email": "candidate@example.com",
  "template": "welcome",
  "subject": "Welcome to SkillBridge AI",
  "status": "sent",
  "provider": "smtp",
  "provider_message_id": "smtp-d2847a98b2c4",
  "attempt_count": 1,
  "last_error": null,
  "metadata": {},
  "created_at": "ISODate",
  "sent_at": "ISODate",
  "updated_at": "ISODate"
}
```
**Indexes**:
- `(user_id, created_at: -1)`
- `(status: 1)`

---

## 4. Email Templates & Categories

SkillBridge AI features responsive, dark-mode aligned HTML emails with plain-text counterparts:

| Template Identifier | Category | Trigger Condition | Default Subject |
|---|---|---|---|
| `welcome` | `account` | Successful candidate registration | *Welcome to SkillBridge AI — Ready for your career transformation?* |
| `resume_analysis_completed` | `resume` | Resume parsing & AI extraction finished | *Your Resume Analysis is Ready — SkillBridge AI* |
| `skill_gap_analysis_completed` | `skill_gap` | Role benchmark comparison generated | *Skill Gap Analysis Complete — Discover What to Learn Next* |
| `roadmap_generated` | `roadmap` | Adaptive learning milestones compiled | *Your Personalized Learning Roadmap is Ready — SkillBridge AI* |
| `interview_completed` | `interview` | Mock interview finalized with scores | *Mock Interview Feedback & Evaluation — SkillBridge AI* |
| `coding_assessment_evaluated` | `coding` | Sandbox evaluation completed | *Coding Assessment Result — SkillBridge AI* |
| `security_alert` | `security` | Password change or security events | *Security Alert: Important Account Activity — SkillBridge AI* |

---

## 5. Background Processing & Retry Strategy

### Asynchronous Execution
- Background delivery is decoupled from HTTP handlers via non-blocking asyncio tasks.
- API endpoints respond immediately after in-app persistence.

### Bounded Exponential Backoff
- When a transient network or server error occurs (e.g. SMTP 421, socket timeout, 503 from provider API), the worker retries up to `EMAIL_MAX_RETRIES` (default: 3 attempts).
- Backoff formula: `delay = EMAIL_RETRY_BACKOFF_SECONDS * (2 ^ (attempt - 1))`.
- Permanent failures (e.g. invalid recipient address, authentication rejection) are logged immediately without futile retries.

---

## 6. REST API Reference

All endpoints require JWT Bearer authentication (`Authorization: Bearer <token>`):

### 1. List Notifications
`GET /api/v1/notifications`
- **Query Parameters**:
  - `is_read` (*optional boolean*): Filter by read (`true`) or unread (`false`)
  - `category` (*optional string*): Filter by category
  - `page` (*integer*, default: 1): Page index
  - `page_size` (*integer*, default: 20): Items per page
- **Response**: `200 OK` (`NotificationListResponse` containing `items`, `total`, `unread_count`, `page`, `page_size`)

### 2. Get Unread Count
`GET /api/v1/notifications/unread-count`
- **Response**: `200 OK` (`{"unread_count": 3}`)

### 3. Mark Single Notification as Read
`PATCH /api/v1/notifications/{notification_id}/read`
- **Response**: `200 OK` (`NotificationRead`)

### 4. Mark All Notifications as Read
`PATCH /api/v1/notifications/read-all`
- **Response**: `200 OK` (`{"unread_count": 0}`)

### 5. Delete Notification
`DELETE /api/v1/notifications/{notification_id}`
- **Response**: `204 No Content`

### 6. Get Notification Preferences
`GET /api/v1/notification-preferences`
- **Response**: `200 OK` (`NotificationPreferenceRead`)

### 7. Update Notification Preferences
`PUT /api/v1/notification-preferences`
- **Request Body**: `NotificationPreferenceUpdate`
- **Response**: `200 OK` (`NotificationPreferenceRead`)
- *Note*: Security notifications remain permanently locked to `true`.

---

## 7. Environment Variables

| Variable | Description | Default Value | Required in Production |
|---|---|---|---|
| `EMAIL_PROVIDER` | Email provider backend (`mock`, `smtp`, `sendgrid`, `resend`) | `mock` | Yes (set to `smtp` or API) |
| `EMAIL_FROM_ADDRESS` | Sender email address | `notifications@skillbridge.ai` | Yes |
| `EMAIL_FROM_NAME` | Sender display name | `SkillBridge AI` | No |
| `SMTP_HOST` | Hostname of SMTP server | `localhost` | If using SMTP |
| `SMTP_PORT` | SMTP port | `587` | If using SMTP |
| `SMTP_USERNAME` | SMTP authentication user | `None` | If using SMTP |
| `SMTP_PASSWORD` | SMTP authentication secret | `None` | If using SMTP |
| `SMTP_USE_TLS` | Enable STARTTLS encryption | `True` | If using SMTP |
| `EMAIL_API_KEY` | Provider API key (SendGrid / Resend) | `None` | If using API provider |
| `EMAIL_MAX_RETRIES` | Max attempts for transient failures | `3` | No |
| `EMAIL_RETRY_BACKOFF_SECONDS` | Initial retry delay in seconds | `1.0` | No |
| `FRONTEND_URL` | Base URL for action links in emails | `http://localhost:5173` | Yes |

---

## 8. Frontend Notification Components

- [`NotificationBell`](file:///Users/macos/Documents/Skillbridge/frontend/src/features/notifications/components/NotificationBell.tsx): Header bell button with live unread badge and dropdown toggle.
- [`NotificationDropdown`](file:///Users/macos/Documents/Skillbridge/frontend/src/features/notifications/components/NotificationDropdown.tsx): Compact popover displaying recent notifications, quick actions, and settings links.
- [`NotificationItem`](file:///Users/macos/Documents/Skillbridge/frontend/src/features/notifications/components/NotificationItem.tsx): Notification item component with category icon, relative timestamps, and action links.
- [`NotificationPage`](file:///Users/macos/Documents/Skillbridge/frontend/src/features/notifications/pages/NotificationPage.tsx): Dedicated `/notifications` history page with tabs, category filters, and pagination.
- [`NotificationSettingsPage`](file:///Users/macos/Documents/Skillbridge/frontend/src/features/notifications/pages/NotificationSettingsPage.tsx): Dedicated `/settings/notifications` page for managing email preferences.

---

## 9. Verification & Testing

### Backend Tests
```bash
cd backend && .venv/bin/python -m pytest tests/test_notifications.py -v
```
- **Result**: `7 passed, 0 failed in 5.22s`
- **Total Suite**: `114 passed, 0 failed in 29.76s` (covering auth, resume, skill-gap, roadmaps, interview, speech, assistant, coding, and notifications).

### Frontend Tests
```bash
cd frontend && npx vitest run NotificationSystem
```
- **Result**: `12 passed, 0 failed in 2.64s`
- **Total Suite**: `111 passed, 0 failed across 13 test files in 10.72s`.

### Production Build
```bash
cd frontend && npm run build
```
- **Result**: `✓ built in 1.61s`, 0 TypeScript errors.

