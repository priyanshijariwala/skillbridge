# SkillBridge AI — Component Inventory & Frontend Architecture

**Phase 1 · Week 1 · Day 3 Deliverable**  
**Role:** Senior Frontend Architect & UI/UX Designer  
**Technology Constraints:** React 18/19, TypeScript, Tailwind CSS, shadcn/ui, Lucide React  
**Status:** Component Blueprint Baseline  
**Related Documents:** [docs/design-system.md](file:///Users/macos/Documents/Skillbridge/docs/design-system.md) · [docs/screen-specifications.md](file:///Users/macos/Documents/Skillbridge/docs/screen-specifications.md)

---

## 1. Architectural Principles & Taxonomy

The SkillBridge AI component inventory follows a modular, hierarchical architecture designed for maintainability, zero layout shift (CLS = 0), and strict type safety:

```text
src/components/
├── ui/                   # Unmodified shadcn/ui foundational primitives (Button, Dialog, Input...)
├── common/               # Universal design-system wrappers (PageHeader, StatCard, EmptyState...)
├── layout/               # Global shell architecture (AppSidebar, AppHeader, ZenInterviewHeader...)
└── features/             # Domain-specific compositions
    ├── auth/             # Login, Register, Password Strength
    ├── dashboard/        # WelcomeBanner, ReadinessOverview, ActivityFeed
    ├── resume/           # ResumeUploadDropzone, ResumeScoreCard, SkillsCloud
    ├── skill-gap/        # RoleSelector, GapMatrix, CompetencyAuditCard
    ├── roadmap/          # RoadmapTimeline, RoadmapTaskCard, WeekAccordion
    └── interview/        # QuestionCard, FollowUpCard, AnswerEditor, FeedbackScoreCard
```

---

## 2. Layout & Global Shell Components

### 2.1 `AppSidebar`
- **Purpose:** Primary application navigation rail. Hosts brand logo, navigation links with active routing indicators, target role indicator, and profile quick access.
- **Reusability:** Global layout wrapper for all authenticated views except Zen Mode.
- **Responsive Behavior:** Fixed 260px width on desktop (`lg:`+). Collapses to an accessible slide-over sheet drawer on tablet/mobile (< 1024px).
- **Conceptual Props:**
```typescript
export interface AppSidebarProps {
  currentPath: string;
  targetRoleTitle?: string;
  user: {
    fullName: string;
    email: string;
    avatarUrl?: string;
  };
  isMobileOpen: boolean;
  onMobileClose: () => void;
}
```

### 2.2 `AppHeader`
- **Purpose:** Top utility bar hosting dynamic breadcrumb navigation, search shortcut trigger, help links, and user account dropdown.
- **Reusability:** Shared across all standard authenticated pages.
- **Responsive Behavior:** Height fixed at 64px (`h-16`). On mobile, renders the hamburger menu button on the far left.
- **Conceptual Props:**
```typescript
export interface AppHeaderProps {
  breadcrumbs: Array<{ label: string; href?: string }>;
  onMenuClick: () => void; // Mobile sheet trigger
  onSearchClick?: () => void;
  user: {
    fullName: string;
    avatarUrl?: string;
  };
}
```

### 2.3 `PageHeader`
- **Purpose:** Standardized page introduction block containing the primary H1 title, descriptive subtitle, and contextual primary/secondary action buttons.
- **Reusability:** Present at the top of every main view (Dashboard, Resume, Roadmap, History).
- **Responsive Behavior:** Flex column on mobile (< 640px) with stacked action buttons; flex row with right-aligned actions on desktop.
- **Conceptual Props:**
```typescript
export interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: {
    label: string;
    variant?: "default" | "success" | "warning" | "destructive" | "outline";
  };
  actions?: React.ReactNode;
}
```

### 2.4 `Breadcrumbs`
- **Purpose:** Render hierarchical navigation trail (`Home > Resume > Analysis`).
- **Conceptual Props:**
```typescript
export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}
```

---

## 3. Universal Data Display & Feedback Components

### 3.1 `StatCard`
- **Purpose:** Compact card rendering a primary metric, contextual label, trend indicator (+/- percentage or count), and Lucide icon.
- **Reusability:** Used in Dashboard, Resume summary, and Interview analytics.
- **Responsive Behavior:** Fits standard 12-column grid (`col-span-12 sm:col-span-6 lg:col-span-3`).
- **Conceptual Props:**
```typescript
export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  actionLabel?: string;
  onAction?: () => void;
}
```

### 3.2 `ProgressCard`
- **Purpose:** Display a titled progress metric with an animated progress bar or circular ring.
- **Conceptual Props:**
```typescript
export interface ProgressCardProps {
  title: string;
  currentValue: number;
  totalValue: number;
  unitLabel?: string; // e.g. "tasks" or "skills"
  percentage: number;
  variant?: "primary" | "success" | "warning" | "destructive";
  subtitle?: string;
}
```

### 3.3 `SkillBadge`
- **Purpose:** Visual pill tag representing a technical competency or soft skill, with status-based color coding.
- **Reusability:** High. Used in Resume Analysis, Skill Gap, Profile, and Interview Feedback.
- **Conceptual Props:**
```typescript
export type SkillMatchStatus = "verified" | "partial" | "gap" | "critical_gap" | "neutral";

export interface SkillBadgeProps {
  name: string;
  status?: SkillMatchStatus;
  category?: string;
  isRemovable?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
}
```

### 3.4 `SkillProgressBar`
- **Purpose:** Visual linear bar representing mastery or match depth for a specific technical domain.
- **Conceptual Props:**
```typescript
export interface SkillProgressBarProps {
  skillName: string;
  levelPercentage: number;
  targetPercentage: number;
  status: SkillMatchStatus;
  showLabels?: boolean;
}
```

### 3.5 `EmptyState`
- **Purpose:** Render an engaging, non-intimidating placeholder when lists or records have no data.
- **Reusability:** Used across Resumes, Roadmap tasks, Interview history, and Notifications.
- **Responsive Behavior:** Centered padded box (`py-12 px-4`).
- **Conceptual Props:**
```typescript
export interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ComponentType<{ className?: string }>;
  };
}
```

### 3.6 `LoadingSkeleton`
- **Purpose:** Render zero-CLS pulsing placeholder silhouettes matching actual data layouts.
- **Variants:** `card`, `stat`, `table-row`, `text`, `avatar`.
- **Conceptual Props:**
```typescript
export interface LoadingSkeletonProps {
  variant: "stat" | "card" | "table-row" | "text-block" | "interview-question";
  count?: number;
  className?: string;
}
```

### 3.7 `ErrorState`
- **Purpose:** Display an accessible alert banner or full-screen card when network or AI requests fail.
- **Conceptual Props:**
```typescript
export interface ErrorStateProps {
  title?: string;
  message: string;
  code?: string;
  requestId?: string;
  onRetry?: () => void;
  isCompact?: boolean;
}
```

### 3.8 `ConfirmDialog`
- **Purpose:** Accessible confirmation modal for destructive or session-terminating actions (e.g., exiting an active interview).
- **Conceptual Props:**
```typescript
export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: "destructive" | "default";
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}
```

---

## 4. Feature Components: Resume Analysis

### 4.1 `ResumeUploadDropzone`
- **Purpose:** Interactive drag-and-drop file upload container with visual drag states, progress bar, file size/type validation, and error feedback.
- **Reusability:** Used on `/resume` and onboarding wizard.
- **Responsive Behavior:** Expands to 100% container width.
- **Conceptual Props:**
```typescript
export interface ResumeUploadDropzoneProps {
  onFileSelect: (file: File) => void;
  isUploading: boolean;
  uploadProgress?: number; // 0 to 100
  acceptedFileTypes?: string[]; // [".pdf", ".docx"]
  maxFileSizeMB?: number; // 5
  error?: string | null;
  onClearError?: () => void;
}
```

### 4.2 `ResumeScoreCard`
- **Purpose:** Visual summary of overall resume benchmark score, quality tier ("Ready", "Needs Work"), and high-level evaluation statement.
- **Conceptual Props:**
```typescript
export interface ResumeScoreCardProps {
  overallScore: number; // 0 to 100
  evaluationSummary: string;
  lastParsedDate: string;
  fileName: string;
  fileSizeBytes: number;
}
```

### 4.3 `ResumeAuditSection`
- **Purpose:** Accordion or list rendering parsed strengths, actionable weaknesses, and formatting advice.
- **Conceptual Props:**
```typescript
export interface AuditItem {
  id: string;
  type: "strength" | "improvement" | "format";
  title: string;
  description: string;
  recommendation?: string;
}

export interface ResumeAuditSectionProps {
  items: AuditItem[];
}
```

---

## 5. Feature Components: Skill Gap Analysis

### 5.1 `TargetRoleSelector`
- **Purpose:** Dropdown combobox to search and switch target roles or paste a custom job description.
- **Conceptual Props:**
```typescript
export interface JobRoleOption {
  id: string;
  title: string;
  category: string;
  requiredSkillCount: number;
}

export interface TargetRoleSelectorProps {
  selectedRoleId: string;
  roles: JobRoleOption[];
  onSelectRole: (roleId: string) => void;
  onCustomJobDescription?: (text: string) => void;
}
```

### 5.2 `SkillGapCard`
- **Purpose:** Individual card representing a missing or partial competency, displaying current vs expected depth, why it matters, and direct action triggers.
- **Conceptual Props:**
```typescript
export interface SkillGapCardProps {
  skillName: string;
  priority: "critical" | "high" | "medium";
  expectedDescription: string;
  detectedDescription: string;
  onAddToRoadmap?: () => void;
  onPracticeInterview?: () => void;
}
```

---

## 6. Feature Components: Learning Roadmap

### 6.1 `RoadmapTimeline`
- **Purpose:** Horizontal step/tab navigation allowing candidates to switch between Week 1, Week 2, Week 3, and Week 4 of their curriculum.
- **Responsive Behavior:** Converts from horizontal step rail on desktop to horizontally scrollable swipe tabs on mobile.
- **Conceptual Props:**
```typescript
export interface RoadmapWeekSummary {
  weekNumber: number;
  title: string;
  isCompleted: boolean;
  isCurrent: boolean;
  taskCount: number;
  completedTaskCount: number;
}

export interface RoadmapTimelineProps {
  weeks: RoadmapWeekSummary[];
  activeWeekNumber: number;
  onSelectWeek: (weekNumber: number) => void;
}
```

### 6.2 `RoadmapTaskCard`
- **Purpose:** Interactive card for a single learning task with completion checkbox, estimated effort badge, priority pill, resource link, and mock practice shortcut.
- **Conceptual Props:**
```typescript
export interface RoadmapTaskCardProps {
  taskId: string;
  title: string;
  description: string;
  type: "concept" | "implementation" | "practice";
  estimatedMinutes: number;
  priority: "high" | "medium" | "low";
  resource?: {
    title: string;
    url: string;
  };
  isCompleted: boolean;
  onToggleComplete: (taskId: string, currentStatus: boolean) => void;
  onPracticeTopic?: () => void;
}
```

---

## 7. Feature Components: AI Mock Interview

### 7.1 `InterviewHeaderBar` (Zen Mode)
- **Purpose:** Minimalist top bar for the active interview. Hides full app navigation to prevent distraction. Displays role title, question progress, timer, pause, and exit triggers.
- **Conceptual Props:**
```typescript
export interface InterviewHeaderBarProps {
  roleTitle: string;
  interviewType: "technical" | "behavioral" | "mixed";
  currentQuestionNumber: number;
  totalQuestions: number;
  activeFollowUpIndex: number;
  maxFollowUps: number;
  elapsedSeconds?: number;
  onPause?: () => void;
  onExit: () => void;
}
```

### 7.2 `InterviewQuestionCard`
- **Purpose:** Visual card presenting the current primary interview question or adaptive follow-up question.
- **Conceptual Props:**
```typescript
export interface InterviewQuestionCardProps {
  questionNumber: number;
  isFollowUp?: boolean;
  followUpIndex?: number;
  topicTag?: string;
  content: string;
  guidanceTip?: string;
}
```

### 7.3 `InterviewAnswerEditor`
- **Purpose:** Rich answer input textarea with word count counter, auto-save status indicator, submit button, and clear action.
- **Conceptual Props:**
```typescript
export interface InterviewAnswerEditorProps {
  value: string;
  onChange: (text: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  isAutoSaved?: boolean;
  minWords?: number;
  onClear?: () => void;
}
```

### 7.4 `FeedbackScoreCard`
- **Purpose:** High-impact radial or linear score display showing overall candidate interview rating (0–100), benchmark categorization, and performance breakdown.
- **Conceptual Props:**
```typescript
export interface DimensionScore {
  name: string; // e.g. "Technical Accuracy"
  score: number; // 0 to 100
  weightPercentage: number;
}

export interface FeedbackScoreCardProps {
  overallScore: number;
  benchmarkTier: "Needs Practice" | "Solid Foundation" | "Interview Ready" | "Exceptional";
  dimensions: DimensionScore[];
}
```

### 7.5 `TranscriptItemAccordion`
- **Purpose:** Collapsible question review card on the interview feedback screen displaying question prompt, candidate's answer, AI critique, and recommended model response.
- **Conceptual Props:**
```typescript
export interface TranscriptItem {
  id: string;
  questionNumber: number;
  questionText: string;
  userAnswer: string;
  followUpQuestion?: string;
  followUpAnswer?: string;
  score: number; // e.g. 8/10
  strengths: string[];
  improvements: string[];
  modelAnswerRecommendation: string;
}

export interface TranscriptItemAccordionProps {
  items: TranscriptItem[];
}
```

---

## 8. Component Dependency Matrix

| Component | Depends On (shadcn/ui or Primitives) | Consumed By Screen(s) |
|---|---|---|
| `AppSidebar` | `Button`, `Sheet`, `ScrollArea` | SCR-02, SCR-03, SCR-04, SCR-05, SCR-09, SCR-10 |
| `AppHeader` | `Breadcrumbs`, `Avatar`, `DropdownMenu` | SCR-02 through SCR-10 |
| `StatCard` | `Card`, `Badge` | SCR-02 (Dashboard), SCR-03 (Resume) |
| `ResumeUploadDropzone`| `Progress`, `Button`, `Alert` | SCR-03 (Resume), Onboarding |
| `SkillGapCard` | `Card`, `Badge`, `Button` | SCR-04 (Skill Gap) |
| `RoadmapTaskCard` | `Checkbox`, `Card`, `Badge` | SCR-05 (Roadmap), SCR-02 (Dashboard) |
| `InterviewAnswerEditor`| `Textarea`, `Button`, `Badge` | SCR-07 (Interview Stage) |
| `FeedbackScoreCard` | `Card`, `Progress` | SCR-08 (Feedback Report) |
| `ConfirmDialog` | `AlertDialog` | SCR-07 (Exit Modal), SCR-03 (Delete Resume) |
