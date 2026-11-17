import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { MemoryRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { SkillGapScreen } from "@/features/skill-gap/SkillGapScreen"
import * as useSkillGapModule from "@/features/skill-gap/hooks/useSkillGap"
import type { JobRole, SkillGapAnalysis } from "@/features/skill-gap/types/skillGap.types"

const mockNavigate = vi.fn()
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom")
  return { ...actual, useNavigate: () => mockNavigate }
})

const mockRoles: JobRole[] = [
  {
    id: "role_1",
    slug: "backend-developer",
    title: "Backend Developer",
    category: "Backend Engineering",
    description: "Design and build server-side systems and APIs.",
    experience_level: "Mid",
    required_skills: [
      { name: "Python", importance: 5, category: "Languages" },
      { name: "FastAPI", importance: 4, category: "Frameworks" },
      { name: "Docker", importance: 4, category: "DevOps" },
    ],
    optional_skills: [
      { name: "Redis", importance: 3, category: "Databases" },
    ],
    is_active: true,
  },
  {
    id: "role_2",
    slug: "frontend-developer",
    title: "Frontend Developer",
    category: "Frontend Engineering",
    description: "Build user interfaces.",
    experience_level: "Mid",
    required_skills: [
      { name: "React", importance: 5, category: "Frameworks" },
      { name: "TypeScript", importance: 4, category: "Languages" },
    ],
    optional_skills: [],
    is_active: true,
  },
]

const mockAnalysis: SkillGapAnalysis = {
  id: "gap_1",
  user_id: "user_1",
  resume_id: "res_1",
  resume_analysis_id: "an_1",
  target_role_id: "role_1",
  target_role_title: "Backend Developer",
  match_percentage: 69,
  summary: "Strong candidate matching core Python backend requirements.",
  counts: {
    matched: 2,
    partial: 1,
    missing: 1,
    optional: 1,
    total_required: 4,
  },
  matched_skills: [
    { name: "Python", importance: 5, category: "Languages", evidence: "5 years experience" },
    { name: "FastAPI", importance: 4, category: "Frameworks", evidence: "Built REST microservices" },
  ],
  partially_matched_skills: [
    { name: "PostgreSQL", importance: 4, category: "Databases", reason: "Basic SQL queries" },
  ],
  missing_skills: [
    { name: "Docker", importance: 4, category: "DevOps" },
  ],
  optional_skills: [
    { name: "Redis", importance: 3, category: "Databases", status: "missing" },
  ],
  recommendations: [
    {
      skill: "Docker",
      priority: "high",
      reason: "Essential for microservices containerization.",
      practical_project: "Containerize a FastAPI service with multi-stage build.",
      learning_activity: "Complete Docker container lifecycle guide.",
    },
  ],
  is_stale: false,
}

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })

