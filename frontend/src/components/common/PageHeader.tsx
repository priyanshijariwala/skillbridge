import React from "react"
import { Badge } from "@/components/ui/badge"

export interface PageHeaderProps {
  title: string
  description?: string
  badge?: {
    label: string
    variant?: "default" | "secondary" | "success" | "warning" | "destructive" | "outline" | "info"
  }
  actions?: React.ReactNode
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  badge,
  actions,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:items-center justify-between gap-4 mb-6">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          {badge && (
            <Badge variant={badge.variant || "default"} className="text-xs whitespace-nowrap shrink-0">
              {badge.label}
            </Badge>
          )}
        </div>
        {description && (
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto">
          {actions}
        </div>
      )}
    </div>
  )
}
