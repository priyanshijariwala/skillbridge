export type MessageRole = "user" | "assistant" | "system"

export interface Conversation {
  id: string
  user_id: string
  title: string
  status: string
  created_at?: string
  updated_at?: string
  last_message_at?: string
}

export interface ChatMessage {
  id: string
  conversation_id: string
  role: MessageRole
  content: string
  message_type?: string
  context_metadata?: {
    sources_included?: string[]
    model?: string
    [key: string]: unknown
  }
  created_at?: string
}

export interface ConversationListResponse {
  items: Conversation[]
  total: number
  page: number
  page_size: number
}

export interface ChatMessageListResponse {
  items: ChatMessage[]
  total: number
  conversation_id: string
}

export interface ContextSummary {
  profile_available: boolean
  resume_available: boolean
  skill_gap_available: boolean
  roadmap_available: boolean
  interview_available: boolean
  target_role?: string | null
  user_name?: string | null
}

export interface SendMessagePayload {
  message: string
}

export interface CreateConversationPayload {
  title?: string
}

export interface UpdateConversationPayload {
  title: string
}

