# SkillBridge AI — Design System Specification

**Phase 1 · Week 1 · Day 3 Deliverable**  
**Role:** Senior UI/UX Designer & Frontend Architect  
**Technology Constraints:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Lucide Icons  
**Status:** Approved Design System Baseline

---

## 1. Overview & Architecture

The SkillBridge AI design system is built on **Tailwind CSS v3/v4** and **shadcn/ui** conventions using CSS custom properties (variables) defined in HSL format. This architecture enables:
1. Seamless **light and dark theme switching** without stylesheet duplication.
2. Direct integration with shadcn/ui component primitives.
3. Strict visual consistency across typography, spacing, borders, shadows, and interactive states.

---

## 2. Color System (Tailwind & shadcn/ui Tokens)

### 2.1 Theme Color Tokens (CSS Custom Properties)

```css
:root {
  /* Canvas & Neutral Surfaces */
  --background: 210 40% 98%;          /* #F8FAFC (Slate 50) */
  --foreground: 222 47% 11%;          /* #0F172A (Slate 900) */
  --card: 0 0% 100%;                  /* #FFFFFF (Pure White) */
  --card-foreground: 222 47% 11%;     /* #0F172A */
  --popover: 0 0% 100%;               /* #FFFFFF */
  --popover-foreground: 222 47% 11%;  /* #0F172A */

  /* Primary Brand Accent (Precision Indigo) */
  --primary: 238 82% 59%;             /* #4F46E5 (Indigo 600) */
  --primary-foreground: 0 0% 100%;    /* #FFFFFF */
  --primary-hover: 238 82% 53%;       /* #4338CA (Indigo 700) */
  --primary-muted: 238 82% 96%;       /* #EEF2FF (Indigo 50) */

  /* Secondary & Muted Controls */
  --secondary: 210 40% 96%;            /* #F1F5F9 (Slate 100) */
  --secondary-foreground: 222 47% 11%;/* #0F172A */
  --muted: 210 40% 96%;                /* #F1F5F9 */
  --muted-foreground: 215 16% 47%;    /* #64748B (Slate 500) */
  --accent: 210 40% 96%;               /* #F1F5F9 */
  --accent-foreground: 222 47% 11%;   /* #0F172A */

  /* Structural Borders & Controls */
  --border: 214 32% 91%;              /* #E2E8F0 (Slate 200) */
  --input: 214 32% 91%;               /* #E2E8F0 (Slate 200) */
  --ring: 238 82% 59%;                /* #4F46E5 (Focus Ring) */

  /* Semantic Feedback & Status */
  --success: 158 64% 45%;             /* #10B981 (Emerald 500) */
  --success-foreground: 0 0% 100%;    /* #FFFFFF */
  --success-muted: 158 64% 95%;       /* #ECFDF5 (Emerald 50) */

  --warning: 38 92% 50%;              /* #F59E0B (Amber 500) */
  --warning-foreground: 0 0% 100%;    /* #FFFFFF */
  --warning-muted: 48 96% 95%;        /* #FFFBEB (Amber 50) */

  --destructive: 0 84% 60%;           /* #EF4444 (Rose 500) */
  --destructive-foreground: 0 0% 100%;/* #FFFFFF */
  --destructive-muted: 0 84% 96%;     /* #FEF2F2 (Rose 50) */

  --info: 199 89% 48%;                /* #0EA5E9 (Sky 500) */
  --info-foreground: 0 0% 100%;       /* #FFFFFF */
  --info-muted: 199 89% 96%;          /* #F0F9FF (Sky 50) */

  /* Border Radius Standard */
  --radius: 0.5rem;                   /* 8px default */
}

.dark {
  --background: 222 47% 7%;           /* #0B0F19 */
  --foreground: 210 40% 98%;          /* #F8FAFC */
  --card: 222 47% 11%;                /* #111827 */
  --card-foreground: 210 40% 98%;
  --popover: 222 47% 11%;
  --popover-foreground: 210 40% 98%;

  --primary: 238 82% 67%;             /* #6366F1 (Indigo 500) */
  --primary-foreground: 0 0% 100%;
  --primary-hover: 238 82% 72%;
  --primary-muted: 238 82% 16%;

  --secondary: 217 33% 17%;           /* #1E293B */
  --secondary-foreground: 210 40% 98%;
  --muted: 217 33% 17%;
  --muted-foreground: 215 20% 65%;    /* #94A3B8 */
  --accent: 217 33% 17%;
  --accent-foreground: 210 40% 98%;

  --border: 217 33% 20%;              /* #334155 */
  --input: 217 33% 20%;
  --ring: 238 82% 67%;

  --success: 158 64% 52%;             /* Emerald 400 */
  --success-muted: 158 64% 12%;
  --warning: 38 92% 55%;              /* Amber 400 */
  --warning-muted: 38 92% 12%;
  --destructive: 0 84% 65%;           /* Rose 400 */
  --destructive-muted: 0 84% 15%;
  --info: 199 89% 55%;
  --info-muted: 199 89% 15%;
}
```

