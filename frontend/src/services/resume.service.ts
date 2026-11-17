import apiClient from "@/lib/axios"
import type { ResumeAnalysisRead, ResumeRead } from "@/features/resume/types/resume.types"

export const resumeService = {
  async uploadResume(
    file: File,
    onProgress?: (percentage: number) => void
  ): Promise<ResumeRead> {
    const formData = new FormData()
    formData.append("file", file)
    // Do NOT set Content-Type manually — let Axios/browser handle multipart boundary
    const { data } = await apiClient.post<ResumeRead>("/resumes", formData, {
      onUploadProgress: (event) => {
        if (onProgress && event.total) {
          const pct = Math.round((event.loaded * 100) / event.total)
          onProgress(pct)
        }
      },
    })
    return data
  },

  async listResumes(): Promise<ResumeRead[]> {
    const { data } = await apiClient.get<ResumeRead[]>("/resumes")
    return data
  },

  async getResume(id: string): Promise<ResumeRead> {
    const { data } = await apiClient.get<ResumeRead>(`/resumes/${id}`)
    return data
  },

  async downloadResume(id: string, filename: string): Promise<void> {
    const response = await apiClient.get(`/resumes/${id}/download`, {
      responseType: "blob",
    })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },

  async deleteResume(id: string): Promise<void> {
    await apiClient.delete(`/resumes/${id}`)
  },

  async analyzeResume(resumeId: string): Promise<ResumeAnalysisRead> {
    const { data } = await apiClient.post<ResumeAnalysisRead>(
      `/resumes/${resumeId}/analysis`
    )
    return data
  },

  async getLatestAnalysis(resumeId: string): Promise<ResumeAnalysisRead> {
    const { data } = await apiClient.get<ResumeAnalysisRead>(
      `/resumes/${resumeId}/analysis`
    )
    return data
  },
}
