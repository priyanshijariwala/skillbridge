import React from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type SkillStatus = "verified" | "partial" | "gap" | "critical_gap" | "neutral"

export interface SkillBadgeProps {
  name: string
  status?: SkillStatus
  category?: string
  className?: string
  onClick?: () => void
}

export const SkillBadge: React.FC<SkillBadgeProps> = ({
  name,
  status = "neutral",
  category,
  className,
  onClick,
}) => {
  const getVariant = () => {
    switch (status) {
      case "verified":
        return "success"
      case "partial":
        return "warning"
      case "critical_gap":
        return "destructive"
      case "gap":
        return "warning"
      default:
        return "secondary"
    }
  }

  const getStatusSymbol = () => {
    switch (status) {
      case "verified":
        return " ✓"
      case "critical_gap":
        return " ⚠️"
      case "partial":
        return " (Partial)"
      default:
        return ""
    }
  }

  return (
    <Badge
      variant={getVariant()}
      onClick={onClick}
      className={cn(
        "cursor-default transition-all text-xs py-1 px-2.5",
        onClick && "cursor-pointer hover:opacity-80 active:scale-95",
        className
      )}
    >
      {name}
      {getStatusSymbol()}
      {category && <span className="ml-1 opacity-60 text-[10px] uppercase font-mono">[{category}]</span>}
    </Badge>
  )
}
