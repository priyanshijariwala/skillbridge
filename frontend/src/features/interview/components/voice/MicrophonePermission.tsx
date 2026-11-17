import React from "react"
import { MicOff, AlertCircle, ShieldAlert, FileText, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { MicrophonePermissionStatus } from "@/features/interview/hooks/useAudioRecorder"

export interface MicrophonePermissionProps {
  status: MicrophonePermissionStatus
  errorMessage?: string | null
  onRequestPermission: () => void
  onSwitchToTextMode: () => void
}

export const MicrophonePermission: React.FC<MicrophonePermissionProps> = ({
  status,
  errorMessage,
  onRequestPermission,
  onSwitchToTextMode,
}) => {
  if (status === "granted") return null

  const isDenied = status === "denied"
  const isUnsupported = status === "unsupported"

  return (
    <Card className="p-6 border-amber-200 bg-amber-50/40 dark:bg-amber-950/20 shadow-xs space-y-4">
      <div className="flex items-start gap-3">
        {isDenied ? (
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        ) : isUnsupported ? (
          <MicOff className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
        ) : (
          <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        )}

        <div className="space-y-1">
          <h4 className="text-sm font-bold text-foreground">
            {isDenied
              ? "Microphone Access Required for Voice Mode"
              : isUnsupported
              ? "Audio Recording Unsupported"
              : "Microphone Access Needed"}
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {errorMessage ||
              (isDenied
                ? "Your browser or device has blocked microphone access. Click the lock or camera/mic icon in your browser address bar to allow microphone access, then retry."
                : isUnsupported
                ? "Your browser does not support the Web MediaRecorder API. You can continue seamlessly in text mode without losing any progress."
                : "Voice interview mode records your spoken technical answers and transcribes them in real time.")}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        {!isUnsupported && (
          <Button size="sm" onClick={onRequestPermission}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            <span>Enable Microphone</span>
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={onSwitchToTextMode}>
          <FileText className="w-3.5 h-3.5 mr-1.5" />
          <span>Switch to Text Practice Mode</span>
        </Button>
      </div>
    </Card>
  )
}