### 2.2 Skill Gap & Readiness Taxonomy Palette

| Category | Tailwind Token / Class | Hex Code | Visual Meaning |
|---|---|---|---|
| **Verified / Strong Match** | `text-emerald-700 bg-emerald-50 border-emerald-200` | `#047857` | Skill confirmed from resume with strong evidence. |
| **Partial / Moderate Match** | `text-sky-700 bg-sky-50 border-sky-200` | `#0369A1` | Skill present but lacks depth or recency. |
| **Identified Skill Gap** | `text-amber-700 bg-amber-50 border-amber-200` | `#B45309` | Required skill missing; recommended for learning roadmap. |
| **Critical Missing Skill** | `text-rose-700 bg-rose-50 border-rose-200` | `#BE123C` | Core prerequisite for target role; highest roadmap priority. |
| **Optional / Nice to Have** | `text-slate-600 bg-slate-100 border-slate-200` | `#475569` | Supplementary skill for future expansion. |

---

## 3. Typography Scale

SkillBridge AI standardizes on the **Inter** typeface for UI elements and **JetBrains Mono** for technical code, score meters, and metrics.

```text
Display 2XL  ────────  36px (2.25rem) / Line Height 40px / Tracking -0.025em / Bold (700)
Heading XL   ────────  30px (1.875rem) / Line Height 36px / Tracking -0.02em / Bold (700)
Heading L    ────────  24px (1.5rem) / Line Height 32px / Tracking -0.015em / Semibold (600)
Heading M    ────────  20px (1.25rem) / Line Height 28px / Tracking -0.01em / Semibold (600)
Heading S    ────────  18px (1.125rem) / Line Height 26px / Tracking 0 / Medium (500)
Body Lg      ────────  16px (1.0rem) / Line Height 24px / Tracking 0 / Regular (400) & Medium (500)
Body Base    ────────  14px (0.875rem) / Line Height 20px / Tracking 0 / Regular (400) & Medium (500)
Body Sm      ────────  12px (0.75rem) / Line Height 16px / Tracking +0.01em / Regular (400)
Micro / Meta ────────  10px (0.625rem) / Line Height 14px / Tracking +0.05em / Semibold (600) Uppercase
```

### 3.1 Typography Token Classes

| Role | Tailwind Classes | Usage Context |
|---|---|---|
| **Page Title (H1)** | `text-2xl sm:text-3xl font-bold tracking-tight text-foreground` | Top of major screens ("Dashboard", "Resume Analysis") |
| **Section Title (H2)** | `text-lg sm:text-xl font-semibold tracking-tight text-foreground` | Card header ("Identified Strengths", "Active Roadmap") |
| **Subsection (H3)** | `text-sm sm:text-base font-semibold text-foreground` | Sub-card groupings, modal section titles |
| **Body (Default)** | `text-sm text-foreground leading-relaxed font-normal` | Paragraphs, question descriptions, task details |
| **Muted Copy** | `text-sm text-muted-foreground` | Explanatory helper text, secondary dates, disclaimers |
| **Code / Metrics** | `font-mono text-xs sm:text-sm tracking-wide` | Code snippets in questions, scores (e.g. `84/100`), timer |

---

## 4. Spacing Scale & Layout Grid

We adhere to a standard **4px baseline grid** aligned with Tailwind CSS:

