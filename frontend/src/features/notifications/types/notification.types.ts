export type NotificationType = "info" | "success" | "warning" | "error"

export type NotificationCategory =
  | "account"
  | "resume"
  | "skill_gap"
  | "roadmap"
  | "interview"
  | "coding"
  | "security"

export interface NotificationItem {
  id: string
  user_id: string
  title: string
  message: string
  type: NotificationType
  category: NotificationCategory
  is_read: boolean
  action_url?: string | null
  metadata?: Record<string, unknown>
  created_at: string
  read_at?: string | null
}

export interface NotificationListResponse {
  items: NotificationItem[]
  total: number
  page: number
  page_size: number
  unread_count: number
}

export interface UnreadCountResponse {
  unread_count: number
}

export interface NotificationPreferences {
  user_id: string
  email_enabled: boolean
  category_preferences: Record<NotificationCategory | string, boolean>
  updated_at?: string | null
}

export interface NotificationPreferencesUpdate {
  email_enabled?: boolean
  category_preferences?: Record<string, boolean>
}

