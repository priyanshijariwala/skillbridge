import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { interviewService } from "@/services/interview.service"
import type {
  InterviewAnswerPayload,
  InterviewCreatePayload,
} from "../types/interview.types"

export const useInterview = (interviewId?: string) => {
  return useQuery({
    queryKey: ["interview", interviewId],
    queryFn: () => interviewService.getInterview(interviewId!),
    enabled: Boolean(interviewId),
    retry: 1,
  })
}

export const useInterviewMessages = (interviewId?: string) => {
  return useQuery({
    queryKey: ["interview", interviewId, "messages"],
    queryFn: () => interviewService.getMessages(interviewId!),
    enabled: Boolean(interviewId),
  })
}

export const useInterviewFeedback = (interviewId?: string) => {
  return useQuery({
    queryKey: ["interview", interviewId, "feedback"],
    queryFn: () => interviewService.getFeedback(interviewId!),
    enabled: Boolean(interviewId),
    retry: 1,
  })
}

export const useInterviewList = (params?: {
  status?: string
  interview_type?: string
  page?: number
  page_size?: number
}) => {
  return useQuery({
    queryKey: ["interviews", params],
    queryFn: () => interviewService.listInterviews(params),
  })
}

export const useCreateInterview = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: InterviewCreatePayload) =>
      interviewService.createInterview(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(["interview", data.id], data)
      queryClient.invalidateQueries({ queryKey: ["interviews"] })
    },
  })
}

export const useSubmitAnswer = (interviewId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: InterviewAnswerPayload) =>
      interviewService.submitAnswer(interviewId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interview", interviewId] })
      queryClient.invalidateQueries({
        queryKey: ["interview", interviewId, "messages"],
      })
      queryClient.invalidateQueries({ queryKey: ["interviews"] })
    },
  })
}

export const useCompleteInterview = (interviewId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => interviewService.completeInterview(interviewId),
    onSuccess: (feedback) => {
      queryClient.setQueryData(["interview", interviewId, "feedback"], feedback)
      queryClient.invalidateQueries({ queryKey: ["interview", interviewId] })
      queryClient.invalidateQueries({ queryKey: ["interviews"] })
    },
  })
}

export const useAbandonInterview = (interviewId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => interviewService.abandonInterview(interviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interview", interviewId] })
      queryClient.invalidateQueries({ queryKey: ["interviews"] })
    },
  })
}

