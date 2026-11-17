import apiClient from "@/lib/axios"
import type {
  SkillGapAnalysis,
  SkillGapAnalyzePayload,
} from "@/features/skill-gap/types/skillGap.types"

export const skillGapService = {
  async analyze(payload: SkillGapAnalyzePayload): Promise<SkillGapAnalysis> {
    const { data } = await apiClient.post<SkillGapAnalysis>(
      "/skill-gap/analyze",
      payload
    )
    return data
  },

  async getLatest(): Promise<SkillGapAnalysis> {
    const { data } = await apiClient.get<SkillGapAnalysis>("/skill-gap/latest")
    return data
  },

  async getById(analysisId: string): Promise<SkillGapAnalysis> {
    const { data } = await apiClient.get<SkillGapAnalysis>(
      `/skill-gap/${analysisId}`
    )
    return data
  },
}

