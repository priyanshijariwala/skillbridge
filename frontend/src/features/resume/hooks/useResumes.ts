import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { resumeService } from "@/services/resume.service"

export const RESUMES_QUERY_KEY = ["resumes"] as const
export const RESUME_ANALYSIS_QUERY_KEY = (resumeId: string) =>
  ["resume-analysis", resumeId] as const

export function useListResumes() {
  return useQuery({
    queryKey: RESUMES_QUERY_KEY,
    queryFn: () => resumeService.listResumes(),
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

export function useUploadResume() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      file,
      onProgress,
    }: {
      file: File
      onProgress?: (pct: number) => void
    }) => resumeService.uploadResume(file, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RESUMES_QUERY_KEY })
    },
  })
}

export function useDeleteResume() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => resumeService.deleteResume(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RESUMES_QUERY_KEY })
    },
  })
}

export function useDownloadResume() {
  return useMutation({
    mutationFn: ({ id, filename }: { id: string; filename: string }) =>
      resumeService.downloadResume(id, filename),
  })
}

export function useGetResumeAnalysis(resumeId?: string) {
  return useQuery({
    queryKey: resumeId ? RESUME_ANALYSIS_QUERY_KEY(resumeId) : ["resume-analysis"],
    queryFn: () => {
      if (!resumeId) return null
      return resumeService.getLatestAnalysis(resumeId)
    },
    enabled: !!resumeId,
    retry: false, // 404 means not yet analyzed
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useAnalyzeResume() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (resumeId: string) => resumeService.analyzeResume(resumeId),
    onSuccess: (data, resumeId) => {
      queryClient.setQueryData(RESUME_ANALYSIS_QUERY_KEY(resumeId), data)
      queryClient.invalidateQueries({ queryKey: RESUMES_QUERY_KEY })
    },
  })
}
