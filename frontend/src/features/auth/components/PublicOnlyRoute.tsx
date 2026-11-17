import React from "react"
import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "@/features/auth/hooks/useAuth"
import { Loader2 } from "lucide-react"

export const PublicOnlyRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl shadow-md">
          ⚡
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span>Loading SkillBridge AI...</span>
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    const fromPath = (location.state as { from?: { pathname?: string } })?.from?.pathname || "/dashboard"
    return <Navigate to={fromPath} replace />
  }

  return <Outlet />
}

export default PublicOnlyRoute

