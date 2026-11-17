# SkillBridge AI — Screen Specifications & Wireframe Blueprints

**Phase 1 · Week 1 · Day 3 Deliverable**  
**Role:** Senior UI/UX Designer & Product Designer  
**Scope:** Complete screen-level interaction blueprints, wireframe architectures, state definitions, and responsive rules for all core MVP screens.  
**Related Documents:** [docs/ui-ux-design.md](file:///Users/macos/Documents/Skillbridge/docs/ui-ux-design.md) · [docs/design-system.md](file:///Users/macos/Documents/Skillbridge/docs/design-system.md) · [docs/component-inventory.md](file:///Users/macos/Documents/Skillbridge/docs/component-inventory.md)

---

## Screen Directory & Status Overview

| Screen ID | Screen Name | Route Path | Priority | Key Functional Focus |
|---|---|---|---|---|
| **SCR-01A** | Login | `/login` | P0 (MVP) | Email/password authentication, validation, session cookie |
| **SCR-01B** | Registration | `/register` | P0 (MVP) | Account creation, password strength meter, TOS acceptance |
| **SCR-01C** | Password Reset Placeholder | `/forgot-password` | P0 (MVP) | User recovery notice and email reset request |
| **SCR-02** | Preparation Dashboard | `/dashboard` | P0 (MVP) | Readiness score, active roadmap widget, quick actions |
| **SCR-03** | Resume Analysis | `/resume` | P0 (MVP) | Drag-drop upload, parsing progress, strengths & gaps |
| **SCR-04** | Skill Gap Analysis | `/skill-gap` | P0 (MVP) | Target role comparison, missing competencies, priorities |
| **SCR-05** | Learning Roadmap | `/roadmap` | P0 (MVP) | Week-by-week timeline, interactive task checklist |
| **SCR-06** | AI Interview Setup | `/interview/new` | P0 (MVP) | Role selection, difficulty, interview type, question limits |
| **SCR-07** | AI Interview Interface | `/interview/:id` | P0 (MVP) | Zen mode, adaptive follow-ups, answer drafting |
| **SCR-08** | Interview Feedback Report | `/interview/:id/feedback`| P0 (MVP) | Performance score, dimension breakdown, transcript |
| **SCR-09** | Interview History | `/interview/history`| P0 (MVP) | Chronological session list, score trends, filters |
| **SCR-10** | Profile & Settings | `/profile` & `/settings` | P0 (MVP) | Career target, verified skills, preferences |

---

## Screen SCR-01: Authentication (Login, Register, Forgot Password)

### 1. Purpose & Routes
- **Routes:** `/login`, `/register`, `/forgot-password`
- **Purpose:** Securely authenticate candidates, establish JWT sessions, validate password constraints, and transition to onboarding or the preparation dashboard.

### 2. Desktop Wireframe Layout (`/login` & `/register`)

```text
+-------------------------------------------------------------------------------+
| LEFT BRAND COLUMN (45% width, hidden on mobile)  | RIGHT FORM WORKSPACE (55%) |
|                                                 |                            |
| ⚡ SkillBridge AI                               | [Language / Mode Toggle]   |
|                                                 |                            |
| "Master your technical interviews with          |   Welcome back             |
|  adaptive AI evaluation and personalized        |   Sign in to your account  |
|  learning roadmaps."                            |                            |
|                                                 | ┌────────────────────────┐ │
| [✓] Target role skill-gap analysis              | │ Email Address          │ │
| [✓] Realistic adaptive AI mock sessions         | └────────────────────────┘ │
| [✓] Weekly actionable milestone plans           | ┌────────────────────────┐ │
|                                                 | │ Password          [👁] │ │
| Candidate Testimonial Card                      | └────────────────────────┘ │
| "SkillBridge helped me identify exactly what    | [ ] Remember me  Forgot?   |
|  I was missing for my Senior Backend rounds."   |                            |
|                                                 | [    Sign In Button      ] │
|                                                 |                            |
|                                                 | Don't have an account?     |
|                                                 | Create an account          |
+-------------------------------------------------------------------------------+
```

### 3. Key Components & Form Interactions
- **Form Layout:** Centered single-column card on neutral backdrop (`max-w-md w-full`).
- **Email Input:** Standard text field with auto-complete `email`, real-time RFC 5322 validation on blur.
- **Password Input:** Secure field with trailing eye toggle (`lucide:Eye` / `lucide:EyeOff`) for visibility switching.
- **Registration-specific additions:**
  - Full Name input field.
  - Password strength progress bar (4 segments: Red/Weak → Amber/Fair → Emerald/Strong).
  - Checkbox: "I agree to Terms of Service and understand AI outputs are advisory."
- **Forgot Password Screen:** Simple, single-field email recovery card with clear instructions and a link back to `/login`.

### 4. UX States
- **Initial:** Pristine inputs with clear placeholders (`you@example.com`).
- **Loading:** Submit button renders spinning indicator (`lucide:Loader2`), all inputs disabled.
- **Validation Error:** Inline red caption below invalid inputs (`text-xs text-destructive flex items-center`).
- **Server Error:** Alert banner atop form (`bg-rose-50 border-rose-200 text-rose-800`) with message (e.g., "Invalid email or password").
- **Success:** Redirect with smooth transition to `/dashboard` (or `/profile` if first login).

### 5. Responsive Behavior
- **Mobile (< 768px):** Left brand panel hides. Right form expands to full viewport width with `px-4 py-8`.
- **Keyboard Handling:** Mobile view ensures inputs auto-scroll into view when virtual keyboard deploys.

---

## Screen SCR-02: Preparation Dashboard (`/dashboard`)

### 1. Purpose & Route
- **Route:** `/dashboard`
- **Purpose:** Serve as the command center for the candidate's career readiness journey, highlighting immediate priorities, resume health, active roadmap progress, and mock interview trends.

### 2. Desktop Wireframe Layout

```text
+-------------------------------------------------------------------------------+
| HEADER: Good morning, Alex 👋  Target: Senior Backend Engineer  [Quick Actions]|
+-------------------------------------------------------------------------------+
| TOP METRIC ROW                                                                |
| ┌──────────────────┐ ┌──────────────────┐ ┌─────────────────┐ ┌─────────────┐ │
| │ Resume Score     │ │ Skill Readiness  │ │ Roadmap Progress│ │ Avg Mock    │ │
| │ 82 / 100         │ │ 68% Match (14/22)│ │ 6 / 18 Tasks    │ │ Score: 78%  │ │
| │ [View Analysis →]│ │ [4 Critical Gaps]│ │ [Week 2 of 4]   │ │ [3 Completed│ │
| └──────────────────┘ └──────────────────┘ └─────────────────┘ └─────────────┘ │
+-------------------------------------------------------------------------------+
| MAIN SECTION (65% width)                      | SIDEBAR SECTION (35% width)   |
|                                               |                               |
| ┌───────────────────────────────────────────┐ | ┌───────────────────────────┐ |
| │ ACTIVE ROADMAP — WEEK 2: SYSTEM DESIGN    │ | │ UPCOMING / QUICK ACTIONS  │ |
| │ Progress: [████████░░░░░░░░] 45%          │ | │ [⚡ Start Mock Interview ] │ |
| │                                           │ | │ [📄 Upload Updated Resume] │ |
| │ [✓] Design high-throughput Redis cache    │ | │ [🎯 Switch Target Role   ] │ |
| │ [ ] Implement rate-limiting algorithms    │ | └───────────────────────────┘ |
| │ [ ] Review CAP theorem trade-offs         │ |                               |
| │ [Go to Roadmap →]                         │ | ┌───────────────────────────┐ |
| └───────────────────────────────────────────┘ | │ RECENT INTERVIEW ACTIVITY │ |
|                                               | │ Backend Distributed Systems│ |
| ┌───────────────────────────────────────────┐ | │ Score: 84% • 2 days ago   │ |
| │ RECOMMENDED PRACTICE INTERVIEWS           │ | │ [View Report →]           │ |
| │ - Database Sharding & Indexing (Technical)│ | ├───────────────────────────┤ |
| │ - Microservices Incident Response (Tech)  │ | │ Behavioral Leadership     │ |
| │ [Start Recommended Session]               │ | │ Score: 76% • 5 days ago   │ |
| └───────────────────────────────────────────┘ | └───────────────────────────┘ |
+-------------------------------------------------------------------------------+
```

### 3. Key Components & Data Elements
- **Welcome Banner:** User greeting, target role pill with edit shortcut, and overall readiness progress ring.
- **Stat Metric Cards (Grid of 4):**
  1. *Resume Score Card:* Overall benchmark score with last-uploaded date.
  2. *Skill Readiness Card:* Number of matched skills vs required skills with gap count badge.
  3. *Roadmap Progress Card:* Tasks completed vs total, active week indicator.
  4. *Interview Performance Card:* Average score across last 5 interviews with trend indicator (+4%).
- **Active Roadmap Widget:** Interactive snippet showing current week's tasks with click-to-complete checkboxes.
- **Recent Interview Activity Feed:** List of recent interview cards with score badges, role titles, and links to detailed reports.
- **Quick Action Dock:** Prominent CTA buttons to start a mock interview, upload a resume, or explore skill gaps.

### 4. UX States
- **Initial / First Time User (Empty):** Shows a guided "Welcome to SkillBridge" stepper: (1) Upload Resume [Actionable] → (2) Review Gaps [Locked] → (3) Generate Roadmap [Locked] → (4) First Mock Interview [Locked].
- **Loading:** Stat cards render shimmering skeleton rectangles; activity feed renders skeleton list rows.
- **Populated:** Full data rendered as shown in wireframe.

---

## Screen SCR-03: Resume Analysis (`/resume`)

### 1. Purpose & Route
- **Route:** `/resume`
- **Purpose:** Allow candidate to upload resumes (PDF/DOCX), monitor text extraction and AI evaluation, inspect detected skills, review strengths and improvement suggestions, and override parsed items.

### 2. Desktop Wireframe Layout

```text
+-------------------------------------------------------------------------------+
| HEADER: Resume Analysis & Competency Audit          [Upload New Version Button]|
+-------------------------------------------------------------------------------+
| UPLOAD / ACTIVE FILE HEADER                                                   |
| ┌───────────────────────────────────────────────────────────────────────────┐ │
| │ Active Resume: Alex_Vance_Senior_Backend_2026.pdf (1.8 MB)                │ │
| │ Parsed: Nov 04, 2026 • Status: Completed • [Download] [Delete]            │ │
| └───────────────────────────────────────────────────────────────────────────┘ │
+-------------------------------------------------------------------------------+
| LEFT COLUMN: RESUME AUDIT (60% width)         | RIGHT COLUMN: SKILLS (40%)    |
|                                               |                               |
| ┌───────────────────────────────────────────┐ | ┌───────────────────────────┐ |
| │ OVERALL RESUME HEALTH: 82 / 100           │ | │ DETECTED TECHNICAL SKILLS │ |
| │ [████████████████████░░░░]                │ | │ Verified from Experience: │ |
| │ Clear bullet structure, strong metrics.   │ | │ [Python] [FastAPI] [Postgres]│
| └───────────────────────────────────────────┘ | │ [Docker] [Redis] [Kafka]  │ │
|                                               | │ [Kubernetes] [GraphQL]    │ │
| ┌───────────────────────────────────────────┐ | │                           │ │
| │ KEY STRENGTHS DETECTED (3)                │ | │ Soft Skills:              │ │
| │ • Quantified impact in previous backend   │ | │ [Technical Leadership]    │ │
| │   roles (e.g. 40% latency reduction).     │ | │ [Incident Management]     │ │
| │ • Clear architectural ownership of APIs.  │ | │                           │ │
| └───────────────────────────────────────────┘ | │ [ + Add Missing Skill ]   │ │
|                                               | └───────────────────────────┘ |
| ┌───────────────────────────────────────────┐ |                               |
| │ ACTIONABLE IMPROVEMENTS (2)               │ | ┌───────────────────────────┐ |
| │ ⚠️ Missing Cloud Deployment metrics:      │ | │ RECOMMENDED TARGET ROLES  │ |
| │    Specify AWS/GCP cloud services used.   │ | │ 1. Senior Backend Eng     │ |
| │ ⚠️ Add testing coverage metrics:          │ | │ 2. Distributed Systems Eng│ |
| │    Mention automated test coverage %      │ | │ 3. Cloud Infrastructure   │ |
| └───────────────────────────────────────────┘ | └───────────────────────────┘ |
+-------------------------------------------------------------------------------+
```

### 3. Drag-and-Drop Upload Area Specification
- **Dropzone Area:** 180px dashed container (`border-2 border-dashed border-slate-300 hover:border-primary bg-slate-50/50 rounded-2xl`).
- **Dropzone Content:** Centered cloud upload icon (`lucide:UploadCloud`), prompt text: *"Drag and drop your resume here, or click to browse"*, format guidance: *"Supported formats: PDF, DOCX (Max 5MB)"*.
- **Drag Interaction:** On `dragover`, border transitions to `border-primary` with `bg-indigo-50/50` backdrop tint.
- **Upload Progress Bar:** Animated progress bar with percentage readout (`0% → 100%`) and cancel button (`lucide:X`).

### 4. UX States
- **Empty State:** Large prominent dropzone in center of screen with empty illustration and FAQ tips on resume formatting.
- **Processing State (Async):** Visual 3-step timeline:
  1. *Uploading File...* [Done ✓]
  2. *Extracting Resume Text...* [In Progress ⟳]
  3. *Analyzing Competencies with AI...* [Pending ⏳]
- **Failed State:** Alert card with error reason (e.g., "File could not be parsed. The PDF appears password-protected or corrupted.") + immediate "Upload Another File" button.
- **Completed State:** Comprehensive breakdown as shown in wireframe.

---

## Screen SCR-04: Skill Gap Analysis (`/skill-gap`)

### 1. Purpose & Route
- **Route:** `/skill-gap`
- **Purpose:** Compare candidate's verified skills against target industry roles or specific pasted job descriptions, highlighting matched competencies, missing prerequisites, and prioritizing roadmap actions.

### 2. Desktop Wireframe Layout

```text
+-------------------------------------------------------------------------------+
| HEADER: Skill Gap Analysis                                                    |
| Target Role: [ Senior Backend Engineer ▾ ]  Source: [ Active Resume (Alex) ▾]  |
+-------------------------------------------------------------------------------+
| ROLE READINESS BENCHMARK                                                      |
| ┌───────────────────────────────────────────────────────────────────────────┐ │
| │ Role Match: 68% • 14 of 22 Skills Matched • 4 Critical Gaps • 4 Low Gaps  │ │
| │ [████████████████░░░░░░░░░░] [Generate Learning Roadmap from Gaps →]     │ │
| └───────────────────────────────────────────────────────────────────────────┘ │
+-------------------------------------------------------------------------------+
| SECTION 1: CRITICAL SKILL GAPS (High Priority)                                |
| ┌───────────────────────────────────────────────────────────────────────────┐ │
| │ ⚠️ Distributed Caching & Redis Clustering                                  │ │
| │    Expected: Advanced cache invalidation & memory optimization            │ │
| │    Current: Basic key-value usage detected                                │ │
| │    [Add to Roadmap] [Practice Mock Question]                              │ │
| ├───────────────────────────────────────────────────────────────────────────┤ │
| │ ⚠️ Event-Driven Architecture (Kafka / RabbitMQ)                            │ │
| │    Expected: Consumer groups, partition keys, idempotency patterns         │ │
| │    Current: No event streaming detected in resume                          │ │
| │    [Add to Roadmap] [Practice Mock Question]                              │ │
| └───────────────────────────────────────────────────────────────────────────┘ │
+-------------------------------------------------------------------------------+
| SECTION 2: VERIFIED MATCHED SKILLS (Ready)                                    |
| [✓ Python 3.12] [✓ FastAPI] [✓ PostgreSQL & Indexes] [✓ REST API Design]     |
| [✓ Docker Containers] [✓ Git & CI/CD] [✓ Unit Testing]                       |
+-------------------------------------------------------------------------------+
```

### 3. Key Components & Interactions
- **Target Role Selector:** Dropdown offering pre-indexed standard tech roles (e.g., Backend, Frontend, Full Stack, DevOps, Data Engineer) plus option to paste a custom Job Description.
- **Readiness Benchmark Banner:** Visual meter with percentage match, gap count badges, and one-click CTA to generate/update the learning roadmap.
- **Skill Comparison Grid / Cards:**
  - Grouped into: *Critical Gaps* (Red badge), *Moderate Gaps* (Amber badge), and *Matched Skills* (Emerald badge).
  - Each gap card features an expandable accordion showing: What employers expect, evidence found in user's profile, and direct action triggers.

---

## Screen SCR-05: Learning Roadmap (`/roadmap`)

### 1. Purpose & Route
- **Route:** `/roadmap`
- **Purpose:** Provide a weekly, structured curriculum that transforms identified skill gaps into tangible learning tasks, curated resources, and milestone checkpoints.

### 2. Desktop Wireframe Layout

```text
+-------------------------------------------------------------------------------+
| HEADER: Personalized Preparation Roadmap            [Recalculate Roadmap Button]|
| Goal: Senior Backend Engineer • 4 Weeks • 18 Total Tasks                      |
+-------------------------------------------------------------------------------+
| OVERALL PROGRESS: 6 of 18 Tasks Completed (33%) [███████░░░░░░░░░░░░░]        |
+-------------------------------------------------------------------------------+
| TIMELINE NAVIGATION: [ Week 1 ✓ ] [ Week 2 (Current) ] [ Week 3 ] [ Week 4 ]  |
+-------------------------------------------------------------------------------+
| WEEK 2: EVENT-DRIVEN SYSTEMS & DISTRIBUTED CACHING                            |
| Focus: Master Kafka partitioning and Redis caching patterns. (Est. 8 hours)  |
|                                                                               |
| ┌───────────────────────────────────────────────────────────────────────────┐ │
| │ [✓] Task 2.1: Study Kafka Partitioning & Consumer Rebalancing             │ │
| │     Type: Architecture Concept • 2 hrs • Resource: Kafka Documentation    │ │
| │     Completed on Nov 02, 2026 • [Notes]                                   │ │
| ├───────────────────────────────────────────────────────────────────────────┤ │
| │ [ ] Task 2.2: Implement Cache-Aside Pattern in FastAPI with Redis          │ │
| │     Type: Hands-on Implementation • 3 hrs • Resource: Redis Architecture  │ │
| │     Priority: High • [Mark Complete] [Start Related Mock Interview]       │ │
| ├───────────────────────────────────────────────────────────────────────────┤ │
| │ [ ] Task 2.3: Understand Cache Stampede & Distributed Locks               │ │
| │     Type: Deep Dive • 2 hrs • Resource: High-Scalability Blog             │ │
| │     Priority: Medium • [Mark Complete]                                    │ │
| └───────────────────────────────────────────────────────────────────────────┘ │
+-------------------------------------------------------------------------------+
```

### 3. Key Interactions
- **Task Completion Interaction:** Clicking checkbox triggers celebratory micro-animation, strikes through title, updates week progress bar, and asynchronously syncs task status via `PATCH /roadmaps/:id/tasks/:taskId`.
- **Resource Drawer / Modal:** Clicking a resource link opens external curated documentation in a new tab with safety rel tags (`noopener noreferrer`).
- **Recalculate Roadmap:** Allows candidate to refresh tasks if new skills have been verified through mock interview successes.

---

## Screen SCR-06: AI Interview Setup (`/interview/new`)

### 1. Purpose & Route
- **Route:** `/interview/new`
- **Purpose:** Allow candidate to configure a tailored mock interview by specifying target role, interview category, difficulty level, and session constraints before launching.

### 2. Desktop Wireframe Layout

```text
+-------------------------------------------------------------------------------+
| HEADER: Configure AI Mock Interview                       [Cancel / Back]     |
+-------------------------------------------------------------------------------+
| CENTERED CONFIGURATION CARD (max-w-2xl mx-auto)                               |
|                                                                               |
| 1. Select Target Role                                                         |
| ┌───────────────────────────────────────────────────────────────────────────┐ │
| │ [ Senior Backend Engineer (from profile)                             ▾ ]  │ │
| └───────────────────────────────────────────────────────────────────────────┘ │
|                                                                               |
| 2. Interview Type                                                             |
| ┌──────────────────────┐ ┌──────────────────────┐ ┌─────────────────────────┐ │
| │ 💻 Technical Deep    │ │ 🤝 Behavioral & HR   │ │ ⚖️ Mixed Comprehensive  │ │
| │ (Algorithms, APIs,   │ │ (STAR method,        │ │ (Both technical and     │ │
| │  System Architecture)│ │  leadership, teams)  │ │  behavioral questions)  │ │
| └──────────────────────┘ └──────────────────────┘ └─────────────────────────┘ │
|                                                                               |
| 3. Difficulty Level                                                           |
| ┌────────────────────┐ ┌────────────────────┐ ┌─────────────────────────────┐ │
| │ 🟢 Entry / Junior  │ │ 🟡 Mid-Level       │ │ 🔴 Senior / Staff (Selected)│ │
| └────────────────────┘ └────────────────────┘ └─────────────────────────────┘ │
|                                                                               |
| 4. Session Mode & Length                                                      |
| Mode: (•) Text-Based Practice   ( ) Voice Mode [Phase 2 Badge / Disabled]     |
| Questions: [ 6 Main Questions (approx. 25 mins)                          ▾ ]  |
|                                                                               |
| ┌───────────────────────────────────────────────────────────────────────────┐ │
| │ ℹ️ Adaptive Follow-Ups Enabled: The AI interviewer will ask follow-up      │ │
| │    questions based on your specific responses to test depth.               │ │
| └───────────────────────────────────────────────────────────────────────────┘ │
|                                                                               |
| [                          Start Interview Session                         ] │
+-------------------------------------------------------------------------------+
```

### 3. Configuration Controls
- **Role Selection:** Pre-selected with candidate's active target role; searchable select menu for other roles.
- **Type Toggle Cards:** 3 selectable radio cards with clear icon, title, and descriptive summary.
- **Difficulty Selector:** 3 distinct pill buttons with color-coded difficulty indicators.
- **Voice Mode Toggle:** Clearly labeled with a "Phase 2 / Coming Soon" badge; gracefully disabled with tooltip explaining browser/service prerequisites.
- **Start CTA:** Primary action button launching the distraction-free interview session.

---

## Screen SCR-07: AI Interview Interface (`/interview/:id`)

### 1. Purpose & Route
- **Route:** `/interview/:id`
- **Purpose:** Provide an immersive, distraction-free environment for real-time interview practice with adaptive follow-ups, answer drafting, and session management.

### 2. Distraction-Free Zen Wireframe Layout

```text
+-------------------------------------------------------------------------------+
| TOP BAR: Senior Backend Engineer • Technical Session                          |
| Question 3 of 6 • Follow-up 1 of 2           [⏱ 14:22]    [Pause] [Exit Session]|
+-------------------------------------------------------------------------------+
| INTERVIEW STAGE CONTAINER (max-w-4xl mx-auto py-6)                            |
|                                                                               |
| ┌───────────────────────────────────────────────────────────────────────────┐ │
| │ 🤖 AI INTERVIEWER                                                         │ │
| │ Question 3: "How would you design a rate-limiting system for a public API │ │
| │ that processes 50,000 requests per second? Which algorithms would you     │ │
| │ consider, and where would you maintain the state?"                        │ │
| └───────────────────────────────────────────────────────────────────────────┘ │
|                                                                               |
| ┌───────────────────────────────────────────────────────────────────────────┐ │
| │ 💬 ADAPTIVE FOLLOW-UP QUESTION                                            │ │
| │ "You mentioned using Redis with a Token Bucket algorithm. How would you   │ │
| │  handle the race condition when multiple API nodes read and update the    │ │
| │  token count simultaneously?"                                             │ │
| └───────────────────────────────────────────────────────────────────────────┘ │
|                                                                               |
| ┌───────────────────────────────────────────────────────────────────────────┐ │
| │ ✍️ YOUR ANSWER (Text-mode active)                                          │ │
| │ ┌───────────────────────────────────────────────────────────────────────┐ │ │
| │ │ To prevent race conditions, I would execute the token bucket check     │ │ │
| │ │ and decrement logic inside a Redis Lua script. Since Redis executes   │ │ │
| │ │ Lua scripts atomically on a single thread, no two API workers can     │ │ │
| │ │ perform an interleaved read-modify-write cycle...                     │ │ │
| │ └───────────────────────────────────────────────────────────────────────┘ │ │
| │ Word count: 68 words • [Auto-saved draft]                                │ │
| │                                                                           │ │
| │ [ Clear Answer ]                                [ Submit Answer & Continue ]│
| └───────────────────────────────────────────────────────────────────────────┘ │
|                                                                               |
| ┌───────────────────────────────────────────────────────────────────────────┐ │
| │ [ Finish Interview & View Feedback Report ]                               │ │
| └───────────────────────────────────────────────────────────────────────────┘ │
+-------------------------------------------------------------------------------+
```

### 3. Key Interaction & Design Details
- **No Chatbot Bubble Gimmicks:** The screen uses structured question stages rather than a messy chat stream. Questions appear with clear visual badges (`Question 3`, `Adaptive Follow-Up`).
- **Answer Editor:** Large, comfortable textarea with monospace font support for technical terms/code snippets, auto-saving drafts to local session state.
- **Adaptive Follow-Up Mechanism:**
  - When the user submits an answer, the AI evaluates depth. If depth is ambiguous or presents a trade-off, a follow-up card animates into view smoothly.
  - Follow-up limits are strictly enforced (maximum 2 follow-ups per primary question) to keep session pacing predictable.
- **Exit Confirmation Modal:** Clicking "Exit Session" displays an alert dialog: *"Exit Interview? Your progress will be saved, but you will not receive a complete performance report for unfinished questions."* Actions: `[Resume Interview]` and `[Exit to Dashboard]`.

---

## Screen SCR-08: Interview Feedback Report (`/interview/:id/feedback`)

### 1. Purpose & Route
- **Route:** `/interview/:id/feedback`
- **Purpose:** Present comprehensive, constructive evaluation across technical accuracy, communication clarity, problem-solving structure, strengths, improvement areas, and question-by-question transcripts.

### 2. Desktop Wireframe Layout

```text
+-------------------------------------------------------------------------------+
| HEADER: Interview Performance Report            [Retry Interview] [Back to History]|
| Role: Senior Backend Engineer • Date: Nov 04, 2026 • Duration: 24 mins        |
+-------------------------------------------------------------------------------+
| ADVISORY DISCLAIMER BANNER                                                    |
| ℹ️ AI Evaluation Notice: Scores and feedback are simulated estimates to guide  |
|    your learning. They reflect industry standards but are not hiring results.  |
+-------------------------------------------------------------------------------+
| SCORE BREAKDOWN OVERVIEW                                                      |
| ┌───────────────────────────────────────────────────────────────────────────┐ │
| │ OVERALL PERFORMANCE: 84 / 100 (Strong Candidate Benchmark)                 │ │
| │                                                                           │ │
| │ Technical Accuracy:     [██████████████████░░] 88%                         │ │
| │ Communication Clarity:  [████████████████░░░░] 80%                         │ │
| │ Problem Solving:        [████████████████░░░░] 82%                         │ │
| │ Architectural Rigor:    [██████████████████░░] 86%                         │ │
| └───────────────────────────────────────────────────────────────────────────┘ │
+-------------------------------------------------------------------------------+
| TWO-COLUMN FEEDBACK SUMMARY                                                   |
| ┌───────────────────────────────────────────┐ ┌─────────────────────────────┐ │
| │ 🌟 KEY DEMONSTRATED STRENGTHS             │ │ 🚀 HIGH-PRIORITY IMPROVEMENTS│ │
| │ • Excellent use of Redis Lua scripts for  │ │ • Explain trade-offs before │ │
| │   atomic concurrency guarantees.          │ │   jumping to a specific tool│ │
| │ • Clear explanation of Kafka partition key│ │ • Mention observability and │ │
| │   selection and ordering limits.          │ │   distributed tracing (APM) │ │
| └───────────────────────────────────────────┘ └─────────────────────────────┘ │
+-------------------------------------------------------------------------------+
| COMPLETE TRANSCRIPT WITH QUESTION-BY-QUESTION BREAKDOWN                       |
|                                                                               |
| ▼ Question 1: Explain Dependency Injection in FastAPI (Score: 9/10)           |
|   Your Answer: "Dependency injection in FastAPI allows declaring dependencies..."|
|   AI Feedback: "Strong explanation. You accurately covered Depends() and..."    |
|   Model Answer Recommendation: "To make this exceptional, highlight how..."   |
|                                                                               |
| ▶ Question 2: Designing a Distributed Rate Limiter (Score: 8/10)              |
| ▶ Question 3: Event-Driven Kafka Consumer Rebalancing (Score: 8/10)           |
+-------------------------------------------------------------------------------+
```

### 3. Key Components
- **Overall Score Radial / Meter:** Prominent numerical indicator with benchmark band ("Needs Practice" < 60, "Solid Foundation" 60–75, "Interview Ready" 76–90, "Exceptional" 90+).
- **Core Competency Progress Bars:** Technical Accuracy, Communication Clarity, Problem Solving, Architectural Rigor.
- **Actionable Next Steps:** Direct CTA linking weak areas to specific learning roadmap tasks.
- **Interactive Transcript Accordion:** Collapsible cards for each question, including the original question, user answer, adaptive follow-up, AI critique, and an enhanced "Recommended Model Response".

---

## Screen SCR-09: Interview History (`/interview/history`)

### 1. Purpose & Route
- **Route:** `/interview/history`
- **Purpose:** Provide candidates with a chronological archive of all completed and in-progress mock interviews, enabling them to review historical reports and track score trajectories over time.

### 2. Desktop Wireframe Layout

```text
+-------------------------------------------------------------------------------+
| HEADER: Mock Interview History                                                |
| Filter by: [ All Roles ▾ ] [ All Difficulties ▾ ] [ Sort: Newest First ▾ ]    |
+-------------------------------------------------------------------------------+
| HISTORICAL SESSIONS TABLE                                                     |
| ┌───────────────────────────────────────────────────────────────────────────┐ │
| │ Role / Title             │ Type      │ Date         │ Score  │ Status │ Act │
| ├──────────────────────────┼───────────┼──────────────┼────────┼────────┼─────┤
| │ Senior Backend Engineer  │ Technical │ Nov 04, 2026 │ 84/100 │ Ready  │ [→] │
| │ Distributed Systems Eng  │ Technical │ Nov 01, 2026 │ 78/100 │ Solid  │ [→] │
| │ Engineering Leadership   │ Behavioral│ Oct 28, 2026 │ 72/100 │ Solid  │ [→] │
| │ Backend Architecture     │ Technical │ Oct 22, 2026 │ 64/100 │ Review │ [→] │
| └───────────────────────────────────────────────────────────────────────────┘ │
| Showing 1–4 of 4 completed interviews                     [Page 1 of 1]       |
+-------------------------------------------------------------------------------+
```

### 3. Table Features & Mobile Adaptations
- **Desktop Table:** Clean table with sortable columns, status pill badges, and direct "View Report" chevron buttons.
- **Mobile Stack:** Automatically transforms table rows into compact cards showing Role, Date, Score badge, and a "View Report" button.
- **Empty State:** Centered card with mock interview illustration, headline *"No mock interviews completed yet"*, and *"Configure your first interview"* CTA button.

---

## Screen SCR-10: Profile & Settings (`/profile`, `/settings`)

### 1. Purpose & Routes
- **Routes:** `/profile` (Career Goals & Verified Skills), `/settings` (Account & Preferences)
- **Purpose:** Manage candidate career goals, target role selection, verified skills inventory, account credentials, and display preferences.

### 2. Profile Screen Layout (`/profile`)
- **Career Goal Card:** Target Job Role selector, target seniority level (Junior, Mid, Senior, Lead), desired industry, and target timeline.
- **Verified Skills Inventory:** Tag cloud with category filters (Languages, Frameworks, Databases, Cloud & DevOps, System Design). Includes an `[ + Add Custom Skill ]` action.
- **Work Experience & Education:** Structured list of parsed roles and degrees with inline edit and delete controls.

### 3. Settings Screen Layout (`/settings`)
- **Account Security:** Update display name, email address, and change password form.
- **Interface Preferences:** Theme selector (Light / Dark / System Default).
- **Data Privacy & Retention:** Actions to download user data archive or delete account with confirmation modal.
