import React from "react"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface ErrorAlertProps {
  title?: string
  message: string
  onRetry?: () => void
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  title = "Something went wrong",
  message,
  onRetry,
}) => {
  return (
    <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive flex items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-sm">{title}</h4>
          <p className="text-xs opacity-90 mt-0.5">{message}</p>
        </div>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="bg-background text-foreground shrink-0">
          Try Again
        </Button>
      )}
    </div>
  )
}
