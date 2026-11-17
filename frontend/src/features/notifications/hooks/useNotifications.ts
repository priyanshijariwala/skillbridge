import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { notificationService } from "@/services/notification.service"
import type { NotificationPreferencesUpdate } from "@/features/notifications/types/notification.types"

export const NOTIFICATION_KEYS = {
  all: ["notifications"] as const,
  list: (params?: Record<string, unknown>) => [...NOTIFICATION_KEYS.all, "list", params || {}] as const,
  unreadCount: () => [...NOTIFICATION_KEYS.all, "unreadCount"] as const,
  preferences: () => [...NOTIFICATION_KEYS.all, "preferences"] as const,
}

export function useNotifications(params?: {
  is_read?: boolean
  category?: string
  page?: number
  page_size?: number
}) {
  return useQuery({
    queryKey: NOTIFICATION_KEYS.list(params),
    queryFn: () => notificationService.listNotifications(params),
    refetchOnWindowFocus: true,
  })
}

export function useUnreadCount() {
  return useQuery({
    queryKey: NOTIFICATION_KEYS.unreadCount(),
    queryFn: () => notificationService.getUnreadCount(),
    refetchInterval: 30000, // Poll every 30s
    refetchOnWindowFocus: true,
  })
}

export function useMarkAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (notificationId: string) => notificationService.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all })
    },
  })
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all })
    },
  })
}

export function useDeleteNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (notificationId: string) => notificationService.deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all })
    },
  })
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: NOTIFICATION_KEYS.preferences(),
    queryFn: () => notificationService.getPreferences(),
  })
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: NotificationPreferencesUpdate) =>
      notificationService.updatePreferences(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.preferences() })
    },
  })
}

