# SkillBridge AI — User Stories

**Version:** 1.0  
**Phase:** 1 — Planning and Foundation

## 1. Learner / User stories

### Account and profile
- **US-001:** As a learner, I want to register so that I can save my career-preparation progress.
- **US-002:** As a learner, I want to log in securely so that only I can access my information.
- **US-003:** As a learner, I want to update my profile and experience level so that recommendations reflect my background.
- **US-004:** As a learner, I want to select a target job role so that the platform can guide my preparation.

### Resume
- **US-005:** As a learner, I want to upload my resume so that the platform can understand my experience and skills.
- **US-006:** As a learner, I want AI to summarize my resume and identify strengths and weaknesses so that I can improve it.
- **US-007:** As a learner, I want to correct extracted resume details so that inaccurate information does not affect my recommendations.
- **US-008:** As a learner, I want to compare my resume with a job description so that I can tailor my preparation.

### Skill gap and roadmap
- **US-009:** As a learner, I want to see skills required for my target role so that I understand what employers may expect.
- **US-010:** As a learner, I want to see matched and missing skills so that I can prioritize learning.
- **US-011:** As a learner, I want a personalized roadmap so that I know what to study next.
- **US-012:** As a learner, I want to mark roadmap tasks complete so that I can track progress.
- **US-013:** As a learner, I want to revise my roadmap when my skills improve so that it stays relevant.

### Interview practice
- **US-014:** As a learner, I want to configure an interview by role and difficulty so that practice matches my goals.
- **US-015:** As a learner, I want to answer interview questions one at a time so that I can practice in a realistic format.
- **US-016:** As a learner, I want AI follow-up questions based on my answer so that the interview feels interactive and adaptive.
- **US-017:** As a learner, I want to practice behavioral and technical interviews so that I prepare for different interview formats.
- **US-018:** As a learner, I want to complete an interview and receive feedback so that I understand what to improve.
- **US-019:** As a learner, I want to review previous interview reports so that I can measure improvement.
- **US-020:** As a learner, I want an improved example of my answer so that I can learn how to communicate more effectively.

### Voice and coding practice
- **US-021:** As a learner, I want to speak my interview answers so that I can practice verbal communication.
- **US-022:** As a learner, I want interview questions read aloud so that I can practice a spoken interview experience.
- **US-023:** As a learner, I want text mode to remain available if microphone or speech features fail so that I can continue practicing.
- **US-024:** As a learner, I want coding questions with test cases so that I can practice technical problem solving.
- **US-025:** As a learner, I want to submit code and see test results so that I can evaluate my solution.

### Career assistant and dashboard
- **US-026:** As a learner, I want to ask career questions using my preparation context so that advice is more relevant.
- **US-027:** As a learner, I want to revisit earlier career-assistant conversations so that I can continue where I left off.
- **US-028:** As a learner, I want a dashboard showing my preparation progress so that I can see my current status.
- **US-029:** As a learner, I want recommended next steps so that I can focus on the most valuable activity.
- **US-030:** As a learner, I want reminders for learning tasks so that I can maintain a preparation routine.

### Privacy and control
- **US-031:** As a learner, I want my resume and interview history to be private so that other users cannot access my personal data.
- **US-032:** As a learner, I want to understand when AI-generated feedback is an estimate so that I do not treat it as a guaranteed outcome.
- **US-033:** As a learner, I want to delete or manage my personal data so that I remain in control of it.

## 2. Admin stories
- **US-034:** As an admin, I want to manage user accounts so that I can handle account-related issues.
- **US-035:** As an admin, I want to manage supported roles and platform configuration so that the product remains consistent.
- **US-036:** As an admin, I want to monitor operational errors and usage so that I can maintain platform reliability.
- **US-037:** As an admin, I want privileged actions to be logged so that administrative activity is auditable.

## 3. MVP acceptance criteria

### US-001 — Registration
- Given a visitor provides valid registration details, when they submit the form, then an account is created.
- Given an email is already registered, when the visitor submits it again, then the system displays a useful validation error.
- Passwords are never stored in plaintext.

### US-005 — Resume upload
- Given an authenticated user selects a supported file, when they upload it, then the system validates and stores it privately.
- Given the file type or size is unsupported, then the system rejects it with a clear message.
- The resume belongs to the authenticated user.

### US-006 — Resume analysis
- Given a resume has been uploaded, when the user requests analysis, then the system returns structured analysis.
- If analysis fails, the user sees a retry option and the resume remains available.
- The user can distinguish extracted information from AI-generated suggestions.

### US-010 — Skill-gap analysis
- Given a user has a profile/resume and target role, when they request analysis, then the system displays matched and missing skills.
- Each gap has a priority or recommended next action.
- The report identifies the target role used for the comparison.

### US-011 — Roadmap generation
- Given the user has a target role and skill-gap report, when they generate a roadmap, then the system returns ordered tasks and milestones.
- Tasks include priority and estimated effort.
- The user can mark a task complete and see updated progress.

### US-016 — Adaptive follow-up
- Given an interview question and the user's answer, when the answer is submitted, then the AI may produce a relevant follow-up question.
- The follow-up is related to the answer and interview objective.
- The session maintains question/answer order.
- If the AI cannot generate a follow-up, the interview can continue with a fallback question.

### US-018 — Interview feedback
- Given an interview is completed, when the user requests or receives a report, then feedback includes strengths, improvement areas, and actionable suggestions.
- Feedback is associated with the interview session.
- The report states that AI evaluation is advisory.

### US-028 — Dashboard
- Given a user has preparation activity, when they open the dashboard, then they see progress and recent activity.
- Given a new user has no activity, then the dashboard shows clear actions to get started.
- Dashboard data is scoped to the authenticated user.

## 4. Story prioritization labels

- **P0:** Required for MVP core journey.
- **P1:** Important follow-on feature.
- **P2:** Advanced or optional feature.

Story priorities are assigned in `feature-priorities.md`.
