import React, { useState, useEffect } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { AppSidebar } from "@/components/layout/AppSidebar"
import { AppHeader } from "@/components/layout/AppHeader"

const routeTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/resume": "Resume Analysis",
  "/skill-gap": "Skill Gap Analysis",
  "/roadmap": "Learning Roadmap",
  "/interview/setup": "Configure AI Interview",
  "/interview-history": "Interview History",
  "/profile": "Candidate Profile",
  "/settings": "Account Settings",
}

export const AppLayout: React.FC = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const location = useLocation()
  const [prevPathname, setPrevPathname] = useState(location.pathname)
  const mainRef = React.useRef<HTMLElement>(null)

  // Match title from route map or default
  const pageTitle = routeTitles[location.pathname] || "Career Preparation"

  // Automatically reset mobile menu on route changes without cascading effect renders
  if (prevPathname !== location.pathname) {
    setPrevPathname(location.pathname)
    setIsMobileOpen(false)
  }

  // Reset main scroll position when navigating to a new route
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: "instant" })
  }, [location.pathname])

  // Support mouse wheel and trackpad scrolling in mobile emulation / touch device testing
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Allow browser zoom (Ctrl/Cmd + Wheel)
      if (e.ctrlKey || e.metaKey) return

      const mainEl = mainRef.current
      if (!mainEl) return

      // Respect scrolling of focused or hovered internal scrollable elements (e.g. textareas, dropdowns, code blocks)
      const target = e.target as HTMLElement | null
      const scrollable = target?.closest(
        'textarea, select, pre, [data-scrollable="true"]'
      ) as HTMLElement | null

      if (scrollable) return

      // Check if browser native scroll occurs; if suppressed by touch emulation, scroll main container
      const prevY = mainEl.scrollTop
      const delta = e.deltaY

      requestAnimationFrame(() => {
        // If native engine did not scroll the main container and delta is non-zero
        if (mainEl.scrollTop === prevY && Math.abs(delta) > 0) {
          const maxScroll = Math.max(0, mainEl.scrollHeight - mainEl.clientHeight)
          const targetY = Math.max(0, Math.min(maxScroll, prevY + delta))
          if (targetY !== prevY) {
            mainEl.scrollTo({ top: targetY, behavior: "auto" })
          }
        }
      })
    }

    window.addEventListener("wheel", handleWheel, { passive: true })
    return () => window.removeEventListener("wheel", handleWheel)
  }, [])

  return (
    <div className="h-screen h-[100dvh] flex overflow-hidden bg-background text-foreground">
      <AppSidebar
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <AppHeader
          pageTitle={pageTitle}
          onMenuClick={() => setIsMobileOpen(true)}
        />
        <main
          ref={mainRef}
          className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8"
        >
          <div className="max-w-7xl w-full mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default AppLayout
