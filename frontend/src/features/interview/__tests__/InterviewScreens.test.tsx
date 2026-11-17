import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { InterviewSetupScreen } from "../InterviewSetupScreen"
import { InterviewScreen } from "../InterviewScreen"
import { InterviewFeedbackScreen } from "../InterviewFeedbackScreen"
import { InterviewHistoryScreen } from "../InterviewHistoryScreen"
import * as useInterviewModule from "../hooks/useInterview"
import * as useSkillGapModule from "@/features/skill-gap/hooks/useSkillGap"

const mockNavigate = vi.fn()
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom")
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe("Interview Feature Screens", () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
  })

  // 1. InterviewSetupScreen Tests
  describe("InterviewSetupScreen", () => {
    it("renders role selector and options", async () => {
      vi.spyOn(useSkillGapModule, "useJobRoles").mockReturnValue({
        data: [
          {
            id: "role_backend",
            title: "Backend Developer",
            slug: "backend-developer",
            category: "Engineering",
            description: "APIs and DBs",
            required_skills: [],
            is_active: true,
          },
        ],
        isLoading: false,
      } as any)

      vi.spyOn(useInterviewModule, "useCreateInterview").mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
      } as any)

      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <InterviewSetupScreen />
          </MemoryRouter>
        </QueryClientProvider>
      )

      expect(screen.getByText("Configure AI Mock Interview")).toBeInTheDocument()
      expect(screen.getByText("Backend Developer (Engineering)")).toBeInTheDocument()
      expect(screen.getByText("Launch Distraction-Free Interview")).toBeInTheDocument()
    })

    it("submits setup form and invokes createInterview mutation", async () => {
      const mutateMock = vi.fn((_payload, options) => {
        if (options?.onSuccess) {
          options.onSuccess({ id: "int_123" })
        }
      })

      vi.spyOn(useSkillGapModule, "useJobRoles").mockReturnValue({
        data: [
          {
            id: "role_backend",
            title: "Backend Developer",
            slug: "backend-developer",
            category: "Engineering",
            description: "APIs",
            required_skills: [],
            is_active: true,
          },
        ],
        isLoading: false,
      } as any)

      vi.spyOn(useInterviewModule, "useCreateInterview").mockReturnValue({
        mutate: mutateMock,
        isPending: false,
      } as any)

      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <InterviewSetupScreen />
          </MemoryRouter>
        </QueryClientProvider>
      )

      const submitButton = screen.getByText("Launch Distraction-Free Interview")
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mutateMock).toHaveBeenCalled()
        expect(mockNavigate).toHaveBeenCalledWith("/interview/int_123")
      })
    })
  })

  // 2. InterviewScreen Tests
  describe("InterviewScreen", () => {
    it("renders active interview question and handles answer submission", async () => {
      const submitAnswerMock = vi.fn((_payload, options) => {
        if (options?.onSuccess) {
          options.onSuccess({
            saved_answer_id: "ans_1",
            is_completed: false,
          })
        }
      })

      vi.spyOn(useInterviewModule, "useInterview").mockReturnValue({
        data: {
          id: "int_123",
          target_role_id: "role_backend",
          target_role_title: "Backend Developer",
          interview_type: "technical",
          difficulty: "intermediate",
          mode: "text",
          status: "in_progress",
          settings: {
            main_question_limit: 5,
            follow_up_limit_per_question: 2,
            duration_minutes: 30,
          },
          current_question_number: 1,
          current_follow_up_depth: 0,
          current_question: {
            id: "q_1",
            interview_id: "int_123",
            sequence: 1,
            role: "assistant",
            message_type: "question",
            content: "Explain database indexing strategies in PostgreSQL.",
            question_number: 1,
            follow_up_depth: 0,
          },
        },
        isLoading: false,
        error: null,
      } as any)

      vi.spyOn(useInterviewModule, "useInterviewMessages").mockReturnValue({
        data: [
          {
            id: "q_1",
            interview_id: "int_123",
            sequence: 1,
            role: "assistant",
            message_type: "question",
            content: "Explain database indexing strategies in PostgreSQL.",
            question_number: 1,
            follow_up_depth: 0,
          },
        ],
        isLoading: false,
      } as any)

      vi.spyOn(useInterviewModule, "useSubmitAnswer").mockReturnValue({
        mutate: submitAnswerMock,
        isPending: false,
      } as any)

      vi.spyOn(useInterviewModule, "useCompleteInterview").mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
      } as any)

      vi.spyOn(useInterviewModule, "useAbandonInterview").mockReturnValue({
        mutate: vi.fn(),
      } as any)

      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={["/interview/int_123"]}>
            <Routes>
              <Route path="/interview/:interviewId" element={<InterviewScreen />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      )

      expect(
        screen.getByText('"Explain database indexing strategies in PostgreSQL."')
      ).toBeInTheDocument()

      const textarea = screen.getByPlaceholderText(/Type your technical explanation here/i)
      fireEvent.change(textarea, {
        target: {
          value:
            "PostgreSQL uses B-Tree indexes by default for equality and range queries. For full text search, GIN indexes are preferred.",
        },
      })

      const submitBtn = screen.getByText("Submit Answer & Continue")
      fireEvent.click(submitBtn)

      expect(submitAnswerMock).toHaveBeenCalledWith(
        expect.objectContaining({
          question_id: "q_1",
          answer: expect.stringContaining("PostgreSQL uses B-Tree"),
        }),
        expect.any(Object)
      )
    })
  })

  // 3. InterviewFeedbackScreen Tests
  describe("InterviewFeedbackScreen", () => {
    it("renders evaluation report with overall score and dimension breakdown", async () => {
      vi.spyOn(useInterviewModule, "useInterview").mockReturnValue({
        data: {
          id: "int_123",
          target_role_title: "Senior Backend Developer",
          interview_type: "technical",
          settings: { duration_minutes: 30 },
        },
        isLoading: false,
      } as any)

      vi.spyOn(useInterviewModule, "useInterviewFeedback").mockReturnValue({
        data: {
          id: "fb_1",
          interview_id: "int_123",
          overall_score: 88,
          category_scores: [
            { category: "Technical Knowledge", score: 90, max_score: 100 },
            { category: "Problem Solving", score: 85, max_score: 100 },
            { category: "Communication", score: 89, max_score: 100 },
          ],
          summary: "Demonstrated exceptional mastery of backend engineering concepts.",
          strengths: ["Strong concurrency grasp", "Clear system architecture explanations"],
          improvements: ["Quantify operational metrics"],
          recommended_practice: ["Practice distributed consensus"],
          answers_analysis: [
            {
              question: "Explain database indexing",
              answer: "B-Tree indexes optimize range queries",
              score: 88,
              feedback: "Accurate explanation of indexing trade-offs.",
            },
          ],
        },
        isLoading: false,
        error: null,
      } as any)

      vi.spyOn(useInterviewModule, "useCompleteInterview").mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
      } as any)

      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={["/interview/int_123/feedback"]}>
            <Routes>
              <Route
                path="/interview/:interviewId/feedback"
                element={<InterviewFeedbackScreen />}
              />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      )

      expect(screen.getByText("Interview Performance Report")).toBeInTheDocument()
      expect(screen.getByText("88")).toBeInTheDocument()
      expect(screen.getByText("Technical Knowledge")).toBeInTheDocument()
      expect(screen.getByText("90%")).toBeInTheDocument()
      expect(screen.getByText("Strong concurrency grasp")).toBeInTheDocument()
      expect(screen.getByText("Quantify operational metrics")).toBeInTheDocument()
    })
  })

  // 4. InterviewHistoryScreen Tests
  describe("InterviewHistoryScreen", () => {
    it("renders past sessions and navigation buttons", async () => {
      vi.spyOn(useInterviewModule, "useInterviewList").mockReturnValue({
        data: {
          items: [
            {
              id: "int_01",
              target_role_title: "Full Stack Developer",
              interview_type: "technical",
              difficulty: "senior",
              status: "completed",
              duration_minutes: 30,
              overall_score: 82,
              created_at: "2026-11-14T10:00:00Z",
            },
          ],
          total: 1,
          page: 1,
          page_size: 20,
        },
        isLoading: false,
      } as any)

      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <InterviewHistoryScreen />
          </MemoryRouter>
        </QueryClientProvider>
      )

      expect(screen.getByText("Mock Interview History")).toBeInTheDocument()
      expect(screen.getAllByText("Full Stack Developer")[0]).toBeInTheDocument()
      expect(screen.getAllByText("82%")[0]).toBeInTheDocument()
      expect(screen.getAllByText("Feedback")[0]).toBeInTheDocument()
    })
  })
})
