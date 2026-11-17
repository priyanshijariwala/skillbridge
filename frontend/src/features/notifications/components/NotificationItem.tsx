import React from "react"
import { useNavigate } from "react-router-dom"
import {
  FileText,
  Compass,
  Milestone,
  Bot,
  Code2,
  ShieldAlert,
  Bell,
  Check,
  Trash2,
} from "lucide-react"
import type { NotificationItem as NotificationItemType } from "@/features/notifications/types/notification.types"

interface NotificationItemProps {
  notification: NotificationItemType
  onMarkAsRead?: (id: string) => void
  onDelete?: (id: string) => void
  compact?: boolean
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "resume":
      return <FileText className="w-3.5 h-3.5 text-blue-500" />
    case "skill_gap":
      return <Compass className="w-3.5 h-3.5 text-amber-500" />
    case "roadmap":
      return <Milestone className="w-3.5 h-3.5 text-indigo-500" />
    case "interview":
      return <Bot className="w-3.5 h-3.5 text-emerald-500" />
    case "coding":
      return <Code2 className="w-3.5 h-3.5 text-purple-500" />
    case "security":
      return <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
    default:
      return <Bell className="w-3.5 h-3.5 text-muted-foreground" />
  }
}

const formatRelativeTime = (dateStr: string): string => {
  try {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
    if (diff < 60) return "just now"
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
    return new Date(dateStr).toLocaleDateString()
  } catch {
    return "recently"
  }
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onDelete,
  compact = false,
}) => {
  const navigate = useNavigate()

  const handleClick = () => {
    if (!notification.is_read && onMarkAsRead) {
      onMarkAsRead(notification.id)
    }
    if (notification.action_url) {
      navigate(notification.action_url)
    }
  }

  return (
    <div
      className={`group relative flex items-start gap-3 p-3 transition-colors ${
        notification.is_read
          ? "bg-card/40 hover:bg-muted/40"
          : "bg-primary/5 hover:bg-primary/10 border-l-2 border-primary"
      } ${compact ? "rounded-lg" : "rounded-xl border border-border"}`}
    >
      {/* Category Icon */}
      <div className="p-2 rounded-lg bg-muted shrink-0 mt-0.5">
        {getCategoryIcon(notification.category)}
      </div>

      {/* Main Info */}
      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={handleClick}
        role="button"
        tabIndex={0}
      >
        <div className="flex items-center justify-between gap-2 mb-1">
          <span
            className={`text-xs font-semibold truncate ${
              notification.is_read ? "text-foreground" : "text-foreground font-bold"
            }`}
          >
            {notification.title}
          </span>
          <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
            {formatRelativeTime(notification.created_at)}
          </span>
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {notification.message}
        </p>

        {notification.action_url && !compact && (
          <span className="inline-block text-[11px] text-primary font-medium mt-1.5 hover:underline">
            View details &rarr;
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
        {!notification.is_read && onMarkAsRead && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onMarkAsRead(notification.id)
            }}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Mark as read"
            aria-label="Mark as read"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
        )}

        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(notification.id)
            }}
            className="p-1 rounded text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
            title="Delete notification"
            aria-label="Delete notification"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

