import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { jobRoleService } from "@/services/jobRole.service"
import { skillGapService } from "@/services/skillGap.service"
import { resumeService } from "@/services/resume.service"
import { profileService } from "@/services/profile.service"
import type { SkillGapAnalyzePayload } from "../types/skillGap.types"

export const useJobRoles = (search?: string, category?: string) => {
  return useQuery({
    queryKey: ["jobRoles", { search, category }],
    queryFn: () => jobRoleService.listRoles(search, category),
    staleTime: 1000 * 60 * 10, // 10 minutes cache
  })
}

export const useLatestSkillGap = () => {
  return useQuery({
    queryKey: ["skillGap", "latest"],
    queryFn: async () => {
      try {
        return await skillGapService.getLatest()
      } catch (err: unknown) {
        // If 404, user simply has not generated a gap analysis yet
        const status = (err as { response?: { status?: number } })?.response?.status
        if (status === 404) {
          return null
        }
        throw err
      }
    },
    retry: false,
  })
}

export const useResumes = () => {
  return useQuery({
    queryKey: ["resumes"],
    queryFn: () => resumeService.listResumes(),
  })
}

export const useUserProfile = () => {
  return useQuery({
    queryKey: ["profile"],
    queryFn: () => profileService.getMyProfile(),
  })
}

export const useAnalyzeSkillGap = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: SkillGapAnalyzePayload) => skillGapService.analyze(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(["skillGap", "latest"], data)
      queryClient.invalidateQueries({ queryKey: ["profile"] })
    },
  })
}
