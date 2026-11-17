import React from "react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface StatCardProps {
  title: string
  value: string | number
  unit?: string
  subtitle?: string
  icon: React.ComponentType<{ className?: string }>
  trend?: {
    value: string
    isPositive: boolean
  }
  className?: string
  actionLabel?: string
  onAction?: () => void
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  unit,
  subtitle,
  icon: Icon,
  trend,
  className,
  actionLabel,
  onAction,
}) => {
  return (
    <Card className={cn("p-5 shadow-xs hover:border-slate-300 transition-colors", className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
        <div className="p-2 rounded-lg bg-indigo-50 text-primary">
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="text-2xl font-bold tracking-tight text-foreground flex items-baseline gap-1">
        <span>{value}</span>
        {unit && <span className="text-sm font-normal text-muted-foreground">{unit}</span>}
      </div>
      {trend && (
        <div
          className={cn(
            "mt-2 text-xs flex items-center gap-1 font-medium",
            trend.isPositive ? "text-emerald-600" : "text-amber-600"
          )}
        >
          <span>{trend.value}</span>
        </div>
      )}
      {subtitle && !trend && (
        <p className="mt-2 text-xs text-muted-foreground font-medium">{subtitle}</p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-3 text-xs font-medium text-primary hover:underline block text-left"
        >
          {actionLabel} →
        </button>
      )}
    </Card>
  )
}
