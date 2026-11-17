import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { codingService } from "@/services/coding.service"
import type {
  RunCodeRequest,
  SubmitCodeRequest,
} from "@/features/coding/types/coding.types"

export const CODING_KEYS = {
  all: ["coding"] as const,
  problems: (filters?: Record<string, unknown>) =>
    [...CODING_KEYS.all, "problems", filters || {}] as const,
  problem: (idOrSlug?: string) => [...CODING_KEYS.all, "problem", idOrSlug || ""] as const,
  submissions: (params?: Record<string, unknown>) =>
    [...CODING_KEYS.all, "submissions", params || {}] as const,
  submission: (id?: string) => [...CODING_KEYS.all, "submission", id || ""] as const,
}

export function useCodingProblems(filters?: {
  difficulty?: string
  category?: string
  topic?: string
  search?: string
  page?: number
  page_size?: number
}) {
  return useQuery({
    queryKey: CODING_KEYS.problems(filters),
    queryFn: () => codingService.listProblems(filters),
  })
}

export function useCodingProblem(idOrSlug?: string) {
  return useQuery({
    queryKey: CODING_KEYS.problem(idOrSlug),
    queryFn: () => (idOrSlug ? codingService.getProblem(idOrSlug) : null),
    enabled: Boolean(idOrSlug),
  })
}

export function useRunCode() {
  return useMutation({
    mutationFn: (payload: RunCodeRequest) => codingService.runCode(payload),
  })
}

export function useSubmitCode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: SubmitCodeRequest) => codingService.submitCode(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [...CODING_KEYS.all, "submissions"] })
      queryClient.invalidateQueries({ queryKey: CODING_KEYS.problem(data.problem_slug) })
      queryClient.invalidateQueries({ queryKey: CODING_KEYS.problem(data.problem_id) })
      queryClient.invalidateQueries({ queryKey: [...CODING_KEYS.all, "problems"] })
    },
  })
}

export function useSubmission(submissionId?: string) {
  return useQuery({
    queryKey: CODING_KEYS.submission(submissionId),
    queryFn: () => (submissionId ? codingService.getSubmission(submissionId) : null),
    enabled: Boolean(submissionId),
  })
}

export function useSubmissions(params?: {
  problem_id?: string
  status?: string
  language?: string
  page?: number
  page_size?: number
}) {
  return useQuery({
    queryKey: CODING_KEYS.submissions(params),
    queryFn: () => codingService.listSubmissions(params),
  })
}

export function useAICodeReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (submissionId: string) => codingService.generateReview(submissionId),
    onSuccess: (_data, submissionId) => {
      queryClient.invalidateQueries({ queryKey: CODING_KEYS.submission(submissionId) })
      queryClient.invalidateQueries({ queryKey: [...CODING_KEYS.all, "submissions"] })
    },
  })
}
