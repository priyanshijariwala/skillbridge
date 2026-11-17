/**
 * Coding Assessment Feature — Vitest + React Testing Library
 *
 * Test coverage:
 *  1. Problem list renders items with difficulty badges and topic tags
 *  2. Search filter input works
 *  3. Difficulty filter works (easy/medium/hard)
 *  4. CodingWorkspace renders editor and problem description
 *  5. Language selector changes language
 *  6. Run code button triggers mutation
 *  7. Submit button triggers submit mutation
 *  8. Reset code restores starter code
 *  9. ExecutionOutputPanel shows accepted/wrong_answer/runtime_error verdicts
 *  10. AI review panel shows review data
 *  11. AI review loading state renders spinner
 *  12. Submission history shows list of submissions
 *  13. Error states render error messages
 */

import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

// ── Mocks ─────────────────────────────────────────────────────────────────────

// Mock Monaco Editor (not supported in jsdom)
vi.mock("@monaco-editor/react", () => ({
  default: ({ value, onChange, options }: {
    value: string
    onChange?: (v: string) => void
    options?: { readOnly?: boolean }
  }) => (
    <textarea
      data-testid="monaco-editor"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      aria-label="Code Editor"
      readOnly={options?.readOnly}
    />
  ),
}))

// Mock react-router-dom navigate
const mockNavigate = vi.fn()
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom")
  return { ...actual, useNavigate: () => mockNavigate }
})

// Mock coding service
vi.mock("@/services/coding.service", () => ({
  codingService: {
    listProblems: vi.fn(),
    getProblem: vi.fn(),
    runCode: vi.fn(),
    submitCode: vi.fn(),
    getSubmission: vi.fn(),
    listSubmissions: vi.fn(),
    generateReview: vi.fn(),
  },
}))

// Hooks module
import * as useCodingModule from "@/features/coding/hooks/useCoding"

// Components & Pages
import { CodeEditor } from "@/features/coding/components/CodeEditor"
import { ExecutionOutputPanel } from "@/features/coding/components/ExecutionOutputPanel"
import { LanguageSelector } from "@/features/coding/components/LanguageSelector"
import { ProblemDescription } from "@/features/coding/components/ProblemDescription"
import { ProblemFilters } from "@/features/coding/components/ProblemFilters"
import { TestCasePanel } from "@/features/coding/components/TestCasePanel"
import { CodeReviewPanel } from "@/features/coding/components/CodeReviewPanel"
import { SubmissionResult } from "@/features/coding/components/SubmissionResult"
import { SubmissionHistory } from "@/features/coding/components/SubmissionHistory"
import { CodingProblemsPage } from "@/features/coding/pages/CodingProblemsPage"
import { CodingWorkspacePage } from "@/features/coding/pages/CodingWorkspacePage"
import { SubmissionHistoryPage } from "@/features/coding/pages/SubmissionHistoryPage"

// Types
import type {
  ProblemListItem,
  ProblemDetail,
  RunCodeResponse,
  SubmissionResponse,
  AICodeReview,
} from "@/features/coding/types/coding.types"

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MOCK_PROBLEMS: ProblemListItem[] = [
  {
    id: "prob_1",
    title: "Two Sum",
    slug: "two-sum",
    difficulty: "easy",
    category: "arrays",
    topics: ["Arrays", "Hash Table"],
    is_solved: false,
  },
  {
    id: "prob_2",
    title: "Longest Substring",
    slug: "longest-substring",
    difficulty: "medium",
    category: "strings",
    topics: ["Sliding Window", "Hash Table"],
    is_solved: true,
  },
  {
    id: "prob_3",
    title: "Median of Two Sorted Arrays",
    slug: "median-two-arrays",
    difficulty: "hard",
    category: "binary-search",
    topics: ["Binary Search", "Divide and Conquer"],
    is_solved: false,
  },
]

