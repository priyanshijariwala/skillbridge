import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { MemoryRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { RoadmapScreen } from "@/features/roadmap/RoadmapScreen"
import * as useRoadmapModule from "@/features/roadmap/hooks/useRoadmap"
import type { Roadmap } from "@/features/roadmap/types/roadmap.types"

const mockNavigate = vi.fn()
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom")
  return { ...actual, useNavigate: () => mockNavigate }
})

const mockRoadmap: Roadmap = {
  id: "rd_1",
  user_id: "user_1",
  target_role_id: "backend-developer",
  target_role_title: "Backend Developer",
  source_skill_gap_analysis_id: "gap_1",
  title: "Backend Developer Accelerated Preparation Curriculum",
  description: "A structured curriculum to master backend architecture.",
  estimated_duration_days: 30,
  milestones: [
    {
      id: "m_1",
      title: "Phase 1: Missing Competencies",
      description: "Master Docker and REST API architecture.",
      order: 1,
      estimated_duration_days: 14,
      priority: "high",
      status: "in_progress",
      related_skills: ["Docker", "REST APIs"],
      tasks: [
        {
          id: "t_1_1",
          title: "Master Docker Fundamentals",
          description: "Learn images, volumes, and multi-stage builds.",
          task_type: "learn",
          related_skill: "Docker",
          estimated_duration_hours: 6,
          priority: "high",
          status: "completed",
          completed_at: "2026-11-14T05:00:00Z",
          resources: ["Official Docker Tutorial"],
        },
        {
          id: "t_1_2",
          title: "Build REST API Microservice",
          description: "Develop containerized FastAPI service.",
          task_type: "project",
          related_skill: "REST APIs",
          estimated_duration_hours: 8,
          priority: "high",
          status: "in_progress",
          completed_at: null,
          resources: ["FastAPI REST Microservice Patterns"],
        },
      ],
    },
    {
      id: "m_2",
      title: "Phase 2: Database and Caching",
      description: "PostgreSQL queries and Redis caching.",
      order: 2,
      estimated_duration_days: 16,
      priority: "medium",
      status: "not_started",
      related_skills: ["PostgreSQL", "Redis"],
      tasks: [
        {
          id: "t_2_1",
          title: "Study PostgreSQL Query Plans",
          description: "Analyze EXPLAIN ANALYZE on complex joins.",
          task_type: "learn",
          related_skill: "PostgreSQL",
          estimated_duration_hours: 5,
          priority: "medium",
          status: "not_started",
          completed_at: null,
          resources: ["PostgreSQL Performance Tuning Guide"],
        },
      ],
    },
  ],
  status: "active",
  completion_percentage: 33,
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
        <RoadmapScreen />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe("RoadmapScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders loading skeleton when fetching initial data", () => {
    vi.spyOn(useRoadmapModule, "useCurrentRoadmap").mockReturnValue({
      data: undefined,
      isLoading: true,
    } as any)
    vi.spyOn(useRoadmapModule, "useLatestSkillGap").mockReturnValue({
      data: undefined,
      isLoading: false,
    } as any)
    vi.spyOn(useRoadmapModule, "useResumes").mockReturnValue({
      data: undefined,
      isLoading: false,
    } as any)
    vi.spyOn(useRoadmapModule, "useGenerateRoadmap").mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)
    vi.spyOn(useRoadmapModule, "useUpdateTaskStatus").mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    renderScreen()
    expect(screen.getByText("Personalized Learning Roadmap")).toBeInTheDocument()
  })

  it("renders empty state when user has no resume uploaded", () => {
    vi.spyOn(useRoadmapModule, "useCurrentRoadmap").mockReturnValue({
      data: null,
      isLoading: false,
    } as any)
    vi.spyOn(useRoadmapModule, "useLatestSkillGap").mockReturnValue({
      data: null,
      isLoading: false,
    } as any)
    vi.spyOn(useRoadmapModule, "useResumes").mockReturnValue({
      data: [],
      isLoading: false,
    } as any)
    vi.spyOn(useRoadmapModule, "useGenerateRoadmap").mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)
    vi.spyOn(useRoadmapModule, "useUpdateTaskStatus").mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    renderScreen()
    expect(screen.getByText("No Resume on File")).toBeInTheDocument()
    expect(screen.getByText("Upload Resume")).toBeInTheDocument()
  })

  it("renders empty state when resume exists but no skill gap analysis yet", () => {
    vi.spyOn(useRoadmapModule, "useCurrentRoadmap").mockReturnValue({
      data: null,
      isLoading: false,
    } as any)
    vi.spyOn(useRoadmapModule, "useLatestSkillGap").mockReturnValue({
      data: null,
      isLoading: false,
    } as any)
    vi.spyOn(useRoadmapModule, "useResumes").mockReturnValue({
      data: [{ id: "res_1", original_filename: "cv.pdf" }],
      isLoading: false,
    } as any)
    vi.spyOn(useRoadmapModule, "useGenerateRoadmap").mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)
    vi.spyOn(useRoadmapModule, "useUpdateTaskStatus").mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    renderScreen()
    expect(screen.getByText("Skill Gap Analysis Required")).toBeInTheDocument()
    expect(screen.getByText("Go to Skill Gap Analysis")).toBeInTheDocument()
  })

  it("renders ready-to-build state when skill gap exists but no roadmap generated yet", () => {
    vi.spyOn(useRoadmapModule, "useCurrentRoadmap").mockReturnValue({
      data: null,
      isLoading: false,
    } as any)
    vi.spyOn(useRoadmapModule, "useLatestSkillGap").mockReturnValue({
      data: { id: "gap_1", target_role_title: "Backend Developer" },
      isLoading: false,
    } as any)
    vi.spyOn(useRoadmapModule, "useResumes").mockReturnValue({
      data: [{ id: "res_1", original_filename: "cv.pdf" }],
      isLoading: false,
    } as any)
    vi.spyOn(useRoadmapModule, "useGenerateRoadmap").mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)
    vi.spyOn(useRoadmapModule, "useUpdateTaskStatus").mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    renderScreen()
    expect(screen.getByText("Ready to Build Your Learning Curriculum")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Generate Learning Roadmap/i })).toBeInTheDocument()
  })

  it("renders active roadmap with milestones, tasks, and progress banner", () => {
    vi.spyOn(useRoadmapModule, "useCurrentRoadmap").mockReturnValue({
      data: mockRoadmap,
      isLoading: false,
    } as any)
    vi.spyOn(useRoadmapModule, "useLatestSkillGap").mockReturnValue({
      data: { id: "gap_1", target_role_title: "Backend Developer" },
      isLoading: false,
    } as any)
    vi.spyOn(useRoadmapModule, "useResumes").mockReturnValue({
      data: [{ id: "res_1", original_filename: "cv.pdf" }],
      isLoading: false,
    } as any)
    vi.spyOn(useRoadmapModule, "useGenerateRoadmap").mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)
    vi.spyOn(useRoadmapModule, "useUpdateTaskStatus").mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    renderScreen()

    // Banner metrics
    expect(screen.getByText(/Target Goal: Backend Developer/i)).toBeInTheDocument()
    expect(screen.getByText(/1 of 3 Tasks Completed/i)).toBeInTheDocument()
    expect(screen.getAllByText(/33%/)[0]).toBeInTheDocument()

    // Quick metric cards
    expect(screen.getByText("Milestones")).toBeInTheDocument()
    expect(screen.getByText("Completed Tasks")).toBeInTheDocument()
    expect(screen.getAllByText("In Progress")[0]).toBeInTheDocument()
    expect(screen.getByText("Estimated Time")).toBeInTheDocument()

    // Milestone cards
    expect(screen.getAllByText("Phase 1: Missing Competencies")[0]).toBeInTheDocument()
    expect(screen.getByText("Phase 2: Database and Caching")).toBeInTheDocument()

    // Task cards
    expect(screen.getByText("Master Docker Fundamentals")).toBeInTheDocument()
    expect(screen.getByText("Build REST API Microservice")).toBeInTheDocument()
    expect(screen.getByText("Official Docker Tutorial")).toBeInTheDocument()
  })

  it("displays stale alert when roadmap is marked stale", () => {
    vi.spyOn(useRoadmapModule, "useCurrentRoadmap").mockReturnValue({
      data: { ...mockRoadmap, is_stale: true },
      isLoading: false,
    } as any)
    vi.spyOn(useRoadmapModule, "useLatestSkillGap").mockReturnValue({
      data: { id: "gap_2", target_role_title: "Backend Developer" },
      isLoading: false,
    } as any)
    vi.spyOn(useRoadmapModule, "useResumes").mockReturnValue({
      data: [{ id: "res_1", original_filename: "cv.pdf" }],
      isLoading: false,
    } as any)
    vi.spyOn(useRoadmapModule, "useGenerateRoadmap").mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)
    vi.spyOn(useRoadmapModule, "useUpdateTaskStatus").mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    renderScreen()
    expect(screen.getByText(/Curriculum Calibrated to Previous Version/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Regenerate Roadmap/i })).toBeInTheDocument()
  })

  it("handles task status transitions correctly", async () => {
    const mockUpdate = vi.fn().mockResolvedValue({})
    vi.spyOn(useRoadmapModule, "useCurrentRoadmap").mockReturnValue({
      data: mockRoadmap,
      isLoading: false,
    } as any)
    vi.spyOn(useRoadmapModule, "useLatestSkillGap").mockReturnValue({
      data: { id: "gap_1" },
      isLoading: false,
    } as any)
    vi.spyOn(useRoadmapModule, "useResumes").mockReturnValue({
      data: [{ id: "res_1" }],
      isLoading: false,
    } as any)
    vi.spyOn(useRoadmapModule, "useGenerateRoadmap").mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)
    vi.spyOn(useRoadmapModule, "useUpdateTaskStatus").mockReturnValue({
      mutateAsync: mockUpdate,
      isPending: false,
    } as any)

    renderScreen()

    // Task 2 is in_progress -> click "Mark Completed"
    const completeBtn = screen.getByRole("button", { name: /Mark Completed/i })
    fireEvent.click(completeBtn)

    expect(mockUpdate).toHaveBeenCalledWith({
      roadmapId: "rd_1",
      taskId: "t_1_2",
      status: "completed",
    })
  })

  it("allows switching between milestones", () => {
    vi.spyOn(useRoadmapModule, "useCurrentRoadmap").mockReturnValue({
      data: mockRoadmap,
      isLoading: false,
    } as any)
    vi.spyOn(useRoadmapModule, "useLatestSkillGap").mockReturnValue({
      data: { id: "gap_1" },
      isLoading: false,
    } as any)
    vi.spyOn(useRoadmapModule, "useResumes").mockReturnValue({
      data: [{ id: "res_1" }],
      isLoading: false,
    } as any)
    vi.spyOn(useRoadmapModule, "useGenerateRoadmap").mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)
    vi.spyOn(useRoadmapModule, "useUpdateTaskStatus").mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    renderScreen()

    // Click on Phase 2
    const phase2Card = screen.getByText("Phase 2: Database and Caching")
    fireEvent.click(phase2Card)

    // Phase 2 task should be visible
    expect(screen.getByText("Study PostgreSQL Query Plans")).toBeInTheDocument()
    expect(screen.getByText("PostgreSQL Performance Tuning Guide")).toBeInTheDocument()
  })
})
