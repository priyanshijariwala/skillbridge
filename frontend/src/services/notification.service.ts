import apiClient from "@/lib/axios"
import type {
  NotificationItem,
  NotificationListResponse,
  NotificationPreferences,
  NotificationPreferencesUpdate,
  UnreadCountResponse,
} from "@/features/notifications/types/notification.types"

export const notificationService = {
  async listNotifications(params?: {
    is_read?: boolean
    category?: string
    page?: number
    page_size?: number
  }): Promise<NotificationListResponse> {
    const searchParams = new URLSearchParams()
    if (params?.is_read !== undefined) {
      searchParams.append("is_read", params.is_read.toString())
    }
    if (params?.category) {
      searchParams.append("category", params.category)
    }
    if (params?.page) {
      searchParams.append("page", params.page.toString())
    }
    if (params?.page_size) {
      searchParams.append("page_size", params.page_size.toString())
    }

    const query = searchParams.toString() ? `?${searchParams.toString()}` : ""
    const { data } = await apiClient.get<NotificationListResponse>(`/notifications${query}`)
    return data
  },

  async getUnreadCount(): Promise<UnreadCountResponse> {
    const { data } = await apiClient.get<UnreadCountResponse>("/notifications/unread-count")
    return data
  },

  async markAsRead(notificationId: string): Promise<NotificationItem> {
    const { data } = await apiClient.patch<NotificationItem>(`/notifications/${notificationId}/read`)
    return data
  },

  async markAllAsRead(): Promise<UnreadCountResponse> {
    const { data } = await apiClient.patch<UnreadCountResponse>("/notifications/read-all")
    return data
  },

  async deleteNotification(notificationId: string): Promise<void> {
    await apiClient.delete(`/notifications/${notificationId}`)
  },

  async getPreferences(): Promise<NotificationPreferences> {
    const { data } = await apiClient.get<NotificationPreferences>("/notification-preferences")
    return data
  },

  async updatePreferences(payload: NotificationPreferencesUpdate): Promise<NotificationPreferences> {
    const { data } = await apiClient.put<NotificationPreferences>("/notification-preferences", payload)
    return data
  },
}

