# SkillBridge AI — Project Overview

**Version:** 1.0  
**Phase:** 1 — Planning and Foundation  
**Status:** Day 1 requirements baseline

## 1. Project summary

SkillBridge AI is an AI-powered career preparation platform that helps students, job seekers, and software developers identify skill gaps, build a personalized learning plan, practice technical and behavioral interviews, and track their career readiness.

The platform connects the user's career goal with their current skills and preparation activities. Its core journey is:

1. Create an account and complete a profile.
2. Upload a resume and receive an AI-assisted analysis.
3. Select a target job role and optionally provide a job description.
4. Identify skill gaps between the user's current profile and target role.
5. Generate a personalized learning roadmap.
6. Practice coding assessments and technical concepts.
7. Conduct text-based or voice-based AI interviews.
8. Receive structured feedback and performance insights.
9. Use interview and assessment results to update the learning roadmap.

## 2. Problem statement

Career preparation is often fragmented across resume tools, online courses, coding platforms, and mock interviews. Users may not know:
- Which skills they currently possess.
- Which skills are required for a target role.
- What they should learn next.
- Whether they are improving in interviews.
- How to practice realistic interviews and receive useful feedback.

SkillBridge AI aims to bring these activities into one guided, measurable workflow.

## 3. Objectives

- Help users understand their resume and skill profile.
- Compare current skills with target-role requirements.
- Generate actionable, prioritized learning roadmaps.
- Provide realistic AI interview practice.
- Support interview follow-up questions that adapt to previous answers.
- Provide voice-based interview practice where supported.
- Evaluate coding and technical practice.
- Track progress and readiness over time.
- Provide career guidance grounded in the user's profile and preparation history.

## 4. Target users

### Primary users
- Students preparing for internships and entry-level jobs.
- Fresh graduates preparing for placements.
- Job seekers preparing for career transitions.
- Software developers preparing for technical interviews.

### Secondary users
- Admins who manage platform configuration, users, and operational monitoring.

## 5. User roles

### User
A registered learner who manages their profile, resume, career goals, roadmaps, assessments, interviews, and progress.

### Admin
A privileged platform operator who manages users and platform-level content/configuration, monitors reported issues, and reviews operational activity. Admin access must be restricted and audited.

## 6. Core modules

1. Authentication and user profile
2. Resume upload and analysis
3. Target role and job-description management
4. Skill-gap analysis
5. Personalized learning roadmap
6. AI interview preparation
7. Adaptive interview follow-up questions
8. Voice interview experience
9. Coding and technical assessments
10. Interview reports and progress analytics
11. AI career assistant
12. Notifications and reminders
13. Admin and platform management

## 7. MVP scope

The MVP should deliver one complete end-to-end preparation journey:
- Register/login and manage profile.
- Upload a resume and view AI analysis.
- Select a target role.
- View skill gaps.
- Generate and manage a roadmap.
- Start a text-based AI interview.
- Generate relevant follow-up questions based on the user's answer.
- View interview feedback and history.
- See progress on a dashboard.

Voice interviews, coding execution, advanced analytics, and external integrations should be developed after the core journey is stable. Voice can be included in the MVP only if time and service availability allow; otherwise, it is a Phase 2 feature.

## 8. Out of scope for the initial MVP

- Guaranteed job placement or hiring predictions.
- Automatic job applications on behalf of users.
- A full course marketplace or hosting platform.
- Social networking and public user profiles.
- Paid subscriptions and billing.
- Native mobile applications.
- Real-time multi-user interview rooms.
- Fully automated proctoring.
- Employer/HR recruitment portal.

## 9. Success criteria

The MVP is considered successful when a user can:
- Create an account and securely sign in.
- Upload a supported resume.
- Review extracted resume information and AI analysis.
- Set a target job role.
- View a skill-gap report.
- Generate a roadmap and mark tasks complete.
- Complete a text interview with adaptive follow-ups.
- View feedback and previous interview results.
- See persisted data after signing out and back in.

Quality indicators:
- AI outputs are clearly presented as suggestions, not guarantees.
- Users can correct inaccurate extracted resume information.
- Long-running AI tasks show loading, failure, and retry states.
- User data is private and isolated by account.
- Core flows work on desktop and mobile-sized screens.

## 10. Technology baseline

| Layer | Planned technology |
|---|---|
| Frontend | React, TypeScript, Vite |
| UI | Tailwind CSS, shadcn/ui |
| API client | Axios |
| Server state | TanStack Query |
| Forms/validation | React Hook Form, Zod |
| Backend | FastAPI, Python |
| Validation | Pydantic |
| Database | MongoDB |
| Authentication | JWT access/refresh token approach |
| AI provider | Provider abstraction for OpenAI/Gemini or compatible LLM |
| Resume parsing | PyMuPDF or equivalent; DOCX parser if supported |
| Voice | Browser speech APIs or external speech-to-text/text-to-speech service |
| Coding execution | Judge0 or another isolated execution service (later phase) |

Technology choices may be revisited during architecture design (Day 2).

## 11. Key assumptions and constraints

- AI responses may be incorrect; users must be able to review and correct important information.
- Resume uploads must be validated for type and size.
- Uploaded files should not be exposed through public URLs.
- AI provider keys remain on the backend and are never sent to the frontend.
- Voice recognition and playback depend on browser/device support and permissions.
- Coding submissions must run in a sandboxed external execution environment, not directly on the application server.
- MVP scope must prioritize a working end-to-end flow over implementing every advanced feature.

## 12. Risks

| Risk | Mitigation |
|---|---|
| AI output is inaccurate | Allow edits, show rationale/evidence where possible, avoid presenting scores as definitive |
| AI API cost or rate limits | Track usage, limit requests, add provider abstraction and retry handling |
| Resume contains sensitive data | Private storage, access control, retention/deletion controls |
| Voice APIs differ by browser | Feature detection and text-mode fallback |
| Scope becomes too large | Use MVP priorities and defer advanced features |
| Coding execution is unsafe | Use a dedicated sandbox provider; never execute arbitrary code on FastAPI host |

## 13. Project phases

- **Phase 1:** Planning, architecture, UI/UX, and project setup.
- **Phase 2:** Authentication, user profile, and persistence.
- **Phase 3:** Resume upload, parsing, and AI analysis.
- **Phase 4:** Target roles, skill-gap analysis, and roadmaps.
- **Phase 5:** AI interviews, adaptive follow-ups, and reports.
- **Phase 6:** Coding assessments and voice interviews.
- **Phase 7:** Career assistant, analytics, polish, testing, and deployment.

## 14. Day 1 decisions to carry forward

- Build a learner-focused career preparation product.
- Make the preparation journey cohesive and progress-oriented.
- Prioritize the resume → target role → skill gap → roadmap → interview → feedback flow.
- Treat voice interviews and coding execution as advanced features unless the MVP timeline permits them.
- Keep AI provider integration behind backend services.
