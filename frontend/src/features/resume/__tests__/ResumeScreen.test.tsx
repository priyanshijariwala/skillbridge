import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { MemoryRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ResumeScreen } from "@/features/resume/ResumeScreen"
import * as useResumesModule from "@/features/resume/hooks/useResumes"
import * as useAuthModule from "@/features/auth/hooks/useAuth"

const mockNavigate = vi.fn()
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom")
  return { ...actual, useNavigate: () => mockNavigate }
})

const mockResume = {
  id: "res_1",
  user_id: "user_1",
  original_filename: "my_resume.pdf",
  file_type: "pdf",
  file_size_bytes: 100000,
  status: "uploaded",
  created_at: "2026-11-14T05:00:00Z",
  updated_at: null,
}

const mockAnalysis = {
  id: "an_1",
  user_id: "user_1",
  resume_id: "res_1",
  status: "completed" as const,
  overall_score: 85,
  score_breakdown: {
    content_quality: 84,
    skills_presentation: 88,
    experience_descriptions: 82,
    structure_readability: 86,
    ats_readability: 85,
  },
  summary: "Strong technical profile with demonstrated backend architecture.",
  extracted_data: {
    headline: "Senior Backend Engineer",
    skills: ["Python", "FastAPI"],
    experience: [],
    education: [],
    projects: [],
    certifications: [],
  },
  strengths: [
    { id: "str_1", type: "strength", title: "API Leadership", description: "Led microservices architecture" },
  ],
  improvements: [
    { id: "imp_1", type: "improvement", title: "Add Metrics", description: "Quantify test coverage", recommendation: "Add test stats" },
  ],
  recommendations: ["Add CI/CD pipeline specifics."],
  missing_information: ["Test coverage percentages"],
  ats_observations: ["Standard headings used throughout"],
  detected_skills: [
    { id: "sk_1", name: "Python", category: "Languages", status: "verified", evidence_snippet: "Used Python" },
  ],
  recommended_roles: ["Senior Backend Engineer"],
}

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

