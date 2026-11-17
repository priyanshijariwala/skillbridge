import React from "react"
import { NavLink, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  FileText,
  Compass,
  Milestone,
  Bot,
  History,
  User,
  Settings,
  X,
  Target,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/features/auth/hooks/useAuth"

export interface AppSidebarProps {
  isMobileOpen: boolean
  onMobileClose: () => void
  targetRoleTitle?: string
}

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Resume Analysis", href: "/resume", icon: FileText },
  { label: "Skill Gap Analysis", href: "/skill-gap", icon: Compass },
  { label: "Learning Roadmap", href: "/roadmap", icon: Milestone },
  { label: "AI Interview", href: "/interview/setup", icon: Bot },
  { label: "Interview History", href: "/interview-history", icon: History },
]

const secondaryNavItems = [
  { label: "Profile", href: "/profile", icon: User },
  { label: "Settings", href: "/settings", icon: Settings },
]

export const AppSidebar: React.FC<AppSidebarProps> = ({
  isMobileOpen,
  onMobileClose,
  targetRoleTitle = "Senior Backend Engineer",
}) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const displayName = user?.name || "Candidate"
  const email = user?.email || "candidate@skillbridge.ai"

  const initials = displayName
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("") || "CB"

  const handleLogout = async () => {
    onMobileClose()
    await logout()
    navigate("/login", { replace: true })
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col transition-transform duration-200 ease-in-out lg:static lg:h-full lg:shrink-0 lg:translate-x-0",
          isMobileOpen
            ? "translate-x-0 shadow-xl"
            : "-translate-x-full pointer-events-none lg:pointer-events-auto"
        )}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 border-b border-border flex items-center justify-between shrink-0">
          <NavLink
            to="/dashboard"
            onClick={onMobileClose}
            className="flex items-center gap-2.5 font-bold text-foreground text-lg"
          >
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-xs">
              ⚡
            </div>
            <span>SkillBridge AI</span>
          </NavLink>
          <button
            onClick={onMobileClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground lg:hidden cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Goal Context Box */}
        <div className="px-4 py-3 mx-4 mt-4 rounded-xl bg-slate-50 border border-slate-200/80 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mb-1">
            <Target className="w-3.5 h-3.5 text-primary" />
            <span>Target Goal</span>
          </div>
          <div className="text-xs font-semibold text-foreground truncate">{targetRoleTitle}</div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Preparation Journey
          </div>
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={onMobileClose}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            )
          })}

          <div className="pt-6 px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Account & System
          </div>
          {secondaryNavItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.label}
                to={item.href}
                onClick={onMobileClose}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </div>

        {/* User Profile Mini Footer with Logout */}
        <div className="p-3 border-t border-border flex items-center justify-between gap-2 shrink-0">
          <NavLink
            to="/profile"
            onClick={onMobileClose}
            className="flex items-center gap-2.5 min-w-0 hover:opacity-80 transition-opacity flex-1"
          >
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-foreground truncate">{displayName}</div>
              <div className="text-[11px] text-muted-foreground truncate">{email}</div>
            </div>
          </NavLink>

          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0 cursor-pointer"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>
    </>
  )
}

export default AppSidebar
