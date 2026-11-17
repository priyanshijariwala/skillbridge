import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { MemoryRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { NotificationBell } from "@/features/notifications/components/NotificationBell"
import { NotificationDropdown } from "@/features/notifications/components/NotificationDropdown"
import { NotificationItem } from "@/features/notifications/components/NotificationItem"
import { NotificationPage } from "@/features/notifications/pages/NotificationPage"
import { NotificationSettingsPage } from "@/features/notifications/pages/NotificationSettingsPage"
import * as useNotificationsModule from "@/features/notifications/hooks/useNotifications"
import type { NotificationItem as NotificationItemType, NotificationPreferences } from "@/features/notifications/types/notification.types"

const MOCK_NOTIFICATIONS: NotificationItemType[] = [
  {
    id: "notif_1",
    user_id: "user_1",
    title: "Resume Analysis Completed",
    message: "Your resume analysis is ready. Overall profile match: 85%.",
    type: "success",
    category: "resume",
    is_read: false,
    action_url: "/resume",
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5m ago
  },
  {
    id: "notif_2",
    user_id: "user_1",
    title: "Coding Submission: Two Sum",
    message: "Evaluation result: ACCEPTED (5/5 passed).",
    type: "success",
    category: "coding",
    is_read: true,
    action_url: "/coding/problems/two-sum",
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), // 2h ago
  },
  {
    id: "notif_3",
    user_id: "user_1",
    title: "Security Alert",
    message: "Password changed successfully.",
    type: "warning",
    category: "security",
    is_read: false,
    action_url: "/profile",
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), // 1d ago
  },
]

const MOCK_PREFERENCES: NotificationPreferences = {
  user_id: "user_1",
  email_enabled: true,
  category_preferences: {
    account: true,
    resume: true,
    skill_gap: true,
    roadmap: true,
    interview: true,
    coding: false,
    security: true,
  },
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  )
}

