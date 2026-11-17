import React from "react"
import { Menu, Bell, Sparkles, LogOut } from "lucide-react"
import { NavLink, useNavigate } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/features/auth/hooks/useAuth"

export interface AppHeaderProps {
  onMenuClick: () => void
  pageTitle?: string
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onMenuClick,
  pageTitle,
}) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const displayName = user?.name || "Candidate"

  // Derive initials
  const initials = displayName
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("") || "CB"

  const handleLogout = async () => {
    await logout()
    navigate("/login", { replace: true })
  }

  return (
    <header className="h-16 px-4 sm:px-6 bg-card border-b border-border shrink-0 z-30 flex items-center justify-between gap-4">
      {/* Left: Mobile Toggle & Page Title / Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent lg:hidden cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        {pageTitle && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground hidden sm:inline">
              SkillBridge
            </span>
            <span className="text-muted-foreground hidden sm:inline">/</span>
            <h2 className="text-sm sm:text-base font-semibold text-foreground truncate">
              {pageTitle}
            </h2>
          </div>
        )}
      </div>

      {/* Right: Quick Utility & User Profile */}
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="hidden md:flex items-center gap-1.5 py-1 px-3">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="font-medium text-xs">AI Advisory Mode Active</span>
        </Badge>

        <button
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent relative cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-primary absolute top-2 right-2 ring-2 ring-card" />
        </button>

        <NavLink
          to="/profile"
          className="flex items-center gap-2 pl-2 border-l border-border hover:opacity-80 transition-opacity"
          title={`Signed in as ${displayName}`}
        >
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs">
            {initials}
          </div>
          <span className="text-xs font-semibold text-foreground hidden sm:inline truncate max-w-[120px]">
            {displayName}
          </span>
        </NavLink>

        <button
          onClick={handleLogout}
          className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
          title="Sign out of SkillBridge"
          aria-label="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}

export default AppHeader
