import React from "react"
import { CheckCircle2, AlertCircle, FileText, Compass, Milestone, Bot, User } from "lucide-react"
import type { ContextSummary } from "@/features/assistant/types/assistant.types"

interface ContextIndicatorProps {
  summary?: ContextSummary | null
  isLoading?: boolean
}

export const ContextIndicator: React.FC<ContextIndicatorProps> = ({ summary, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse py-1">
        <span>Loading career context...</span>
      </div>
    )
  }

  const items = [
    {
      label: summary?.user_name ? `Profile (${summary.user_name})` : "Profile",
      active: summary?.profile_available,
      icon: User,
    },
    {
      label: "Resume",
      active: summary?.resume_available,
      icon: FileText,
    },
    {
      label: "Skill Gap",
      active: summary?.skill_gap_available,
      icon: Compass,
    },
    {
      label: "Roadmap",
      active: summary?.roadmap_available,
      icon: Milestone,
    },
    {
      label: "Interviews",
      active: summary?.interview_available,
      icon: Bot,
    },
  ]

  return (
    <div className="flex flex-wrap items-center gap-1.5 py-1 px-2 bg-muted/40 rounded-lg border border-border/50 text-xs">
      <span className="font-medium text-foreground/80 mr-1 flex items-center gap-1">
        Target:
        <span className="text-primary font-semibold truncate max-w-[140px] sm:max-w-[200px]">
          {summary?.target_role || "Software Engineer"}
        </span>
      </span>

      <span className="text-border">|</span>

      <div className="flex items-center gap-1.5 flex-wrap">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <span
              key={item.label}
              title={item.active ? `${item.label} context linked` : `${item.label} not yet available`}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                item.active
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                  : "bg-muted text-muted-foreground/60 border border-transparent"
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{item.label}</span>
              {item.active ? (
                <CheckCircle2 className="w-2.5 h-2.5 ml-0.5 text-emerald-500" />
              ) : (
                <AlertCircle className="w-2.5 h-2.5 ml-0.5 text-muted-foreground/40" />
              )}
            </span>
          )
        })}
      </div>
    </div>
  )
}