const MOCK_PROBLEM_DETAIL: ProblemDetail = {
  id: "prob_1",
  title: "Two Sum",
  slug: "two-sum",
  description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
  difficulty: "easy",
  category: "arrays",
  topics: ["Arrays", "Hash Table"],
  constraints: ["2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9"],
  examples: [
    { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "nums[0] + nums[1] == 9" },
  ],
  sample_test_cases: [
    { input: "[2,7,11,15]\n9", expected_output: "[0,1]" },
    { input: "[3,2,4]\n6", expected_output: "[1,2]" },
  ],
  supported_languages: ["python", "javascript", "typescript", "java", "cpp", "go"],
  starter_code: {
    python: "def twoSum(nums, target):\n    pass",
    javascript: "function twoSum(nums, target) {\n    // your code\n}",
  },
  is_solved: false,
}

const MOCK_RUN_RESULT_ACCEPTED: RunCodeResponse = {
  verdict: "accepted",
  passed: true,
  test_cases_passed: 2,
  total_test_cases: 2,
  execution_time_ms: 42,
  memory_kb: 14336,
  test_case_results: [
    { test_case_index: 0, passed: true, verdict: "accepted", input: "[2,7,11,15]\n9", expected_output: "[0,1]", stdout: "[0,1]" },
    { test_case_index: 1, passed: true, verdict: "accepted", input: "[3,2,4]\n6", expected_output: "[1,2]", stdout: "[1,2]" },
  ],
}

const MOCK_RUN_RESULT_WRONG: RunCodeResponse = {
  verdict: "wrong_answer",
  passed: false,
  test_cases_passed: 0,
  total_test_cases: 2,
  error_message: "Expected [0,1] but got [1,0]",
  test_case_results: [
    { test_case_index: 0, passed: false, verdict: "wrong_answer", input: "[2,7,11,15]\n9", expected_output: "[0,1]", stdout: "[1,0]" },
  ],
}

const MOCK_RUN_RESULT_RUNTIME_ERROR: RunCodeResponse = {
  verdict: "runtime_error",
  passed: false,
  test_cases_passed: 0,
  total_test_cases: 2,
  error_message: "IndexError: list index out of range",
  test_case_results: [
    { test_case_index: 0, passed: false, verdict: "runtime_error", input: "[2,7,11,15]\n9", stderr: "IndexError: list index out of range" },
  ],
}

const MOCK_SUBMISSION: SubmissionResponse = {
  id: "sub_1",
  user_id: "user_1",
  problem_id: "prob_1",
  problem_title: "Two Sum",
  problem_slug: "two-sum",
  language: "python",
  source_code: "def twoSum(nums, target): pass",
  execution_status: "accepted",
  test_cases_passed: 10,
  total_test_cases: 10,
  execution_time_ms: 50,
  memory_kb: 16384,
  test_case_results: [],
  created_at: "2026-11-17T10:00:00Z",
}

const MOCK_AI_REVIEW: AICodeReview = {
  summary: "Clean and correct solution using a hash map for O(n) time complexity.",
  correctness_observations: "All test cases pass. Edge cases are handled.",
  strengths: ["Optimal O(n) time complexity", "Clean variable naming"],
  improvements: ["Add type hints", "Consider early return for empty input"],
  potential_edge_cases: ["Negative numbers", "Duplicate values"],
  time_complexity: "O(n)",
  space_complexity: "O(n)",
  optimized_approach: "The hash map approach is already optimal.",
  learning_recommendations: ["Study hash table patterns", "Practice two-pointer technique"],
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })

const renderWithProviders = (ui: React.ReactElement, { initialRoute = "/" } = {}) => {
  const queryClient = createQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        {ui}
      </MemoryRouter>
    </QueryClientProvider>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
//  TEST SUITE
// ══════════════════════════════════════════════════════════════════════════════

describe("Coding Assessment Feature", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ────────────────────────────────────────────────────────────────────────────
  // 1. Problem list renders items with difficulty badges and topic tags
  // ────────────────────────────────────────────────────────────────────────────
  describe("1. Problem list rendering", () => {
    it("renders problems with title, difficulty badge, and topic tags", () => {
      vi.spyOn(useCodingModule, "useCodingProblems").mockReturnValue({
        data: { items: MOCK_PROBLEMS, total: 3, page: 1, page_size: 20 },
        isLoading: false,
        error: null,
      } as any)

      renderWithProviders(<CodingProblemsPage />)

      // Titles
      expect(screen.getByText("Two Sum")).toBeInTheDocument()
      expect(screen.getByText("Longest Substring")).toBeInTheDocument()
      expect(screen.getByText("Median of Two Sorted Arrays")).toBeInTheDocument()

      // Difficulty badges
      expect(screen.getByText("easy")).toBeInTheDocument()
      expect(screen.getByText("medium")).toBeInTheDocument()
      expect(screen.getByText("hard")).toBeInTheDocument()

      // Topic tags
      expect(screen.getAllByText("Hash Table").length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText("Arrays").length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText("Sliding Window").length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText("Binary Search").length).toBeGreaterThanOrEqual(1)
    })

    it("renders solved status badge when problem is solved", () => {
      vi.spyOn(useCodingModule, "useCodingProblems").mockReturnValue({
        data: { items: MOCK_PROBLEMS, total: 3, page: 1, page_size: 20 },
        isLoading: false,
        error: null,
      } as any)

      renderWithProviders(<CodingProblemsPage />)
      expect(screen.getByText("Solved")).toBeInTheDocument()
    })

    it("renders ProblemDescription with all details, constraints and examples", () => {
      renderWithProviders(<ProblemDescription problem={MOCK_PROBLEM_DETAIL} />)

      expect(screen.getByText("Two Sum")).toBeInTheDocument()
      expect(screen.getByText("easy")).toBeInTheDocument()
      expect(screen.getByText(/Given an array of integers/)).toBeInTheDocument()
      expect(screen.getByText(/2 <= nums.length <= 10\^4/)).toBeInTheDocument()
      expect(screen.getByText(/nums\[0\] \+ nums\[1\] == 9/)).toBeInTheDocument()
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  // 2. Search filter input works
  // ────────────────────────────────────────────────────────────────────────────
  describe("2. Search filter", () => {
    it("search filter input updates and triggers search change", () => {
      const onSearchChange = vi.fn()
      renderWithProviders(
        <ProblemFilters
          difficulty=""
          onDifficultyChange={vi.fn()}
          search=""
          onSearchChange={onSearchChange}
          category=""
          onCategoryChange={vi.fn()}
        />
      )

      const searchInput = screen.getByPlaceholderText("Search problems...")
      expect(searchInput).toBeInTheDocument()

      fireEvent.change(searchInput, { target: { value: "two sum" } })
      expect(onSearchChange).toHaveBeenCalledWith("two sum")
    })

    it("search input works inside CodingProblemsPage", () => {
      vi.spyOn(useCodingModule, "useCodingProblems").mockReturnValue({
        data: { items: MOCK_PROBLEMS, total: 3, page: 1, page_size: 20 },
        isLoading: false,
        error: null,
      } as any)

      renderWithProviders(<CodingProblemsPage />)

      const searchInput = screen.getByPlaceholderText("Search problems...")
      fireEvent.change(searchInput, { target: { value: "binary" } })
      expect(searchInput).toHaveValue("binary")
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  // 3. Difficulty filter works (easy/medium/hard)
  // ────────────────────────────────────────────────────────────────────────────
  describe("3. Difficulty filter", () => {
    it("difficulty filter triggers onDifficultyChange when easy/medium/hard is selected", () => {
      const onDifficultyChange = vi.fn()
      renderWithProviders(
        <ProblemFilters
          difficulty=""
          onDifficultyChange={onDifficultyChange}
          search=""
          onSearchChange={vi.fn()}
          category=""
          onCategoryChange={vi.fn()}
        />
      )

      const easyBtn = screen.getByRole("button", { name: "Easy" })
      expect(easyBtn).toBeInTheDocument()
      fireEvent.click(easyBtn)
      expect(onDifficultyChange).toHaveBeenCalledWith("easy")

      const mediumBtn = screen.getByRole("button", { name: "Medium" })
      fireEvent.click(mediumBtn)
      expect(onDifficultyChange).toHaveBeenCalledWith("medium")

      const hardBtn = screen.getByRole("button", { name: "Hard" })
      fireEvent.click(hardBtn)
      expect(onDifficultyChange).toHaveBeenCalledWith("hard")
    })

    it("renders difficulty filter in CodingProblemsPage and updates selection", () => {
      vi.spyOn(useCodingModule, "useCodingProblems").mockReturnValue({
        data: { items: [MOCK_PROBLEMS[0]], total: 1, page: 1, page_size: 20 },
        isLoading: false,
        error: null,
      } as any)

      renderWithProviders(<CodingProblemsPage />)

      const easyBtn = screen.getByRole("button", { name: "Easy" })
      expect(easyBtn).toBeInTheDocument()
      fireEvent.click(easyBtn)
      expect(easyBtn).toHaveClass("bg-primary")
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  // 4. CodingWorkspace renders editor and problem description
  // ────────────────────────────────────────────────────────────────────────────
  describe("4. CodingWorkspace renders editor and description", () => {
    it("renders problem title, problem description, and code editor", async () => {
      vi.spyOn(useCodingModule, "useCodingProblem").mockReturnValue({
        data: MOCK_PROBLEM_DETAIL,
        isLoading: false,
        error: null,
      } as any)

      vi.spyOn(useCodingModule, "useRunCode").mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        data: undefined,
      } as any)

      vi.spyOn(useCodingModule, "useSubmitCode").mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        data: undefined,
      } as any)

      vi.spyOn(useCodingModule, "useAICodeReview").mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        data: undefined,
      } as any)

      renderWithProviders(
        <Routes>
          <Route path="/coding/problems/:problemId" element={<CodingWorkspacePage />} />
        </Routes>,
        { initialRoute: "/coding/problems/two-sum" }
      )

      // Problem title rendered in top bar and description
      await waitFor(() => {
        expect(screen.getAllByText("Two Sum").length).toBeGreaterThanOrEqual(1)
      })

      // Description statement
      expect(screen.getByText(/Given an array of integers/)).toBeInTheDocument()

      // Code editor textarea
      const editor = await screen.findByRole("textbox", { name: "Code Editor" })
      expect(editor).toBeInTheDocument()
      expect(editor).toHaveValue(MOCK_PROBLEM_DETAIL.starter_code.python)

      // Run and Submit action buttons
      expect(screen.getByRole("button", { name: /run code/i })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /submit/i })).toBeInTheDocument()
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  // 5. Language selector changes language
  // ────────────────────────────────────────────────────────────────────────────
  describe("5. Language selector", () => {
    it("renders supported languages and calls onSelectLanguage on change", () => {
      const onSelect = vi.fn()
      renderWithProviders(
        <LanguageSelector selectedLanguage="python" onSelectLanguage={onSelect} />
      )

      const select = screen.getByRole("combobox")
      expect(select).toBeInTheDocument()
      expect(select).toHaveValue("python")

      fireEvent.change(select, { target: { value: "javascript" } })
      expect(onSelect).toHaveBeenCalledWith("javascript")

      fireEvent.change(select, { target: { value: "typescript" } })
      expect(onSelect).toHaveBeenCalledWith("typescript")
    })

    it("changes editor language and loads corresponding starter code in workspace", async () => {
      vi.spyOn(useCodingModule, "useCodingProblem").mockReturnValue({
        data: MOCK_PROBLEM_DETAIL,
        isLoading: false,
        error: null,
      } as any)

      vi.spyOn(useCodingModule, "useRunCode").mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        data: undefined,
      } as any)

      vi.spyOn(useCodingModule, "useSubmitCode").mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        data: undefined,
      } as any)

      vi.spyOn(useCodingModule, "useAICodeReview").mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        data: undefined,
      } as any)

      renderWithProviders(
        <Routes>
          <Route path="/coding/problems/:problemId" element={<CodingWorkspacePage />} />
        </Routes>,
        { initialRoute: "/coding/problems/two-sum" }
      )

      await waitFor(() => {
        expect(screen.getAllByText("Two Sum")[0]).toBeInTheDocument()
      })

      const languageSelect = screen.getByRole("combobox")
      fireEvent.change(languageSelect, { target: { value: "javascript" } })

      // Editor should now show JS starter code
      const editor = await screen.findByRole("textbox", { name: "Code Editor" })
      expect(editor).toHaveValue(MOCK_PROBLEM_DETAIL.starter_code.javascript)
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  // 6. Run code button triggers mutation
  // ────────────────────────────────────────────────────────────────────────────
  describe("6. Run code mutation trigger", () => {
    it("triggers useRunCode mutation when Run Code button is clicked", async () => {
      const runMutateMock = vi.fn()
      vi.spyOn(useCodingModule, "useCodingProblem").mockReturnValue({
        data: MOCK_PROBLEM_DETAIL,
        isLoading: false,
        error: null,
      } as any)

      vi.spyOn(useCodingModule, "useRunCode").mockReturnValue({
        mutate: runMutateMock,
        isPending: false,
        data: undefined,
      } as any)

      vi.spyOn(useCodingModule, "useSubmitCode").mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        data: undefined,
      } as any)

      vi.spyOn(useCodingModule, "useAICodeReview").mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        data: undefined,
      } as any)

      renderWithProviders(
        <Routes>
          <Route path="/coding/problems/:problemId" element={<CodingWorkspacePage />} />
        </Routes>,
        { initialRoute: "/coding/problems/two-sum" }
      )

      await waitFor(() => {
        expect(screen.getAllByText("Two Sum")[0]).toBeInTheDocument()
      })

      const runBtn = screen.getByRole("button", { name: /run code/i })
      fireEvent.click(runBtn)

      expect(runMutateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          problem_id: "prob_1",
          language: "python",
        })
      )
    })

    it("shows running spinner on button while run code is pending", async () => {
      vi.spyOn(useCodingModule, "useCodingProblem").mockReturnValue({
        data: MOCK_PROBLEM_DETAIL,
        isLoading: false,
        error: null,
      } as any)

      vi.spyOn(useCodingModule, "useRunCode").mockReturnValue({
        mutate: vi.fn(),
        isPending: true,
        data: undefined,
      } as any)

      vi.spyOn(useCodingModule, "useSubmitCode").mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        data: undefined,
      } as any)

      vi.spyOn(useCodingModule, "useAICodeReview").mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        data: undefined,
      } as any)

      renderWithProviders(
        <Routes>
          <Route path="/coding/problems/:problemId" element={<CodingWorkspacePage />} />
        </Routes>,
        { initialRoute: "/coding/problems/two-sum" }
      )

      await waitFor(() => {
        expect(screen.getByText("Running...")).toBeInTheDocument()
      })
      expect(screen.getByRole("button", { name: /running\.\.\./i })).toBeDisabled()
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  // 7. Submit button triggers submit mutation
  // ────────────────────────────────────────────────────────────────────────────
  describe("7. Submit mutation trigger", () => {
    it("triggers useSubmitCode mutation when Submit button is clicked", async () => {
      const submitMutateMock = vi.fn()
      vi.spyOn(useCodingModule, "useCodingProblem").mockReturnValue({
        data: MOCK_PROBLEM_DETAIL,
        isLoading: false,
        error: null,
      } as any)

      vi.spyOn(useCodingModule, "useRunCode").mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        data: undefined,
      } as any)

      vi.spyOn(useCodingModule, "useSubmitCode").mockReturnValue({
        mutate: submitMutateMock,
        isPending: false,
        data: undefined,
      } as any)

      vi.spyOn(useCodingModule, "useAICodeReview").mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        data: undefined,
      } as any)

      renderWithProviders(
        <Routes>
          <Route path="/coding/problems/:problemId" element={<CodingWorkspacePage />} />
        </Routes>,
        { initialRoute: "/coding/problems/two-sum" }
      )

      await waitFor(() => {
        expect(screen.getAllByText("Two Sum")[0]).toBeInTheDocument()
      })

      const submitBtn = screen.getByRole("button", { name: /submit/i })
      fireEvent.click(submitBtn)

      expect(submitMutateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          problem_id: "prob_1",
          language: "python",
        }),
        expect.any(Object)
      )
    })

    it("prevents double-submit while submission is pending", async () => {
      vi.spyOn(useCodingModule, "useCodingProblem").mockReturnValue({
        data: MOCK_PROBLEM_DETAIL,
        isLoading: false,
        error: null,
      } as any)

      vi.spyOn(useCodingModule, "useRunCode").mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        data: undefined,
      } as any)

      vi.spyOn(useCodingModule, "useSubmitCode").mockReturnValue({
        mutate: vi.fn(),
        isPending: true,
        data: undefined,
      } as any)

      vi.spyOn(useCodingModule, "useAICodeReview").mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        data: undefined,
      } as any)

      renderWithProviders(
        <Routes>
          <Route path="/coding/problems/:problemId" element={<CodingWorkspacePage />} />
        </Routes>,
        { initialRoute: "/coding/problems/two-sum" }
      )

      await waitFor(() => {
        expect(screen.getByText("Submitting...")).toBeInTheDocument()
      })
      expect(screen.getByRole("button", { name: /submitting\.\.\./i })).toBeDisabled()
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  // 8. Reset code restores starter code
  // ────────────────────────────────────────────────────────────────────────────
  describe("8. Reset code restores starter code", () => {
    it("resets modified code back to starter code in CodeEditor component", async () => {
      const onReset = vi.fn()
      renderWithProviders(
        <CodeEditor
          value="def modifiedCode(): return False"
          language="python"
          onChange={vi.fn()}
          onReset={onReset}
        />
      )

      const resetBtn = screen.getByTitle("Reset code to starter template")
      expect(resetBtn).toBeInTheDocument()

      fireEvent.click(resetBtn)
      expect(onReset).toHaveBeenCalledOnce()
    })

    it("restores starter code in CodingWorkspacePage when Reset Code is clicked", async () => {
      vi.spyOn(useCodingModule, "useCodingProblem").mockReturnValue({
        data: MOCK_PROBLEM_DETAIL,
        isLoading: false,
        error: null,
      } as any)

      vi.spyOn(useCodingModule, "useRunCode").mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        data: undefined,
      } as any)

      vi.spyOn(useCodingModule, "useSubmitCode").mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        data: undefined,
      } as any)

      vi.spyOn(useCodingModule, "useAICodeReview").mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        data: undefined,
      } as any)

      renderWithProviders(
        <Routes>
          <Route path="/coding/problems/:problemId" element={<CodingWorkspacePage />} />
        </Routes>,
        { initialRoute: "/coding/problems/two-sum" }
      )

      await waitFor(() => {
        expect(screen.getAllByText("Two Sum")[0]).toBeInTheDocument()
      })

      const editor = await screen.findByRole("textbox", { name: "Code Editor" })
      expect(editor).toHaveValue(MOCK_PROBLEM_DETAIL.starter_code.python)

      // Edit code
      fireEvent.change(editor, { target: { value: "some modified text" } })
      expect(editor).toHaveValue("some modified text")

      // Click reset code
      const resetBtn = screen.getByTitle("Reset code to starter template")
      fireEvent.click(resetBtn)

      // Should be restored to starter code
      expect(editor).toHaveValue(MOCK_PROBLEM_DETAIL.starter_code.python)
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  // 9. ExecutionOutputPanel shows accepted/wrong_answer/runtime_error verdicts
  // ────────────────────────────────────────────────────────────────────────────
  describe("9. ExecutionOutputPanel verdicts", () => {
    it("shows Accepted verdict with green styling and test case counts", () => {
      renderWithProviders(
        <ExecutionOutputPanel runResult={MOCK_RUN_RESULT_ACCEPTED} />
      )

      expect(screen.getByText("Accepted")).toBeInTheDocument()
      expect(screen.getByText("2 / 2 Test Cases Passed")).toBeInTheDocument()
      expect(screen.getByText("42 ms")).toBeInTheDocument()
      expect(screen.getByText("14 MB")).toBeInTheDocument()
    })

    it("shows Wrong Answer verdict with error message and failed test cases", () => {
      renderWithProviders(
        <ExecutionOutputPanel runResult={MOCK_RUN_RESULT_WRONG} />
      )

      expect(screen.getByText("Wrong Answer")).toBeInTheDocument()
      expect(screen.getByText("0 / 2 Test Cases Passed")).toBeInTheDocument()
      expect(screen.getByText(/Expected \[0,1\] but got \[1,0\]/)).toBeInTheDocument()
    })

    it("shows Runtime Error verdict and diagnostics", () => {
      renderWithProviders(
        <ExecutionOutputPanel runResult={MOCK_RUN_RESULT_RUNTIME_ERROR} />
      )

      expect(screen.getByText("Runtime Error")).toBeInTheDocument()
      expect(screen.getAllByText(/IndexError: list index out of range/).length).toBeGreaterThanOrEqual(1)
    })

    it("shows empty placeholder when no execution result is present", () => {
      renderWithProviders(<ExecutionOutputPanel />)
      expect(screen.getByText(/Click "Run Code" to test against sample cases/)).toBeInTheDocument()
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  // 10. AI review panel shows review data
  // ────────────────────────────────────────────────────────────────────────────
  describe("10. AI review panel data rendering", () => {
    it("renders AI review summary, strengths, improvements, and complexity", () => {
      renderWithProviders(<CodeReviewPanel review={MOCK_AI_REVIEW} />)

      expect(screen.getByText(/Clean and correct solution using a hash map/)).toBeInTheDocument()
      expect(screen.getByText("Optimal O(n) time complexity")).toBeInTheDocument()
      expect(screen.getByText("Clean variable naming")).toBeInTheDocument()
      expect(screen.getByText("Add type hints")).toBeInTheDocument()
      expect(screen.getByText("Negative numbers")).toBeInTheDocument()
      expect(screen.getAllByText("O(n)").length).toBeGreaterThanOrEqual(2)
      expect(screen.getByText(/Study hash table patterns/)).toBeInTheDocument()
    })

    it("renders Request AI Review button when hasSubmission is true and no review exists", () => {
      const onRequest = vi.fn()
      renderWithProviders(
        <CodeReviewPanel hasSubmission={true} onRequestReview={onRequest} review={null} />
      )

      const btn = screen.getByRole("button", { name: /request ai review/i })
      expect(btn).toBeInTheDocument()
      fireEvent.click(btn)
      expect(onRequest).toHaveBeenCalledOnce()
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  // 11. AI review loading state renders spinner
  // ────────────────────────────────────────────────────────────────────────────
  describe("11. AI review loading state", () => {
    it("renders loading spinner and status text when review is generating", () => {
      renderWithProviders(<CodeReviewPanel isLoading={true} />)

      expect(screen.getByText("AI is reviewing your code...")).toBeInTheDocument()
      const spinner = document.querySelector(".animate-spin")
      expect(spinner).toBeInTheDocument()
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  // 12. Submission history shows list of submissions
  // ────────────────────────────────────────────────────────────────────────────
  describe("12. Submission history list", () => {
    const submissions: SubmissionResponse[] = [
      MOCK_SUBMISSION,
      {
        ...MOCK_SUBMISSION,
        id: "sub_2",
        execution_status: "wrong_answer",
        test_cases_passed: 5,
        total_test_cases: 10,
        execution_time_ms: 120,
        memory_kb: 18432,
        created_at: "2026-11-16T12:00:00Z",
      },
    ]

    it("renders submission result card with details", () => {
      renderWithProviders(<SubmissionResult submission={MOCK_SUBMISSION} />)

      expect(screen.getByText("Two Sum")).toBeInTheDocument()
      expect(screen.getByText("Accepted")).toBeInTheDocument()
      expect(screen.getByText("10/10 passed")).toBeInTheDocument()
      expect(screen.getByText("50ms")).toBeInTheDocument()
      expect(screen.getByText("python")).toBeInTheDocument()
    })

    it("renders list of submissions in SubmissionHistory component", () => {
      renderWithProviders(
        <SubmissionHistory submissions={submissions} total={2} />
      )

      expect(screen.getAllByText("Two Sum").length).toBe(2)
      expect(screen.getByText("Accepted")).toBeInTheDocument()
      expect(screen.getByText("Wrong Answer")).toBeInTheDocument()
    })

    it("renders empty state in SubmissionHistory when no submissions exist", () => {
      renderWithProviders(<SubmissionHistory submissions={[]} total={0} />)

      expect(screen.getByText("No submissions yet")).toBeInTheDocument()
    })

    it("renders SubmissionHistoryPage with submissions from useSubmissions hook", () => {
      vi.spyOn(useCodingModule, "useSubmissions").mockReturnValue({
        data: {
          items: submissions,
          total: 2,
          page: 1,
          page_size: 20,
        },
        isLoading: false,
        error: null,
      } as any)

      renderWithProviders(<SubmissionHistoryPage />)

      expect(screen.getByText("Submission History")).toBeInTheDocument()
      expect(screen.getAllByText("Two Sum").length).toBe(2)
      expect(screen.getAllByText("Accepted").length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText("Wrong Answer").length).toBeGreaterThanOrEqual(1)
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  // 13. Error states render error messages
  // ────────────────────────────────────────────────────────────────────────────
  describe("13. Error states render error messages", () => {
    it("renders problem not found error state when problem is null", () => {
      vi.spyOn(useCodingModule, "useCodingProblem").mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error("Problem not found"),
      } as any)

      renderWithProviders(
        <Routes>
          <Route path="/coding/problems/:problemId" element={<CodingWorkspacePage />} />
        </Routes>,
        { initialRoute: "/coding/problems/non-existent-problem" }
      )

      expect(screen.getByText("Problem not found")).toBeInTheDocument()
      expect(screen.getByText("Back to Problems")).toBeInTheDocument()
    })

    it("renders error message in ExecutionOutputPanel for compilation error", () => {
      renderWithProviders(
        <ExecutionOutputPanel
          runResult={{
            verdict: "compilation_error",
            passed: false,
            test_cases_passed: 0,
            total_test_cases: 2,
            error_message: "SyntaxError: invalid syntax on line 3",
            test_case_results: [],
          }}
        />
      )

      expect(screen.getByText("Compilation Error")).toBeInTheDocument()
      expect(screen.getByText(/SyntaxError: invalid syntax on line 3/)).toBeInTheDocument()
    })

    it("renders error message in ExecutionOutputPanel for time limit exceeded", () => {
      renderWithProviders(
        <ExecutionOutputPanel
          runResult={{
            verdict: "time_limit_exceeded",
            passed: false,
            test_cases_passed: 1,
            total_test_cases: 2,
            error_message: "Time limit exceeded (> 2000 ms)",
            test_case_results: [],
          }}
        />
      )

      expect(screen.getByText("Time Limit Exceeded")).toBeInTheDocument()
      expect(screen.getByText(/Time limit exceeded/)).toBeInTheDocument()
    })

    it("surfaces API errors gracefully in hook error state", () => {
      vi.spyOn(useCodingModule, "useCodingProblems").mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error("Network Error: 500 Internal Server Error"),
      } as any)

      const ErrorConsumer = () => {
        const { error } = useCodingModule.useCodingProblems()
        if (error) return <div role="alert">Error: {(error as Error).message}</div>
        return null
      }

      renderWithProviders(<ErrorConsumer />)
      expect(screen.getByRole("alert")).toHaveTextContent("Network Error: 500 Internal Server Error")
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  // Additional: TestCasePanel interactive behaviors
  // ────────────────────────────────────────────────────────────────────────────
  describe("TestCasePanel interactions", () => {
    it("allows switching test case tabs and entering custom stdin", () => {
      const onCustomChange = vi.fn()
      const onToggle = vi.fn()

      const { rerender } = renderWithProviders(
        <TestCasePanel
          sampleTestCases={MOCK_PROBLEM_DETAIL.sample_test_cases}
          customInput=""
          onCustomInputChange={onCustomChange}
          useCustomInput={false}
          onToggleCustomInput={onToggle}
        />
      )

      expect(screen.getByText("Case 1")).toBeInTheDocument()
      expect(screen.getByText("Case 2")).toBeInTheDocument()
      expect(screen.getByText("Custom Input")).toBeInTheDocument()

      // Switch to custom input
      fireEvent.click(screen.getByText("Custom Input"))
      expect(onToggle).toHaveBeenCalledWith(true)

      // Rerender with custom input enabled
      rerender(
        <QueryClientProvider client={createQueryClient()}>
          <MemoryRouter>
            <TestCasePanel
              sampleTestCases={MOCK_PROBLEM_DETAIL.sample_test_cases}
              customInput=""
              onCustomInputChange={onCustomChange}
              useCustomInput={true}
              onToggleCustomInput={onToggle}
            />
          </MemoryRouter>
        </QueryClientProvider>
      )

      const customTextarea = screen.getByPlaceholderText("Enter custom input...")
      expect(customTextarea).toBeInTheDocument()
      fireEvent.change(customTextarea, { target: { value: "[1,2,3]\n5" } })
      expect(onCustomChange).toHaveBeenCalledWith("[1,2,3]\n5")
    })
  })
})
