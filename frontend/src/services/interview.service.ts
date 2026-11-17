import apiClient from "@/lib/axios"
import type {
  Interview,
  InterviewAnswerPayload,
  InterviewAnswerResponse,
  InterviewCreatePayload,
  InterviewFeedback,
  InterviewListResponse,
  InterviewMessage,
} from "@/features/interview/types/interview.types"

export const interviewService = {
  async createInterview(payload: InterviewCreatePayload): Promise<Interview> {
    const { data } = await apiClient.post<Interview>("/interviews", payload)
    return data
  },

  async getInterview(interviewId: string): Promise<Interview> {
    const { data } = await apiClient.get<Interview>(`/interviews/${interviewId}`)
    return data
  },

  async getMessages(interviewId: string): Promise<InterviewMessage[]> {
    const { data } = await apiClient.get<InterviewMessage[]>(
      `/interviews/${interviewId}/messages`
    )
    return data
  },

  async submitAnswer(
    interviewId: string,
    payload: InterviewAnswerPayload
  ): Promise<InterviewAnswerResponse> {
    const { data } = await apiClient.post<InterviewAnswerResponse>(
      `/interviews/${interviewId}/answers`,
      payload
    )
    return data
  },

  async completeInterview(interviewId: string): Promise<InterviewFeedback> {
    const { data } = await apiClient.post<InterviewFeedback>(
      `/interviews/${interviewId}/complete`
    )
    return data
  },

  async getFeedback(interviewId: string): Promise<InterviewFeedback> {
    const { data } = await apiClient.get<InterviewFeedback>(
      `/interviews/${interviewId}/feedback`
    )
    return data
  },

  async abandonInterview(interviewId: string): Promise<Interview> {
    const { data } = await apiClient.patch<Interview>(
      `/interviews/${interviewId}/abandon`
    )
    return data
  },

  async listInterviews(params?: {
    status?: string
    interview_type?: string
    page?: number
    page_size?: number
  }): Promise<InterviewListResponse> {
    const { data } = await apiClient.get<InterviewListResponse>("/interviews", {
      params,
    })
    return data
  },
}
