import React from "react"
import { cn } from "@/lib/utils"

export interface LoadingSkeletonProps {
  variant?: "card" | "stat" | "text" | "table-row"
  count?: number
  className?: string
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = "card",
  count = 1,
  className,
}) => {
  const items = Array.from({ length: count }, (_, i) => i)

  return (
    <div className={cn("space-y-4", className)}>
      {items.map((key) => {
        if (variant === "stat") {
          return (
            <div key={key} className="p-5 rounded-xl border border-border bg-card animate-pulse space-y-3">
              <div className="h-4 bg-muted rounded w-1/3" />
              <div className="h-8 bg-muted rounded w-1/2" />
              <div className="h-3 bg-muted rounded w-2/3" />
            </div>
          )
        }
        if (variant === "table-row") {
          return (
            <div key={key} className="h-12 w-full bg-muted/60 animate-pulse rounded-lg" />
          )
        }
        if (variant === "text") {
          return (
            <div key={key} className="space-y-2 animate-pulse">
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-5/6" />
            </div>
          )
        }
        return (
          <div key={key} className="p-6 rounded-2xl border border-border bg-card animate-pulse space-y-4">
            <div className="h-5 bg-muted rounded w-1/4" />
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-20 bg-muted/50 rounded-xl" />
          </div>
        )
      })}
    </div>
  )
}
