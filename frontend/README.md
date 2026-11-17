# SkillBridge AI — Frontend Application

**Phase 1 · Week 1 · Day 4 Deliverable**  
**Role:** Senior Frontend Engineer & UI/UX-Focused React Developer  
**Status:** Initial Frontend Architecture & Screen Implementation  
**Technology Stack:** React 19, TypeScript, Vite 8, Tailwind CSS v3, shadcn/ui tokens, React Router 7, TanStack Query, React Hook Form, Zod, Axios, Lucide React

---

## 1. Project Description

SkillBridge AI is an AI-powered career preparation platform designed to help software engineers, students, and job seekers evaluate resume health, identify market skill gaps, execute personalized 4-week learning roadmaps, and practice realistic mock technical interviews with multi-turn adaptive follow-up questions.

---

## 2. Frontend Technology Stack

| Layer | Selected Technology | Purpose |
|---|---|---|
| **Core Framework** | React 19 + TypeScript | Component model & type-safe development |
| **Bundler / Tooling** | Vite 8 + PostCSS | High-speed ESM development and production bundling |
| **Styling & Tokens** | Tailwind CSS v3 + CSS HSL Variables | Design system adhering to `docs/design-system.md` |
| **UI Primitives** | Custom shadcn/ui-compatible components | Accessible, composable UI building blocks |
| **Icons** | Lucide React | High-contrast, clean SVG iconography |
| **Client Routing** | React Router v7 (`createBrowserRouter`) | Shell layouts, public auth, and zen mock session routing |
| **Forms & Validation**| React Hook Form + Zod | Type-safe form handling, instant validation errors |
| **Server State** | TanStack Query (`@tanstack/react-query`) | Async query management, caching, and optimistic updates |
| **HTTP Client** | Axios | Configured client with interceptors for token injection |

---

## 3. Directory & Folder Architecture

```text
frontend/
├── src/
│   ├── components/
│   │   ├── ui/               # Reusable primitives (Button, Badge, Card, Input, Textarea, Progress)
│   │   ├── common/           # Universal wrappers (StatCard, SkillBadge, PageHeader, EmptyState, LoadingSkeleton, ErrorAlert)
│   │   └── layout/           # Global shells (AppSidebar, AppHeader, ZenInterviewHeader)
│   ├── features/
│   │   ├── auth/             # LoginScreen, RegisterScreen
│   │   ├── dashboard/        # DashboardScreen
│   │   ├── resume/           # ResumeScreen
│   │   ├── skill-gap/        # SkillGapScreen
│   │   ├── roadmap/          # RoadmapScreen
│   │   ├── interview/        # InterviewSetupScreen, InterviewScreen, InterviewFeedbackScreen, InterviewHistoryScreen
│   │   ├── profile/          # ProfileScreen
│   │   └── common/           # NotFoundScreen
│   ├── layouts/
│   │   ├── AppLayout.tsx     # Authenticated layout with collapsible sidebar & top utility header
│   │   └── AuthLayout.tsx    # Split layout with platform value hero for authentication
│   ├── lib/
│   │   └── utils.ts          # Class merging utility (clsx + tailwind-merge)
│   ├── mocks/
│   │   └── index.ts          # Comprehensive realistic domain mock data (User, Resume, Gaps, Roadmap, Interview)
│   ├── routes/
│   │   └── index.tsx         # Central React Router route definitions
│   ├── services/
│   │   └── apiClient.ts      # Pre-configured Axios instance with auth interceptor
│   ├── types/
│   │   └── index.ts          # Strict TypeScript interface definitions
│   ├── App.tsx               # App root with QueryClientProvider and RouterProvider
│   ├── main.tsx              # Application mount entrypoint
│   └── index.css             # Tailwind directives and HSL custom property design tokens
├── .env.example              # Environment variables template
├── eslint.config.js          # ESLint flat config with TypeScript rules
├── package.json              # NPM dependencies and scripts
├── tailwind.config.js        # Tailwind configuration with design tokens
├── tsconfig.app.json         # TypeScript compiler options with @/ alias
└── vite.config.ts            # Vite config with alias resolution
```

---

## 4. Setup & Running Locally

### Prerequisites
- Node.js `v20.x` or later (tested on Node `v24.15.0`)
- npm `v10.x` or later (tested on npm `v11.12.1`)

### Step 1: Install Dependencies
```bash
cd frontend
npm install
```

### Step 2: Environment Configuration
Copy the template environment file:
```bash
cp .env.example .env
```
Default configuration:
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### Step 3: Start the Development Server
```bash
npm run dev
```
The application will launch at `http://localhost:5173/`.

### Step 4: Run Code Quality Checks
```bash
# Type check and build bundle
npm run build

# Run ESLint
npm run lint
```

---

## 5. Available Application Routes

| Route | Layout | Screen & Functionality |
|---|---|---|
| `/login` | `AuthLayout` | Email/password login with visibility toggle and validation |
| `/register` | `AuthLayout` | New account registration with password matching validation |
| `/dashboard` | `AppLayout` | Central readiness dashboard, 4 stat cards, active milestone, recent activity |
| `/resume` | `AppLayout` | Resume drag-and-drop dropzone, text extraction, audit metrics, detected skills |
| `/skill-gap` | `AppLayout` | Role selector, benchmark match %, missing/critical gaps, roadmap CTAs |
| `/roadmap` | `AppLayout` | 4-week interactive curriculum, week switcher tabs, task checkboxes |
| `/interview/setup` | `AppLayout` | Configuration form for role, category, difficulty, duration |
| `/interview/:id` | `ZenInterviewHeader` | Distraction-free interview stage, adaptive follow-up card, answer textarea |
| `/interview/:id/feedback`| `AppLayout` | Performance radial, 4 dimension bars, strengths, transcript critique |
| `/interview-history` | `AppLayout` | Historical sessions table/cards, search, category filter, view report |
| `/profile` | `AppLayout` | Career goals, target role seniority, experience, verified skills inventory |
| `/*` (Fallback) | `AppLayout` | 404 Not Found fallback screen with redirect to dashboard |

---

## 6. Current Status & Day 6 Frontend-Backend Integration

In Phase 1 Day 6:
1. **Real Authentication:** Connected to FastAPI backend with Argon2id password hashing and JWT + HttpOnly refresh token rotation.
2. **Centralized API Client:** Axios client in `src/lib/axios.ts` with request interceptor (in-memory token injection), response interceptor (standardized error formatting), and automatic 401 refresh token queue lock.
3. **Route Protection:** `ProtectedRoute` component guards all application routes (`/dashboard`, `/resume`, `/skill-gap`, `/roadmap`, `/interview/*`, `/profile`, `/settings`) with session persistence. `PublicOnlyRoute` redirects logged-in candidates away from `/login` and `/register`.
4. **Automated Testing:** Full test suite with Vitest and React Testing Library covering registration, login, protected routes, and auth context.
5. **Feature Data:** While authentication is fully integrated with live backend APIs, domain feature data (resume parsing, roadmaps, interviews) continues using mock datasets until subsequent Day phases.
