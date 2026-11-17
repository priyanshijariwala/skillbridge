import React from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"

export interface ZenInterviewHeaderProps {
  roleTitle: string
  currentQuestion: number
  totalQuestions: number
  followUpIndex?: number
  maxFollowUps?: number
  elapsedMinutes?: number
  onExit?: () => void
}

export const ZenInterviewHeader: React.FC<ZenInterviewHeaderProps> = ({
  roleTitle,
  currentQuestion,
  totalQuestions,
  followUpIndex = 0,
  elapsedMinutes = 14,
  onExit,
}) => {
  const navigate = useNavigate()

  const handleExit = () => {
    if (onExit) {
      onExit()
    } else {
      if (window.confirm("Exit interview session? Unfinished questions will not be evaluated.")) {
        navigate("/dashboard")
      }
    }
  }

  return (
    <header className="h-16 px-3 sm:px-8 bg-card border-b border-border sticky top-0 z-30 flex items-center justify-between gap-2 sm:gap-4">
      {/* Session Title */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
        <div className="min-w-0">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-primary truncate block">
            <span className="hidden sm:inline">Active Technical </span>Interview
          </span>
          <h2 className="text-xs sm:text-sm font-bold text-foreground truncate max-w-[110px] sm:max-w-none">
            {roleTitle}
          </h2>
        </div>
      </div>

      {/* Progress & Tracker Pill */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 bg-secondary/80 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl border border-border text-[11px] sm:text-xs whitespace-nowrap shrink-0">
        <span className="font-semibold text-foreground">
          Q{currentQuestion}/{totalQuestions}
        </span>
        {followUpIndex > 0 && (
          <>
            <span className="text-muted-foreground">•</span>
            <span className="text-primary font-semibold bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 text-[10px] sm:text-xs">
              Follow-up {followUpIndex}
            </span>
          </>
        )}
        <span className="text-muted-foreground hidden md:inline">•</span>
        <span className="font-mono text-muted-foreground hidden md:inline">
          ⏱ {elapsedMinutes}:22
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center shrink-0">
        <Button variant="outline" size="sm" onClick={handleExit} className="h-8 px-2.5 sm:px-3 text-xs">
          <span className="hidden sm:inline">Exit Session</span>
          <span className="sm:hidden">Exit</span>
        </Button>
      </div>
    </header>
  )
}