const renderScreen = () => {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <SkillGapScreen />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe("SkillGapScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders loading skeleton when fetching initial data", () => {
    vi.spyOn(useSkillGapModule, "useJobRoles").mockReturnValue({
      data: undefined,
      isLoading: true,
    } as any)
    vi.spyOn(useSkillGapModule, "useLatestSkillGap").mockReturnValue({
      data: undefined,
      isLoading: false,
    } as any)
    vi.spyOn(useSkillGapModule, "useResumes").mockReturnValue({
      data: undefined,
      isLoading: false,
    } as any)
    vi.spyOn(useSkillGapModule, "useUserProfile").mockReturnValue({
      data: undefined,
      isLoading: false,
    } as any)
    vi.spyOn(useSkillGapModule, "useAnalyzeSkillGap").mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    renderScreen()
    expect(screen.getByText("Skill Gap Analysis")).toBeInTheDocument()
    expect(screen.getByText(/Evaluating candidate competencies/i)).toBeInTheDocument()
  })

  it("renders empty state when user has no resume uploaded", () => {
    vi.spyOn(useSkillGapModule, "useJobRoles").mockReturnValue({
      data: mockRoles,
      isLoading: false,
    } as any)
    vi.spyOn(useSkillGapModule, "useLatestSkillGap").mockReturnValue({
      data: null,
      isLoading: false,
    } as any)
    vi.spyOn(useSkillGapModule, "useResumes").mockReturnValue({
      data: [],
      isLoading: false,
    } as any)
    vi.spyOn(useSkillGapModule, "useUserProfile").mockReturnValue({
      data: null,
      isLoading: false,
    } as any)
    vi.spyOn(useSkillGapModule, "useAnalyzeSkillGap").mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    renderScreen()
    expect(screen.getByText("No Resume Uploaded")).toBeInTheDocument()
    expect(screen.getByText("Upload Resume")).toBeInTheDocument()
  })

  it("renders ready-for-evaluation state when resume is uploaded but no gap analysis generated yet", () => {
    vi.spyOn(useSkillGapModule, "useJobRoles").mockReturnValue({
      data: mockRoles,
      isLoading: false,
    } as any)
    vi.spyOn(useSkillGapModule, "useLatestSkillGap").mockReturnValue({
      data: null,
      isLoading: false,
    } as any)
    vi.spyOn(useSkillGapModule, "useResumes").mockReturnValue({
      data: [{ id: "res_1", original_filename: "my_cv.pdf" }],
      isLoading: false,
    } as any)
    vi.spyOn(useSkillGapModule, "useUserProfile").mockReturnValue({
      data: null,
      isLoading: false,
    } as any)
    vi.spyOn(useSkillGapModule, "useAnalyzeSkillGap").mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    renderScreen()
    expect(screen.getByText("Ready for Competency Evaluation")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Start Skill Gap Analysis/i })).toBeInTheDocument()
  })

  it("renders complete skill gap analysis dashboard with match percentage, breakdown cards, and recommendations", () => {
    vi.spyOn(useSkillGapModule, "useJobRoles").mockReturnValue({
      data: mockRoles,
      isLoading: false,
    } as any)
    vi.spyOn(useSkillGapModule, "useLatestSkillGap").mockReturnValue({
      data: mockAnalysis,
      isLoading: false,
    } as any)
    vi.spyOn(useSkillGapModule, "useResumes").mockReturnValue({
      data: [{ id: "res_1", original_filename: "my_cv.pdf" }],
      isLoading: false,
    } as any)
    vi.spyOn(useSkillGapModule, "useUserProfile").mockReturnValue({
      data: null,
      isLoading: false,
    } as any)
    vi.spyOn(useSkillGapModule, "useAnalyzeSkillGap").mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    renderScreen()

    // Overall match banner
    expect(screen.getAllByText(/69%/)[0]).toBeInTheDocument()
    expect(screen.getByText(/Competency Match/i)).toBeInTheDocument()
    expect(screen.getByText(/Strong candidate matching core Python backend requirements/i)).toBeInTheDocument()

    // Summary counts
    expect(screen.getByText("Verified Matched")).toBeInTheDocument()
    expect(screen.getByText("Partially Matched")).toBeInTheDocument()
    expect(screen.getByText("Missing Competencies")).toBeInTheDocument()
    expect(screen.getByText("Optional / Bonus")).toBeInTheDocument()

    // Skills rendered
    expect(screen.getByText("Python")).toBeInTheDocument()
    expect(screen.getByText("FastAPI")).toBeInTheDocument()
    expect(screen.getAllByText("Docker")[0]).toBeInTheDocument()

    // Recommendation
    expect(screen.getByText("Actionable Improvement Roadmap")).toBeInTheDocument()
    expect(screen.getByText(/Containerize a FastAPI service/i)).toBeInTheDocument()
  })

  it("displays stale alert when analysis is stale", () => {
    vi.spyOn(useSkillGapModule, "useJobRoles").mockReturnValue({
      data: mockRoles,
      isLoading: false,
    } as any)
    vi.spyOn(useSkillGapModule, "useLatestSkillGap").mockReturnValue({
      data: { ...mockAnalysis, is_stale: true },
      isLoading: false,
    } as any)
    vi.spyOn(useSkillGapModule, "useResumes").mockReturnValue({
      data: [{ id: "res_1", original_filename: "my_cv.pdf" }],
      isLoading: false,
    } as any)
    vi.spyOn(useSkillGapModule, "useUserProfile").mockReturnValue({
      data: null,
      isLoading: false,
    } as any)
    vi.spyOn(useSkillGapModule, "useAnalyzeSkillGap").mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    renderScreen()
    expect(screen.getByText(/Analysis Calibrated to Previous Version/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Recalibrate Now/i })).toBeInTheDocument()
  })

  it("handles filter tabs switching correctly", async () => {
    vi.spyOn(useSkillGapModule, "useJobRoles").mockReturnValue({
      data: mockRoles,
      isLoading: false,
    } as any)
    vi.spyOn(useSkillGapModule, "useLatestSkillGap").mockReturnValue({
      data: mockAnalysis,
      isLoading: false,
    } as any)
    vi.spyOn(useSkillGapModule, "useResumes").mockReturnValue({
      data: [{ id: "res_1", original_filename: "my_cv.pdf" }],
      isLoading: false,
    } as any)
    vi.spyOn(useSkillGapModule, "useUserProfile").mockReturnValue({
      data: null,
      isLoading: false,
    } as any)
    vi.spyOn(useSkillGapModule, "useAnalyzeSkillGap").mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    renderScreen()

    // Switch to Missing Gaps tab
    const missingTab = screen.getByRole("button", { name: /Missing Gaps/i })
    fireEvent.click(missingTab)

    expect(screen.getAllByText("Docker")[0]).toBeInTheDocument()
    // Python (which was matched) should not appear in missing tab
    expect(screen.queryByText("5 years experience")).not.toBeInTheDocument()
  })
})
