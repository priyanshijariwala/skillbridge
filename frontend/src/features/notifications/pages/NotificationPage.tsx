import React, { useState } from "react"
import { Link } from "react-router-dom"
import {
  Bell,
  CheckCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react"
import { PageHeader } from "@/components/common/PageHeader"
import { Card } from "@/components/ui/card"
import { LoadingSkeleton } from "@/components/common/LoadingSkeleton"
import { NotificationItem } from "@/features/notifications/components/NotificationItem"
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
} from "@/features/notifications/hooks/useNotifications"

const PAGE_SIZE = 15

const CATEGORIES = [
  { value: "", label: "All Categories" },
  { value: "account", label: "Account" },
  { value: "resume", label: "Resume" },
  { value: "skill_gap", label: "Skill Gap" },
  { value: "roadmap", label: "Roadmap" },
  { value: "interview", label: "Interview" },
  { value: "coding", label: "Coding" },
  { value: "security", label: "Security" },
]

export const NotificationPage: React.FC = () => {
  const [filterType, setFilterType] = useState<"all" | "unread">("all")
  const [category, setCategory] = useState<string>("")
  const [page, setPage] = useState<number>(1)

  const isReadParam = filterType === "unread" ? false : undefined

  const { data, isLoading } = useNotifications({
    is_read: isReadParam,
    category: category || undefined,
    page,
    page_size: PAGE_SIZE,
  })

  const markAsReadMutation = useMarkAsRead()
  const markAllAsReadMutation = useMarkAllAsRead()
  const deleteMutation = useDeleteNotification()

  const notifications = data?.items ?? []
  const total = data?.total ?? 0
  const unreadCount = data?.unread_count ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Stay updated with analysis results, roadmap milestones, and interview feedback."
        badge={{
          label: `${unreadCount} Unread`,
          variant: unreadCount > 0 ? "warning" : "outline",
        }}
        actions={
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-accent transition-colors cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all as read</span>
              </button>
            )}

            <Link
              to="/settings/notifications"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Email Preferences</span>
            </Link>
          </div>
        }
      />

      {/* Filter Toolbar */}
      <Card className="p-3 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => {
              setFilterType("all")
              setPage(1)
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              filterType === "all"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => {
              setFilterType("unread")
              setPage(1)
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              filterType === "unread"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>Unread</span>
            {unreadCount > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            )}
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value)
              setPage(1)
            }}
            className="bg-muted/60 border border-border text-foreground text-xs rounded-lg px-2.5 py-1.5 font-medium outline-hidden focus:border-primary transition-colors cursor-pointer"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value} className="bg-popover text-popover-foreground">
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Notifications List */}
      {isLoading ? (
        <LoadingSkeleton variant="card" count={4} />
      ) : notifications.length === 0 ? (
        <Card className="p-16 text-center space-y-3 border-dashed border-2">
          <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <Bell className="w-6 h-6 opacity-40" />
          </div>
          <p className="text-sm font-semibold text-foreground">No notifications found</p>
          <p className="text-xs text-muted-foreground">
            {filterType === "unread"
              ? "You've read all your notifications!"
              : "No notifications match your current filter selection."}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <NotificationItem
              key={notif.id}
              notification={notif}
              onMarkAsRead={(id) => markAsReadMutation.mutate(id)}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Prev
          </button>

          <span className="text-xs font-medium text-muted-foreground px-2">
            Page {page} of {totalPages}
          </span>

          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}

export default NotificationPage