| Token | Pixels | Common Application |
|---|---|---|
| `space-1` | 4px | Micro padding between icons and text, inline dot badges. |
| `space-2` | 8px | Button internal horizontal gap, badge padding, list item gap. |
| `space-3` | 12px | Compact card padding, input internal padding (`py-2 px-3`). |
| `space-4` | 16px | Standard component padding (`p-4` on mobile), form field gaps. |
| `space-6` | 24px | Desktop card padding (`p-6`), grid gutter between dashboard cards. |
| `space-8` | 32px | Section vertical spacing, page header margin bottom. |
| `space-12`| 48px | Major screen layout division, empty state container padding. |
| `space-16`| 64px | Authentication hero spacing, landing top padding. |

---

## 5. Border Radius & Shadows

### 5.1 Border Radius

- `rounded-sm`: 4px (`0.25rem`) — Code snippets, small tooltips, micro tags.
- `rounded-md`: 6px (`0.375rem`) — Form inputs, select dropdowns, buttons.
- `rounded-lg`: 8px (`0.5rem`) — Modals, popovers, navigation items (`var(--radius)`).
- `rounded-xl`: 12px (`0.75rem`) — Primary content cards, dashboard widgets, interview containers.
- `rounded-2xl`: 16px (`1.0rem`) — Hero banners, resume upload dropzones.
- `rounded-full`: 9999px — Avatars, status pill badges, circular progress rings.

### 5.2 Elevation & Shadow System

```css
/* Tailwind Mappings */
.shadow-xs {
  box-shadow: 0 1px 2px 0 rgba(15, 23, 42, 0.05);
}
.shadow-sm {
  box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.08), 0 1px 2px -1px rgba(15, 23, 42, 0.04);
}
.shadow-md {
  box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.04);
}
.shadow-lg {
  box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.03);
}
.shadow-focus {
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.25);
}
```

---

## 6. Component Variants

### 6.1 Button Variants (`Button`)

```typescript
// Button Variant Specs (shadcn/ui compatible)
const buttonVariants = {
  variant: {
    default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm active:scale-[0.98]",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
    link: "text-primary underline-offset-4 hover:underline",
    accent: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300"
  },
  size: {
    default: "h-10 px-4 py-2 text-sm",
    sm: "h-8 rounded-md px-3 text-xs",
    lg: "h-12 rounded-md px-6 text-base font-medium",
    icon: "h-10 w-10 p-0 items-center justify-center"
  }
};
```
- **Loading State:** Disabled button with animated spinner (`lucide:Loader2` with `animate-spin mr-2`) and loading label ("Generating Roadmap...").
- **Disabled State:** `opacity-50 pointer-events-none cursor-not-allowed`.

### 6.2 Input & Form Controls

- **Standard Text Input:** `h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50`.
- **Textarea:** `min-h-[120px] w-full rounded-md border border-input bg-background p-3 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none resize-y`.
- **Form Error Label:** `text-xs font-medium text-destructive mt-1 flex items-center gap-1`.

### 6.3 Card & Container Variants (`Card`)

- **Default Card:** `rounded-xl border border-border bg-card text-card-foreground shadow-sm p-6`.
- **Interactive Card:** Default card plus `transition-all duration-200 hover:border-slate-300 hover:shadow-md cursor-pointer active:scale-[0.99]`.
- **Highlighted / AI Card:** `rounded-xl border border-indigo-200 bg-gradient-to-b from-indigo-50/40 to-white dark:from-indigo-950/20 dark:to-slate-900 shadow-sm p-6`.
- **Stat Card:** Compact card with muted metric label, prominent value (`text-2xl font-bold`), sub-metric trend pill, and contextual icon.

### 6.4 Status Badge Variants (`Badge`)

- **Default:** `bg-primary/10 text-primary border border-primary/20 text-xs font-medium px-2.5 py-0.5 rounded-full`.
- **Success:** `bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-emerald-950/40 dark:text-emerald-400`.
- **Warning:** `bg-amber-50 text-amber-700 border border-amber-200 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-amber-950/40 dark:text-amber-400`.
- **Destructive:** `bg-rose-50 text-rose-700 border border-rose-200 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-rose-950/40 dark:text-rose-400`.
- **Neutral Outline:** `border border-border text-muted-foreground text-xs font-medium px-2.5 py-0.5 rounded-full`.

---

## 7. Responsive Breakpoint Strategy

We standardize on the standard Tailwind CSS viewport breakpoints:

