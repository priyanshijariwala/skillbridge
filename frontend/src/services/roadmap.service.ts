import apiClient from "@/lib/axios"
import type {
  Roadmap,
  RoadmapGeneratePayload,
  RoadmapProgress,
  TaskStatus,
} from "@/features/roadmap/types/roadmap.types"

export const roadmapService = {
  async generateRoadmap(payload?: RoadmapGeneratePayload): Promise<Roadmap> {
    const { data } = await apiClient.post<Roadmap>(
      "/roadmaps/generate",
      payload || {}
    )
    return data
  },

  async getCurrentRoadmap(): Promise<Roadmap> {
    const { data } = await apiClient.get<Roadmap>("/roadmaps/current")
    return data
  },

  async getRoadmapById(id: string): Promise<Roadmap> {
    const { data } = await apiClient.get<Roadmap>(`/roadmaps/${id}`)
    return data
  },

  async updateTaskStatus(
    roadmapId: string,
    taskId: string,
    status: TaskStatus
  ): Promise<Roadmap> {
    const { data } = await apiClient.patch<Roadmap>(
      `/roadmaps/${roadmapId}/tasks/${taskId}`,
      { status }
    )
    return data
  },

  async getRoadmapProgress(roadmapId: string): Promise<RoadmapProgress> {
    const { data } = await apiClient.get<RoadmapProgress>(
      `/roadmaps/${roadmapId}/progress`
    )
    return data
  },

  async archiveRoadmap(roadmapId: string): Promise<Roadmap> {
    const { data } = await apiClient.patch<Roadmap>(
      `/roadmaps/${roadmapId}/archive`
    )
    return data
  },

  async listRoadmaps(status?: string): Promise<{ items: Roadmap[]; total: number }> {
    const params: Record<string, string> = {}
    if (status) params.status = status
    const { data } = await apiClient.get<{ items: Roadmap[]; total: number }>(
      "/roadmaps",
      { params }
    )
    return data
  },
}

