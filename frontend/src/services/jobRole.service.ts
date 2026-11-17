import apiClient from "@/lib/axios"
import type { JobRole, JobRoleListResponse } from "@/features/skill-gap/types/skillGap.types"

export const jobRoleService = {
  async listRoles(search?: string, category?: string): Promise<JobRole[]> {
    const params: Record<string, string> = {}
    if (search) params.q = search
    if (category) params.category = category

    const { data } = await apiClient.get<JobRoleListResponse>("/job-roles", { params })
    return data.items
  },

  async getRole(roleId: string): Promise<JobRole> {
    const { data } = await apiClient.get<JobRole>(`/job-roles/${roleId}`)
    return data
  },
}