function mockAllHooks(overrides: Partial<{
  resumes: typeof mockResume[]
  isLoading: boolean
  uploadMutate: ReturnType<typeof vi.fn>
  deleteMutate: ReturnType<typeof vi.fn>
  downloadMutate: ReturnType<typeof vi.fn>
  uploadPending: boolean
  analysisData: typeof mockAnalysis | null
  isLoadingAnalysis: boolean
  analyzeMutate: ReturnType<typeof vi.fn>
  analyzePending: boolean
  analyzeError: Error | null
}> = {}) {
  const {
    resumes = [],
    isLoading = false,
    uploadMutate = vi.fn(),
    deleteMutate = vi.fn(),
    downloadMutate = vi.fn(),
    uploadPending = false,
    analysisData = null,
    isLoadingAnalysis = false,
    analyzeMutate = vi.fn(),
    analyzePending = false,
    analyzeError = null,
  } = overrides

  vi.spyOn(useResumesModule, "useListResumes").mockReturnValue({
    data: resumes,
    isLoading,
    isError: false,
  } as ReturnType<typeof useResumesModule.useListResumes>)

  vi.spyOn(useResumesModule, "useUploadResume").mockReturnValue({
    mutate: uploadMutate,
    isPending: uploadPending,
    isError: false,
    error: null,
    variables: undefined,
  } as unknown as ReturnType<typeof useResumesModule.useUploadResume>)

  vi.spyOn(useResumesModule, "useDeleteResume").mockReturnValue({
    mutate: deleteMutate,
    isPending: false,
    variables: undefined,
  } as unknown as ReturnType<typeof useResumesModule.useDeleteResume>)

  vi.spyOn(useResumesModule, "useDownloadResume").mockReturnValue({
    mutate: downloadMutate,
    isPending: false,
    variables: undefined,
  } as unknown as ReturnType<typeof useResumesModule.useDownloadResume>)

  vi.spyOn(useResumesModule, "useGetResumeAnalysis").mockReturnValue({
    data: analysisData,
    isLoading: isLoadingAnalysis,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useResumesModule.useGetResumeAnalysis>)

  vi.spyOn(useResumesModule, "useAnalyzeResume").mockReturnValue({
    mutate: analyzeMutate,
    isPending: analyzePending,
    isError: !!analyzeError,
    error: analyzeError,
    variables: undefined,
  } as unknown as ReturnType<typeof useResumesModule.useAnalyzeResume>)
}

describe("ResumeScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: { id: "user_1", name: "Test", email: "test@example.com" },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    })
    vi.spyOn(window, "confirm").mockReturnValue(true)
  })

  it("renders upload zone", () => {
    mockAllHooks()
    render(<ResumeScreen />, { wrapper: makeWrapper() })
    expect(screen.getByText(/drag and drop your updated resume/i)).toBeInTheDocument()
    expect(screen.getByText(/PDF, DOCX/i)).toBeInTheDocument()
  })

  it("shows empty state when no resumes uploaded", () => {
    mockAllHooks({ resumes: [] })
    render(<ResumeScreen />, { wrapper: makeWrapper() })
    expect(screen.getByText(/no resumes uploaded yet/i)).toBeInTheDocument()
  })

  it("renders uploaded resume list", () => {
    mockAllHooks({ resumes: [mockResume] })
    render(<ResumeScreen />, { wrapper: makeWrapper() })
    expect(screen.getByText("my_resume.pdf")).toBeInTheDocument()
    expect(screen.getByText("uploaded")).toBeInTheDocument()
  })

  it("calls deleteResume when delete button clicked and confirmed", async () => {
    const deleteMutate = vi.fn()
    mockAllHooks({ resumes: [mockResume], deleteMutate })

    const user = userEvent.setup()
    render(<ResumeScreen />, { wrapper: makeWrapper() })

    const deleteButton = screen.getByRole("button", { name: /delete resume/i })
    await user.click(deleteButton)

    expect(deleteMutate).toHaveBeenCalledWith("res_1", expect.any(Object))
  })

  it("rejects file with invalid extension", async () => {
    const uploadMutate = vi.fn()
    mockAllHooks({ uploadMutate })

    render(<ResumeScreen />, { wrapper: makeWrapper() })
    const input = screen.getByLabelText(/resume file input/i) as HTMLInputElement

    const badFile = new File(["content"], "resume.exe", { type: "application/octet-stream" })
    Object.defineProperty(input, "files", { value: [badFile], writable: false })
    fireEvent.change(input)

    await waitFor(() =>
      expect(screen.getByText(/not supported/i)).toBeInTheDocument()
    )
    expect(uploadMutate).not.toHaveBeenCalled()
  })

  it("rejects empty file", async () => {
    const uploadMutate = vi.fn()
    mockAllHooks({ uploadMutate })

    render(<ResumeScreen />, { wrapper: makeWrapper() })
    const input = screen.getByLabelText(/resume file input/i) as HTMLInputElement

    const emptyFile = new File([], "resume.pdf", { type: "application/pdf" })
    Object.defineProperty(input, "files", { value: [emptyFile], writable: false })
    fireEvent.change(input)

    await waitFor(() =>
      expect(screen.getByText(/empty/i)).toBeInTheDocument()
    )
    expect(uploadMutate).not.toHaveBeenCalled()
  })

  it("calls uploadResume with valid PDF file", async () => {
    const uploadMutate = vi.fn()
    mockAllHooks({ uploadMutate })

    render(<ResumeScreen />, { wrapper: makeWrapper() })
    const input = screen.getByLabelText(/resume file input/i) as HTMLInputElement

    const pdfContent = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2D, ...new Array(100).fill(65)])
    const validPdf = new File([pdfContent], "resume.pdf", { type: "application/pdf" })
    Object.defineProperty(input, "files", { value: [validPdf], writable: false })
    fireEvent.change(input)

    await waitFor(() => expect(uploadMutate).toHaveBeenCalled())
    const calledWith = uploadMutate.mock.calls[0][0]
    expect(calledWith.file).toBeInstanceOf(File)
    expect(calledWith.file.name).toBe("resume.pdf")
  })

  it("renders 'Analyze with AI' button when resume is uploaded but not analyzed", () => {
    mockAllHooks({ resumes: [mockResume], analysisData: null })
    render(<ResumeScreen />, { wrapper: makeWrapper() })
    expect(screen.getByRole("button", { name: /analyze with ai/i })).toBeInTheDocument()
  })

  it("calls analyzeResume mutation when 'Analyze with AI' is clicked", async () => {
    const analyzeMutate = vi.fn()
    mockAllHooks({ resumes: [mockResume], analysisData: null, analyzeMutate })

    const user = userEvent.setup()
    render(<ResumeScreen />, { wrapper: makeWrapper() })

    const analyzeBtn = screen.getByRole("button", { name: /analyze with ai/i })
    await user.click(analyzeBtn)
    expect(analyzeMutate).toHaveBeenCalledWith("res_1")
  })

  it("shows loading state when analysis mutation is pending", () => {
    mockAllHooks({ resumes: [mockResume], analyzePending: true })
    render(<ResumeScreen />, { wrapper: makeWrapper() })
    expect(screen.getByText(/analyzing resume competencies with ai/i)).toBeInTheDocument()
  })

  it("shows error card and retry button when analysis fails", async () => {
    const analyzeMutate = vi.fn()
    mockAllHooks({
      resumes: [mockResume],
      analyzeError: new Error("AI provider timeout"),
      analyzeMutate,
    })

    const user = userEvent.setup()
    render(<ResumeScreen />, { wrapper: makeWrapper() })

    expect(screen.getByText(/resume analysis failed/i)).toBeInTheDocument()
    expect(screen.getByText(/ai provider timeout/i)).toBeInTheDocument()

    const retryBtn = screen.getByRole("button", { name: /retry analysis/i })
    await user.click(retryBtn)
    expect(analyzeMutate).toHaveBeenCalledWith("res_1")
  })

  it("renders full analysis results including score, breakdown, strengths, and skills", () => {
    mockAllHooks({ resumes: [mockResume], analysisData: mockAnalysis })
    render(<ResumeScreen />, { wrapper: makeWrapper() })

    // Overall Score
    expect(screen.getByText("85")).toBeInTheDocument()
    expect(screen.getByText(/Strong technical profile with demonstrated backend architecture/i)).toBeInTheDocument()

    // Breakdown
    expect(screen.getByText(/Detailed Evaluation Breakdown/i)).toBeInTheDocument()
    expect(screen.getByText("84%")).toBeInTheDocument()
    expect(screen.getByText("88%")).toBeInTheDocument()

    // Strengths
    expect(screen.getByText("API Leadership")).toBeInTheDocument()

    // Improvements
    expect(screen.getByText("Add Metrics")).toBeInTheDocument()

    // Detected Skills
    expect(screen.getByText(/Python/i)).toBeInTheDocument()

    // Recommended Roles & Headline
    expect(screen.getAllByText(/Senior Backend Engineer/i)[0]).toBeInTheDocument()
  })
})
