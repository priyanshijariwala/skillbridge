# SkillBridge AI — Functional Requirements

**Version:** 1.0  
**Phase:** 1 — Planning and Foundation

## 1. Authentication and account management

### FR-AUTH-01 — Registration
The system shall allow a user to register with name, email, and password.

### FR-AUTH-02 — Login
The system shall authenticate users using valid credentials.

### FR-AUTH-03 — Logout
The system shall allow users to log out and clear client-side authentication state.

### FR-AUTH-04 — Current user
The system shall provide an endpoint to retrieve the authenticated user's profile.

### FR-AUTH-05 — Profile management
Users shall be able to view and update profile information, including name, experience level, education, and career interests.

### FR-AUTH-06 — Protected access
The system shall prevent unauthenticated users from accessing protected user data.

## 2. Resume upload and analysis

### FR-RES-01 — Upload resume
Users shall be able to upload a resume in supported formats (initially PDF; DOCX may be added).

### FR-RES-02 — File validation
The system shall validate file type and size and return understandable errors for invalid uploads.

### FR-RES-03 — Resume parsing
The backend shall extract text and relevant sections from the uploaded resume.

### FR-RES-04 — AI resume analysis
The system shall analyze resume content and return structured information such as:
- Summary
- Skills
- Work experience
- Education
- Projects
- Strengths
- Potential improvement areas
- Suggestions for clarity and impact

### FR-RES-05 — Analysis history
Users shall be able to view their previous resume uploads and analyses.

### FR-RES-06 — User correction
Users shall be able to correct extracted profile/skill information before relying on it for later recommendations.

### FR-RES-07 — Resume privacy
Only the resume owner and authorized system processes shall be able to access the resume.

## 3. Target role and job description

### FR-ROLE-01 — Target role selection
Users shall be able to select or enter a target job role (e.g., Backend Developer, Frontend Developer, Full Stack Developer).

### FR-ROLE-02 — Job description
Users shall optionally paste a job description for a more specific analysis.

### FR-ROLE-03 — Role requirements
The system shall maintain or generate a structured set of skills and competencies for a target role.

## 4. Skill-gap analysis

### FR-SKILL-01 — Compare skills
The system shall compare the user's resume/profile skills with target-role requirements.

### FR-SKILL-02 — Skill classification
The system shall categorize skills as matched, partially matched, or missing/needs improvement.

### FR-SKILL-03 — Gap report
The system shall display a report with skill name, current level (where available), target level, priority, and recommended next action.

### FR-SKILL-04 — Explain recommendations
The system shall provide a concise explanation for why a skill is recommended, including the target role or job-description requirement where available.

### FR-SKILL-05 — Update analysis
Users shall be able to rerun skill-gap analysis after changing their profile, resume, or target role.

## 5. Learning roadmap

### FR-ROAD-01 — Generate roadmap
The system shall generate a personalized roadmap based on the user's target role, skill gaps, experience level, and available study time.

### FR-ROAD-02 — Roadmap structure
A roadmap shall contain ordered milestones, learning tasks, estimated duration, priority, and completion status.

### FR-ROAD-03 — Task completion
Users shall be able to mark roadmap tasks complete or incomplete.

### FR-ROAD-04 — Progress tracking
The system shall calculate and display roadmap completion progress.

### FR-ROAD-05 — Roadmap updates
Users shall be able to regenerate or revise a roadmap after new interview or assessment results.

### FR-ROAD-06 — User control
Users shall be able to review and edit roadmap tasks; AI-generated plans shall not be treated as immutable.

## 6. AI interviews

### FR-INT-01 — Interview setup
Users shall be able to configure an interview by target role, interview type, difficulty, duration, and relevant skills.

### FR-INT-02 — Interview session
The system shall create an interview session and present questions one at a time.

### FR-INT-03 — Answer submission
Users shall be able to submit answers through text in the MVP.

### FR-INT-04 — Adaptive follow-up questions
The AI shall generate a relevant follow-up question based on the current question and user's answer, where appropriate.

### FR-INT-05 — Interview progression
The system shall track question order, answers, session status, and completion.

### FR-INT-06 — Interview completion
Users shall be able to finish an interview and receive a report.

### FR-INT-07 — Interview history
Users shall be able to view completed interviews and their reports.

### FR-INT-08 — Interview types
The system shall support behavioral and technical interview modes. Coding-oriented interviews may initially use conceptual questions rather than executing code.

## 7. Interview feedback and reports

### FR-FEEDBACK-01 — Feedback generation
The system shall generate feedback after an interview.

### FR-FEEDBACK-02 — Feedback dimensions
Feedback may include answer relevance, clarity, structure, technical accuracy, communication, strengths, and improvement areas.

### FR-FEEDBACK-03 — Suggested answer improvement
The system shall provide actionable suggestions or an example of how an answer could be improved.

### FR-FEEDBACK-04 — Skill mapping
The system shall map interview feedback to relevant skills and, where appropriate, recommend roadmap updates.

### FR-FEEDBACK-05 — Feedback limitations
The system shall communicate that AI feedback is an estimate and not a guarantee of interview performance or hiring outcome.

## 8. Voice interviews (advanced / planned)