| Viewport Prefix | Minimum Width | Device Class | Primary Layout Behavior |
|---|---|---|---|
| **Mobile (`< sm`)** | `< 640px` | Phones (iPhone, Pixel) | 1-column layout; slide-over drawer; sticky bottom actions. |
| **Small Tablet (`sm`)** | `640px` | Large phones, mini tablets | 1-to-2 column grids; compact headers. |
| **Tablet (`md`)** | `768px` | iPads, Android tablets | Sidebar collapses to icon rail or sheet; 2-column cards. |
| **Laptop (`lg`)** | `1024px` | MacBooks, Laptops | Full 260px sidebar visible; 3-column dashboard widgets. |
| **Desktop (`xl`)** | `1280px` | External monitors | Maximum container constraint (`max-w-7xl`); full side-by-side analysis view. |
| **Wide (`2xl`)** | `1536px` | Ultra-wide displays | Centered workspace; balanced whitespace margins. |

---

## 8. UX Feedback States (The 7 Standard States)

Every data-driven view and card implements 7 distinct states:

```text
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ 1. Initial   │ ──> │ 2. Loading   │ ──> │ 3. Success   │
│ Empty form   │     │ Shimmer/Pulse│     │ Populated UI │
└──────────────┘     └──────────────┘     └──────────────┘
                            │
                            ├───> ┌──────────────┐
                            │     │ 4. Empty     │ (No data found)
                            │     └──────────────┘
                            │
                            └───> ┌──────────────┐
                                  │ 5. Error     │ (Retry enabled)
                                  └──────────────┘
```

1. **Initial State:** Pristine form or uninitiated upload container with clean instructions and placeholder dropzones.
2. **Loading / Skeleton State:** Subtle pulse animation (`animate-pulse bg-slate-200 dark:bg-slate-800 rounded`) matching the exact geometrical shape of upcoming content to eliminate layout shift (CLS = 0).
3. **Empty State:** Distinct icon (`FileQuestion`, `Inbox`, or `Sparkles`), clear headline ("No resumes uploaded yet"), explanatory secondary text, and a prominent primary action CTA.
4. **Success / Populated State:** Smooth fade-in transition (`animate-in fade-in-50 duration-300`) with high-contrast data cards, verified badges, and interactive controls.
5. **Error State:** Accessible alert card (`bg-rose-50 border-rose-200 text-rose-800`) with human-readable error explanation, diagnostic request ID, and an immediate "Try Again" button.
6. **Disabled State:** Muted opacity (`opacity-50`), `cursor-not-allowed`, and descriptive tooltip explaining why the action is inactive (e.g., "Select a target role to generate a roadmap").
7. **Validation State:** Real-time inline feedback on blurred form fields with accessible ARIA live attributes.

---

## 9. Accessibility (a11y) Guidelines

SkillBridge AI adheres strictly to **WCAG 2.1 Level AA** standards:

- **Contrast Ratios:**
  - Normal text (< 18pt / 24px) maintains minimum **4.5:1** contrast against its background.
  - Large text (≥ 18pt / 24px or bold 14pt) maintains minimum **3:1** contrast.
  - Interactive UI components and borders maintain minimum **3:1** contrast against adjacent backgrounds.
- **Focus Indicators:**
  - All interactive elements possess explicit, high-contrast keyboard focus indicators: `focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2`. Focus rings are never suppressed (`outline: none` without replacement is forbidden).
- **Keyboard Navigation:**
  - Logical tab order matching visual DOM sequence.
  - Full modal trapping via Radix UI dialog primitives.
  - Standard keyboard shortcuts: `Escape` closes dialogs/drawers; `Enter` or `Space` activates buttons; arrow keys navigate select items.
- **Screen Reader Support:**
  - All informational icons include descriptive `aria-label` or are marked `aria-hidden="true"` when accompanied by visible text.
  - Dynamic AI processing updates utilize `aria-live="polite"` containers so screen readers announce completion without jarring interruption.
  - Progress bars declare `role="progressbar"`, `aria-valuenow`, `aria-valuemin="0"`, and `aria-valuemax="100"`.
- **Reduced Motion:**
  - All transitions and animations respect `prefers-reduced-motion: reduce`:
    ```css
    @media (prefers-reduced-motion: reduce) {
      *, ::before, ::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
    }
    ```
