import React from "react"
import { Volume2, Mic, Loader2, CheckCircle2, AlertCircle } from "lucide-react"

export type VoiceStatusState = "idle" | "speaking" | "listening" | "processing" | "error"

export interface VoiceStatusIndicatorProps {
  status: VoiceStatusState
  customMessage?: string
}

export const VoiceStatusIndicator: React.FC<VoiceStatusIndicatorProps> = ({
  status,
  customMessage,
}) => {
  const getBadgeConfig = () => {
    switch (status) {
      case "speaking":
        return {
          icon: <Volume2 className="w-3.5 h-3.5 animate-bounce text-indigo-600" />,
          label: customMessage || "AI Interviewer Speaking...",
          className: "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300",
          dotColor: "bg-indigo-500 animate-ping",
        }
      case "listening":
        return {
          icon: <Mic className="w-3.5 h-3.5 text-red-600 animate-pulse" />,
          label: customMessage || "Recording Spoken Answer...",
          className: "bg-red-50 border-red-200 text-red-700 dark:bg-red-950/40 dark:text-red-300",
          dotColor: "bg-red-500 animate-ping",
        }
      case "processing":
        return {
          icon: <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />,
          label: customMessage || "Transcribing Audio...",
          className: "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
          dotColor: "bg-amber-500 animate-pulse",
        }
      case "error":
        return {
          icon: <AlertCircle className="w-3.5 h-3.5 text-destructive" />,
          label: customMessage || "Voice Service Issue",
          className: "bg-destructive/10 border-destructive/30 text-destructive",
          dotColor: "bg-destructive",
        }
      case "idle":
      default:
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
          label: customMessage || "Voice Ready",
          className: "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
          dotColor: "bg-emerald-500",
        }
    }
  }

  const config = getBadgeConfig()

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold transition-all ${config.className}`}
    >
      <span className={`w-2 h-2 rounded-full ${config.dotColor}`} />
      {config.icon}
      <span>{config.label}</span>
    </div>
  )
}

