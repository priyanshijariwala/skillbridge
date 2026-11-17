import apiClient from "@/lib/axios"
import type {
  AICodeReview,
  ProblemDetail,
  ProblemListResponse,
  RunCodeRequest,
  RunCodeResponse,
  SubmissionListResponse,
  SubmissionResponse,
  SubmitCodeRequest,
} from "@/features/coding/types/coding.types"

export const codingService = {
  async listProblems(params?: {
    difficulty?: string
    category?: string
    topic?: string
    search?: string
    page?: number
    page_size?: number
  }): Promise<ProblemListResponse> {
    const searchParams = new URLSearchParams()
    if (params?.difficulty) searchParams.append("difficulty", params.difficulty)
    if (params?.category) searchParams.append("category", params.category)
    if (params?.topic) searchParams.append("topic", params.topic)
    if (params?.search) searchParams.append("search", params.search)
    if (params?.page) searchParams.append("page", params.page.toString())
    if (params?.page_size) searchParams.append("page_size", params.page_size.toString())

    const query = searchParams.toString() ? `?${searchParams.toString()}` : ""
    const { data } = await apiClient.get<ProblemListResponse>(`/coding/problems${query}`)
    return data
  },

  async getProblem(idOrSlug: string): Promise<ProblemDetail> {
    const { data } = await apiClient.get<ProblemDetail>(`/coding/problems/${idOrSlug}`)
    return data
  },

  async runCode(payload: RunCodeRequest): Promise<RunCodeResponse> {
    const { data } = await apiClient.post<RunCodeResponse>(
      "/coding/submissions/run",
      payload
    )
    return data
  },

  async submitCode(payload: SubmitCodeRequest): Promise<SubmissionResponse> {
    const { data } = await apiClient.post<SubmissionResponse>(
      "/coding/submissions",
      payload
    )
    return data
  },

  async getSubmission(submissionId: string): Promise<SubmissionResponse> {
    const { data } = await apiClient.get<SubmissionResponse>(
      `/coding/submissions/${submissionId}`
    )
    return data
  },

  async listSubmissions(params?: {
    problem_id?: string
    status?: string
    language?: string
    page?: number
    page_size?: number
  }): Promise<SubmissionListResponse> {
    const searchParams = new URLSearchParams()
    if (params?.problem_id) searchParams.append("problem_id", params.problem_id)
    if (params?.status) searchParams.append("status", params.status)
    if (params?.language) searchParams.append("language", params.language)
    if (params?.page) searchParams.append("page", params.page.toString())
    if (params?.page_size) searchParams.append("page_size", params.page_size.toString())

    const query = searchParams.toString() ? `?${searchParams.toString()}` : ""
    const { data } = await apiClient.get<SubmissionListResponse>(
      `/coding/submissions${query}`
    )
    return data
  },

  async generateReview(submissionId: string): Promise<AICodeReview> {
    const { data } = await apiClient.post<AICodeReview>(
      `/coding/submissions/${submissionId}/review`
    )
    return data
  },
}
