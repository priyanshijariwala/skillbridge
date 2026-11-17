import apiClient, { getAccessToken } from "@/lib/axios"
import type {
  ChatMessage,
  ChatMessageListResponse,
  ContextSummary,
  Conversation,
  ConversationListResponse,
  CreateConversationPayload,
} from "@/features/assistant/types/assistant.types"

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1"

export const assistantService = {
  async listConversations(
    search?: string,
    page = 1,
    pageSize = 20
  ): Promise<ConversationListResponse> {
    const params = new URLSearchParams()
    if (search) params.append("search", search)
    params.append("page", page.toString())
    params.append("page_size", pageSize.toString())

    const { data } = await apiClient.get<ConversationListResponse>(
      `/assistant/conversations?${params.toString()}`
    )
    return data
  },

  async createConversation(
    payload?: CreateConversationPayload
  ): Promise<Conversation> {
    const { data } = await apiClient.post<Conversation>(
      "/assistant/conversations",
      payload || {}
    )
    return data
  },

  async getConversation(conversationId: string): Promise<Conversation> {
    const { data } = await apiClient.get<Conversation>(
      `/assistant/conversations/${conversationId}`
    )
    return data
  },

  async renameConversation(
    conversationId: string,
    title: string
  ): Promise<Conversation> {
    const { data } = await apiClient.patch<Conversation>(
      `/assistant/conversations/${conversationId}`,
      { title }
    )
    return data
  },

  async deleteConversation(conversationId: string): Promise<void> {
    await apiClient.delete(`/assistant/conversations/${conversationId}`)
  },

  async listMessages(
    conversationId: string,
    skip = 0,
    limit = 100
  ): Promise<ChatMessageListResponse> {
    const { data } = await apiClient.get<ChatMessageListResponse>(
      `/assistant/conversations/${conversationId}/messages`,
      { params: { skip, limit } }
    )
    return data
  },

  async sendMessage(
    conversationId: string,
    message: string
  ): Promise<ChatMessage> {
    const { data } = await apiClient.post<ChatMessage>(
      `/assistant/conversations/${conversationId}/messages`,
      { message }
    )
    return data
  },

  async getContextSummary(): Promise<ContextSummary> {
    const { data } = await apiClient.get<ContextSummary>(
      "/assistant/context-summary"
    )
    return data
  },

  streamMessage(
    conversationId: string,
    message: string,
    onChunk: (chunk: string) => void,
    onDone: (messageId?: string) => void,
    onError: (err: Error) => void
  ): () => void {
    const abortController = new AbortController()

    ;(async () => {
      try {
        const token = getAccessToken()
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        }
        if (token) {
          headers["Authorization"] = `Bearer ${token}`
        }

        const response = await fetch(
          `${API_BASE_URL}/assistant/conversations/${conversationId}/stream`,
          {
            method: "POST",
            headers,
            credentials: "include",
            body: JSON.stringify({ message }),
            signal: abortController.signal,
          }
        )

        if (!response.ok) {
          throw new Error(`Stream request failed with status ${response.status}`)
        }

        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error("Response body is not readable")
        }

        const decoder = new TextDecoder()
        let buffer = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n\n")
          buffer = lines.pop() || ""

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed.startsWith("data:")) continue

            const jsonStr = trimmed.replace(/^data:\s*/, "")
            if (jsonStr === "[DONE]") {
              onDone()
              return
            }

            try {
              const parsed = JSON.parse(jsonStr)
              if (parsed.chunk) {
                onChunk(parsed.chunk)
              }
              if (parsed.done) {
                onDone(parsed.message_id)
                return
              }
            } catch {
              // Ignore partial JSON parse chunks
            }
          }
        }
        onDone()
      } catch (err: unknown) {
        if ((err as Error)?.name !== "AbortError") {
          onError(err as Error)
        }
      }
    })()

    return () => abortController.abort()
  },
}