### FR-VOICE-01 — Voice input
The system shall support spoken answers using a supported speech-to-text mechanism.

### FR-VOICE-02 — Voice output
The system shall read interview questions aloud using text-to-speech where supported.

### FR-VOICE-03 — Permission and fallback
The system shall request microphone permission and provide a text-mode fallback if voice is unavailable or denied.

### FR-VOICE-04 — Transcript
The system shall display or preserve a transcript of spoken answers for feedback, subject to user consent and retention settings.

### FR-VOICE-05 — Voice session controls
Users shall be able to start, stop, replay, and submit spoken answers.

## 9. Coding and technical assessments (advanced / planned)

### FR-CODE-01 — Assessment selection
Users shall be able to select a coding or technical assessment by topic and difficulty.

### FR-CODE-02 — Problem details
The system shall display a problem statement, examples, constraints, and supported language options.

### FR-CODE-03 — Code submission
The system shall submit code to an isolated execution service.

### FR-CODE-04 — Results
The system shall display execution status, test results, and feedback returned by the execution provider.

### FR-CODE-05 — Safety
The application shall not execute untrusted code directly on its own backend host.

## 10. AI career assistant

### FR-CAREER-01 — Career questions
Users shall be able to ask career-preparation questions through a chat interface.

### FR-CAREER-02 — Contextual recommendations
The assistant may use the user's profile, target role, resume analysis, roadmap, and interview history when the user has authorized this context.

### FR-CAREER-03 — Conversation history
Users shall be able to view and continue previous conversations.

### FR-CAREER-04 — Scope and transparency
The assistant shall distinguish suggestions from verified facts and avoid promising employment outcomes.

## 11. Dashboard and progress

### FR-DASH-01 — Dashboard overview
The dashboard shall show a summary of the user's preparation activity.

### FR-DASH-02 — Progress metrics
The dashboard may show roadmap progress, skill coverage, recent interviews, and recent assessments.

### FR-DASH-03 — Recent activity
Users shall be able to navigate to recent resume analyses, interviews, and roadmap tasks.

### FR-DASH-04 — Recommendations
The dashboard shall display recommended next actions based on available preparation data.

### FR-DASH-05 — Empty states
The dashboard shall guide new users who have not uploaded a resume or started preparation.

## 12. Notifications and reminders (planned)

### FR-NOTIF-01
The system may notify users about roadmap tasks, reminders, or completed AI analyses.

### FR-NOTIF-02
Users shall be able to manage notification preferences before notifications are enabled.

## 13. Admin

### FR-ADMIN-01 — User management
Admins shall be able to view and manage user accounts according to permissions.

### FR-ADMIN-02 — Role restrictions
Admin-only functionality shall be protected by backend authorization, not only frontend UI hiding.

### FR-ADMIN-03 — Operational monitoring
Admins may view system-level usage and error summaries without unnecessary exposure of private user content.

### FR-ADMIN-04 — Auditability
Sensitive admin actions should be logged.

## 14. Non-functional requirements

### Security and privacy
- Passwords shall be stored using a strong password-hashing algorithm.
- Secrets and AI provider keys shall be stored in backend environment configuration.
- User-owned resources shall be scoped to the authenticated user.
- Resume files and interview data shall not be publicly accessible by default.
- Sensitive actions shall be authorized server-side.
- The application shall provide a way to delete user data in a later implementation phase.

### Performance and reliability
- API endpoints shall return clear loading/error states through the frontend.
- Long-running AI operations shall support timeout handling and retry where safe.
- The system shall avoid duplicate submissions where possible.
- Pagination shall be used for growing histories.

### Usability and accessibility
- The UI shall be responsive.
- Forms shall provide validation and understandable errors.
- Keyboard navigation and accessible labels should be supported.
- Users shall have a text-based fallback for voice features.

### Maintainability
- Frontend features shall be organized by domain.
- Backend routes, schemas, services, and repositories shall have clear responsibilities.
- AI provider logic shall be abstracted behind service interfaces.
- Automated tests shall cover critical business logic and authentication.

## 15. Initial API candidates

These are planning-level endpoints; detailed contracts will be finalized on Day 2.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/v1/auth/register` | Register |
| POST | `/api/v1/auth/login` | Login |
| GET | `/api/v1/auth/me` | Current user |
| PATCH | `/api/v1/users/me` | Update profile |
| POST | `/api/v1/resumes` | Upload resume |
| GET | `/api/v1/resumes` | List resumes |
| GET | `/api/v1/resumes/{resume_id}` | Resume detail |
| POST | `/api/v1/resumes/{resume_id}/analysis` | Analyze resume |
| POST | `/api/v1/skill-gaps/analyze` | Generate skill-gap report |
| POST | `/api/v1/roadmaps` | Generate roadmap |
| PATCH | `/api/v1/roadmaps/{roadmap_id}/tasks/{task_id}` | Update task |
| POST | `/api/v1/interviews` | Create interview |
| POST | `/api/v1/interviews/{interview_id}/answers` | Submit answer |
| POST | `/api/v1/interviews/{interview_id}/complete` | Complete interview |
| GET | `/api/v1/interviews/{interview_id}/report` | Interview report |
| GET | `/api/v1/dashboard` | Dashboard summary |
