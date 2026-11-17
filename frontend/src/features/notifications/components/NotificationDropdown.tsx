import React from "react"
import { Link } from "react-router-dom"
import { CheckCheck, Settings, Bell, ExternalLink } from "lucide-react"
import { NotificationItem } from "@/features/notifications/components/NotificationItem"
import type { NotificationItem as NotificationItemType } from "@/features/notifications/types/notification.types"

interface NotificationDropdownProps {
  notifications: NotificationItemType[]
  unreadCount: number
  isLoading: boolean
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
  onClose: () => void
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  unreadCount,
  isLoading,
  onMarkAsRead,
  onMarkAllAsRead,
  onClose,
}) => {
  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-border bg-card text-card-foreground shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-foreground">Notifications</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
              {unreadCount} new
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllAsRead}
            className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-[380px] overflow-y-auto divide-y divide-border/50 p-2 space-y-1">
        {isLoading ? (
          <div className="py-8 text-center text-xs text-muted-foreground animate-pulse">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <div className="w-10 h-10 mx-auto rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <Bell className="w-5 h-5 opacity-40" />
            </div>
            <p className="text-xs font-semibold text-foreground">No notifications yet</p>
            <p className="text-[11px] text-muted-foreground">
              You're all caught up! Updates on your resume, roadmaps, and assessments will appear here.
            </p>
          </div>
        ) : (
          notifications.slice(0, 6).map((notif) => (
            <NotificationItem
              key={notif.id}
              notification={notif}
              onMarkAsRead={onMarkAsRead}
              compact={true}
            />
          ))
        )}
      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-muted/20 text-xs">
        <Link
          to="/notifications"
          onClick={onClose}
          className="flex items-center gap-1 text-primary hover:underline font-semibold text-[11px]"
        >
          <span>View all notifications</span>
          <ExternalLink className="w-3 h-3" />
        </Link>

        <Link
          to="/settings/notifications"
          onClick={onClose}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors text-[11px]"
          title="Notification preferences"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Preferences</span>
        </Link>
      </div>
    </div>
  )
}