describe("Notification System Frontend Components", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // 1. NotificationItem Component
  describe("NotificationItem Component", () => {
    it("renders notification details, title, and message", () => {
      renderWithProviders(
        <NotificationItem notification={MOCK_NOTIFICATIONS[0]} />
      )

      expect(screen.getByText("Resume Analysis Completed")).toBeInTheDocument()
      expect(screen.getByText(/Your resume analysis is ready/)).toBeInTheDocument()
      expect(screen.getByText(/5m ago/)).toBeInTheDocument()
      expect(screen.getByText(/View details/)).toBeInTheDocument()
    })

    it("triggers onMarkAsRead callback when mark read button is clicked", () => {
      const onMark = vi.fn()
      renderWithProviders(
        <NotificationItem
          notification={MOCK_NOTIFICATIONS[0]}
          onMarkAsRead={onMark}
        />
      )

      const markBtn = screen.getByTitle("Mark as read")
      fireEvent.click(markBtn)
      expect(onMark).toHaveBeenCalledWith("notif_1")
    })

    it("triggers onDelete callback when delete button is clicked", () => {
      const onDelete = vi.fn()
      renderWithProviders(
        <NotificationItem
          notification={MOCK_NOTIFICATIONS[0]}
          onDelete={onDelete}
        />
      )

      const delBtn = screen.getByTitle("Delete notification")
      fireEvent.click(delBtn)
      expect(onDelete).toHaveBeenCalledWith("notif_1")
    })
  })

  // 2. NotificationDropdown Component
  describe("NotificationDropdown Component", () => {
    it("renders list of notifications and unread badge count", () => {
      renderWithProviders(
        <NotificationDropdown
          notifications={MOCK_NOTIFICATIONS}
          unreadCount={2}
          isLoading={false}
          onMarkAsRead={vi.fn()}
          onMarkAllAsRead={vi.fn()}
          onClose={vi.fn()}
        />
      )

      expect(screen.getByText("Notifications")).toBeInTheDocument()
      expect(screen.getByText("2 new")).toBeInTheDocument()
      expect(screen.getByText("Resume Analysis Completed")).toBeInTheDocument()
      expect(screen.getByText("Coding Submission: Two Sum")).toBeInTheDocument()
    })

    it("triggers onMarkAllAsRead when Mark all read is clicked", () => {
      const onMarkAll = vi.fn()
      renderWithProviders(
        <NotificationDropdown
          notifications={MOCK_NOTIFICATIONS}
          unreadCount={2}
          isLoading={false}
          onMarkAsRead={vi.fn()}
          onMarkAllAsRead={onMarkAll}
          onClose={vi.fn()}
        />
      )

      const markAllBtn = screen.getByText("Mark all read")
      fireEvent.click(markAllBtn)
      expect(onMarkAll).toHaveBeenCalledOnce()
    })

    it("shows empty state when no notifications are present", () => {
      renderWithProviders(
        <NotificationDropdown
          notifications={[]}
          unreadCount={0}
          isLoading={false}
          onMarkAsRead={vi.fn()}
          onMarkAllAsRead={vi.fn()}
          onClose={vi.fn()}
        />
      )

      expect(screen.getByText("No notifications yet")).toBeInTheDocument()
    })
  })

  // 3. NotificationBell Component
  describe("NotificationBell Component", () => {
    it("renders bell icon and shows badge with unread count", () => {
      vi.spyOn(useNotificationsModule, "useUnreadCount").mockReturnValue({
        data: { unread_count: 5 },
      } as any)

      vi.spyOn(useNotificationsModule, "useNotifications").mockReturnValue({
        data: { items: MOCK_NOTIFICATIONS, total: 3, page: 1, page_size: 10, unread_count: 5 },
        isLoading: false,
      } as any)

      renderWithProviders(<NotificationBell />)

      const badge = screen.getByTestId("unread-badge")
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveTextContent("5")
    })

    it("toggles dropdown visibility on click", () => {
      vi.spyOn(useNotificationsModule, "useUnreadCount").mockReturnValue({
        data: { unread_count: 0 },
      } as any)

      vi.spyOn(useNotificationsModule, "useNotifications").mockReturnValue({
        data: { items: [], total: 0, page: 1, page_size: 10, unread_count: 0 },
        isLoading: false,
      } as any)

      renderWithProviders(<NotificationBell />)

      const bellBtn = screen.getByRole("button", { name: /notifications/i })
      // Open
      fireEvent.click(bellBtn)
      expect(screen.getByText("No notifications yet")).toBeInTheDocument()

      // Close
      fireEvent.click(bellBtn)
      expect(screen.queryByText("No notifications yet")).not.toBeInTheDocument()
    })
  })

  // 4. NotificationPage (Full History)
  describe("NotificationPage", () => {
    it("renders notification page with all notifications, tabs, and filters", () => {
      vi.spyOn(useNotificationsModule, "useNotifications").mockReturnValue({
        data: {
          items: MOCK_NOTIFICATIONS,
          total: 3,
          page: 1,
          page_size: 15,
          unread_count: 2,
        },
        isLoading: false,
      } as any)

      renderWithProviders(<NotificationPage />)

      expect(screen.getByText("Notifications")).toBeInTheDocument()
      expect(screen.getByText("2 Unread")).toBeInTheDocument()
      expect(screen.getByText("Resume Analysis Completed")).toBeInTheDocument()
      expect(screen.getByText("Coding Submission: Two Sum")).toBeInTheDocument()
      expect(screen.getByText("Security Alert")).toBeInTheDocument()
    })

    it("switches to Unread filter tab", () => {
      const mockUseNotif = vi.spyOn(useNotificationsModule, "useNotifications").mockReturnValue({
        data: {
          items: [MOCK_NOTIFICATIONS[0], MOCK_NOTIFICATIONS[2]],
          total: 2,
          page: 1,
          page_size: 15,
          unread_count: 2,
        },
        isLoading: false,
      } as any)

      renderWithProviders(<NotificationPage />)

      const unreadTab = screen.getByRole("button", { name: /unread/i })
      fireEvent.click(unreadTab)

      expect(mockUseNotif).toHaveBeenCalledWith(
        expect.objectContaining({ is_read: false })
      )
    })
  })

  // 5. NotificationSettingsPage (Preferences)
  describe("NotificationSettingsPage", () => {
    it("renders preferences and ensures security emails are locked as required", () => {
      vi.spyOn(useNotificationsModule, "useNotificationPreferences").mockReturnValue({
        data: MOCK_PREFERENCES,
        isLoading: false,
        error: null,
      } as any)

      renderWithProviders(<NotificationSettingsPage />)

      expect(screen.getByText("Email & Notification Settings")).toBeInTheDocument()
      expect(screen.getByText("Transactional Email Notifications")).toBeInTheDocument()
      expect(screen.getByText("Account Security & Authentication Alerts")).toBeInTheDocument()
      expect(screen.getByText("Required")).toBeInTheDocument()

      // Security checkbox is disabled
      const securityCheckbox = screen.getByLabelText(/Toggle Account Security/i)
      expect(securityCheckbox).toBeDisabled()
    })

    it("updates preferences when form is submitted", async () => {
      const mutateAsync = vi.fn().mockResolvedValue(MOCK_PREFERENCES)
      vi.spyOn(useNotificationsModule, "useNotificationPreferences").mockReturnValue({
        data: MOCK_PREFERENCES,
        isLoading: false,
        error: null,
      } as any)

      vi.spyOn(useNotificationsModule, "useUpdateNotificationPreferences").mockReturnValue({
        mutateAsync,
        isPending: false,
      } as any)

      renderWithProviders(<NotificationSettingsPage />)

      const saveBtn = screen.getByRole("button", { name: /save preferences/i })
      fireEvent.click(saveBtn)

      await waitFor(() => {
        expect(mutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({ email_enabled: true })
        )
      })
      expect(screen.getByText("Notification preferences successfully saved.")).toBeInTheDocument()
    })
  })
})

