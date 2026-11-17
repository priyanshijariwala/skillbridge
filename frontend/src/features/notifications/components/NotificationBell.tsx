import React, { useState, useRef, useEffect } from "react"
import { Bell } from "lucide-react"
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
} from "@/features/notifications/hooks/useNotifications"
import { NotificationDropdown } from "@/features/notifications/components/NotificationDropdown"

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const { data: countData } = useUnreadCount()
  const unreadCount = countData?.unread_count ?? 0

  const { data: listData, isLoading } = useNotifications({
    page: 1,
    page_size: 10,
  })

  const markAsReadMutation = useMarkAsRead()
  const markAllAsReadMutation = useMarkAllAsRead()

  // Close dropdown when clicked outside
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick)
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent relative cursor-pointer transition-colors"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span
            data-testid="unread-badge"
            className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-extrabold ring-2 ring-card shadow-xs"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <NotificationDropdown
          notifications={listData?.items ?? []}
          unreadCount={unreadCount}
          isLoading={isLoading}
          onMarkAsRead={(id) => markAsReadMutation.mutate(id)}
          onMarkAllAsRead={() => markAllAsReadMutation.mutate()}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

export default NotificationBell

