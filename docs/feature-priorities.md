# SkillBridge AI — Feature Priorities

**Version:** 1.0  
**Phase:** 1 — Planning and Foundation

## 1. Prioritization framework

- **P0 — MVP / Must have:** Needed to deliver the core learner journey.
- **P1 — Should have:** Adds meaningful value after the MVP foundation is stable.
- **P2 — Advanced / Could have:** Requires additional infrastructure, integrations, or refinement.
- **P3 — Future / Not now:** Not part of the initial implementation.

## 2. Feature priority matrix

| Feature | Priority | MVP? | Reason / dependency |
|---|---:|---|---|
| Registration and login | P0 | Yes | Required for saved user data |
| User profile | P0 | Yes | Personalization context |
| Resume upload (PDF) | P0 | Yes | Main entry point for preparation |
| Resume text extraction | P0 | Yes | Required before analysis |
| AI resume analysis | P0 | Yes | Core product value |
| Target role selection | P0 | Yes | Defines preparation goal |
| Skill-gap analysis | P0 | Yes | Connects current skills to target role |
| Basic personalized roadmap | P0 | Yes | Converts gaps into actions |
| Roadmap task completion | P0 | Yes | Enables progress tracking |
| Text-based AI interview | P0 | Yes | Core interview preparation |
| Adaptive follow-up questions | P0 | Yes | Important differentiator; keep bounded in MVP |
| Interview feedback/report | P0 | Yes | Closes the practice loop |
| Dashboard with recent activity | P0 | Yes | Entry point and progress summary |
| Interview history | P0 | Yes | Enables reviewing progress |
| Behavioral + technical interview modes | P1 | After core MVP | More question templates and evaluation |
| Voice interview (speech-to-text) | P1 | After text interview | Browser/service compatibility and permissions |
| Voice questions (text-to-speech) | P1 | After text interview | Audio experience and fallback handling |
| Coding problem catalog | P1 | After MVP | Requires problem content and evaluation design |
| Code execution integration | P2 | Advanced | Requires secure sandbox provider |
| Career assistant chat | P1 | After core MVP | Context retrieval and conversation persistence |
| Context-aware roadmap updates | P1 | After feedback flow | Requires reliable assessment data |
| Notifications/reminders | P1 | After roadmap | Scheduling and user preferences |
| Advanced analytics and readiness trends | P1 | After history data | Needs sufficient longitudinal data |
| OAuth/social login | P2 | Optional | Additional provider integration |
| Resume templates/builder | P2 | Optional | Separate editing experience |
| Job search and job matching | P2 | Optional | External data/integration requirements |
| Mock interview scheduling | P2 | Optional | Scheduling and calendar integration |
| Admin analytics dashboard | P2 | Optional | Useful after users and activity grow |
| Subscription/billing | P3 | No | Not needed to validate MVP |
| Employer/recruiter portal | P3 | No | Different product audience |
| Native mobile app | P3 | No | Responsive web is sufficient initially |
| Automated job applications | P3 | No | Out of scope for MVP |
| Social/community features | P3 | No | Not needed for core journey |

## 3. MVP user journey

The first release should support this complete path:

1. Register and sign in.
2. Complete basic profile.
3. Upload resume.
4. Review resume analysis.
5. Select target role.
6. Run skill-gap analysis.
7. Generate learning roadmap.
8. Complete or update roadmap tasks.
9. Start a text interview.
10. Answer questions and receive adaptive follow-ups.
11. Finish interview and view feedback.
12. Review progress from dashboard/history.

## 4. MVP exclusions and implementation guardrails

- Do not build voice mode before text interviews are reliable.
- Do not execute user code directly in FastAPI.
- Do not build a course marketplace; roadmap tasks can link to learning resources.
- Do not add payment/billing during the MVP.
- Do not make AI recommendations automatically irreversible; users should review and edit.
- Avoid building many disconnected mock screens; prioritize persisted, working flows.

## 5. Suggested release slices

### MVP Slice A — Foundation
Authentication, profile, frontend shell, backend setup, MongoDB persistence.

### MVP Slice B — Career profile
Resume upload, parsing, analysis, target role.

### MVP Slice C — Preparation plan
Skill-gap analysis, roadmap generation, task completion.

### MVP Slice D — Interview practice
Interview setup, question/answer flow, adaptive follow-ups, report/history.

### MVP Slice E — Product completion
Dashboard integration, loading/error/empty states, tests, security review, responsive polish.

## 6. Day 1 scope decision

**Build first:** Resume analysis → target role → skill gaps → roadmap → text interview → adaptive follow-up → feedback.

**Build next:** Voice interviews, coding assessments, contextual career assistant, notifications, and advanced analytics.

**Build later:** Billing, employer portal, native mobile application, and job-application automation.
