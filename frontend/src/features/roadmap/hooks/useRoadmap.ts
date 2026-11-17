import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { roadmapService } from "@/services/roadmap.service"
import { skillGapService } from "@/services/skillGap.service"
import { resumeService } from "@/services/resume.service"
import type {
  RoadmapGeneratePayload,
  TaskStatus,
} from "../types/roadmap.types"

export const useCurrentRoadmap = () => {
  return useQuery({
    queryKey: ["roadmap", "current"],
    queryFn: async () => {
      try {
        return await roadmapService.getCurrentRoadmap()
      } catch (err: unknown) {
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

export const useRoadmapProgress = (roadmapId?: string) => {
  return useQuery({
    queryKey: ["roadmap", roadmapId, "progress"],
    queryFn: () => roadmapService.getRoadmapProgress(roadmapId!),
    enabled: Boolean(roadmapId),
  })
}

export const useGenerateRoadmap = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload?: RoadmapGeneratePayload) =>
      roadmapService.generateRoadmap(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(["roadmap", "current"], data)
      queryClient.invalidateQueries({ queryKey: ["roadmap"] })
    },
  })
}

export const useUpdateTaskStatus = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      roadmapId,
      taskId,
      status,
    }: {
      roadmapId: string
      taskId: string
      status: TaskStatus
    }) => roadmapService.updateTaskStatus(roadmapId, taskId, status),
    onSuccess: (data) => {
      queryClient.setQueryData(["roadmap", "current"], data)
      queryClient.invalidateQueries({ queryKey: ["roadmap"] })
    },
  })
}

export const useArchiveRoadmap = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (roadmapId: string) => roadmapService.archiveRoadmap(roadmapId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roadmap"] })
    },
  })
}

export const useLatestSkillGap = () => {
  return useQuery({
    queryKey: ["skillGap", "latest"],
    queryFn: async () => {
      try {
        return await skillGapService.getLatest()
      } catch (err: unknown) {
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

