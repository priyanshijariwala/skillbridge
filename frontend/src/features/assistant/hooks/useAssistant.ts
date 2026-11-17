import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { assistantService } from "@/services/assistant.service"
import type {
  Conversation,
  CreateConversationPayload,
} from "@/features/assistant/types/assistant.types"

export const ASSISTANT_KEYS = {
  all: ["assistant"] as const,
  conversations: (search?: string) =>
    [...ASSISTANT_KEYS.all, "conversations", search || ""] as const,
  conversation: (id?: string) => [...ASSISTANT_KEYS.all, "conversation", id || ""] as const,
  messages: (id?: string) => [...ASSISTANT_KEYS.all, "messages", id || ""] as const,
  contextSummary: () => [...ASSISTANT_KEYS.all, "contextSummary"] as const,
}

export function useConversations(search?: string, page = 1) {
  return useQuery({
    queryKey: ASSISTANT_KEYS.conversations(search),
    queryFn: () => assistantService.listConversations(search, page),
  })
}

export function useConversation(conversationId?: string) {
  return useQuery({
    queryKey: ASSISTANT_KEYS.conversation(conversationId),
    queryFn: () => (conversationId ? assistantService.getConversation(conversationId) : null),
    enabled: Boolean(conversationId),
  })
}

export function useMessages(conversationId?: string) {
  return useQuery({
    queryKey: ASSISTANT_KEYS.messages(conversationId),
    queryFn: () => (conversationId ? assistantService.listMessages(conversationId) : null),
    enabled: Boolean(conversationId),
  })
}

export function useContextSummary() {
  return useQuery({
    queryKey: ASSISTANT_KEYS.contextSummary(),
    queryFn: () => assistantService.getContextSummary(),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  })
}

export function useCreateConversation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload?: CreateConversationPayload) =>
      assistantService.createConversation(payload),
    onSuccess: (newConv: Conversation) => {
      queryClient.invalidateQueries({ queryKey: [...ASSISTANT_KEYS.all, "conversations"] })
      return newConv
    },
  })
}

export function useSendMessage(conversationId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (message: string) => {
      if (!conversationId) throw new Error("Conversation ID is required")
      return assistantService.sendMessage(conversationId, message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSISTANT_KEYS.messages(conversationId) })
      queryClient.invalidateQueries({ queryKey: [...ASSISTANT_KEYS.all, "conversations"] })
    },
  })
}

export function useRenameConversation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ conversationId, title }: { conversationId: string; title: string }) =>
      assistantService.renameConversation(conversationId, title),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [...ASSISTANT_KEYS.all, "conversations"] })
      queryClient.invalidateQueries({ queryKey: ASSISTANT_KEYS.conversation(variables.conversationId) })
    },
  })
}

export function useDeleteConversation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (conversationId: string) => assistantService.deleteConversation(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...ASSISTANT_KEYS.all, "conversations"] })
    },
  })
}

