import React from "react"
import { Mic, Square, X, Radio } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AudioWaveform } from "./AudioWaveform"

export interface VoiceRecorderProps {
  isRecording: boolean
  durationSeconds: number
  audioLevel?: number
  disabled?: boolean
  onStartRecording: () => void
  onStopRecording: () => void
  onCancelRecording: () => void
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  isRecording,
  durationSeconds,
  audioLevel = 0.5,
  disabled = false,
  onStartRecording,
  onStopRecording,
  onCancelRecording,
}) => {
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60)
    const remainingSecs = secs % 60
    return `${String(mins).padStart(2, "0")}:${String(remainingSecs).padStart(2, "0")}`
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-secondary/30 rounded-2xl border border-border space-y-4">
      {/* Live Waveform when recording */}
      <div className="w-full max-w-xs">
        <AudioWaveform
          isActive={isRecording}
          level={audioLevel}
          variant={isRecording ? "emerald" : "primary"}
        />
      </div>

      {/* Recording Status & Timer */}
      <div className="flex items-center gap-2">
        {isRecording && (
          <span className="flex items-center gap-1.5 text-xs font-bold text-red-600 font-mono">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            LIVE
          </span>
        )}
        <span className="font-mono text-xl font-bold text-foreground">
          {formatTime(durationSeconds)}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {!isRecording ? (
          <Button
            size="lg"
            className="rounded-full px-6 py-6 shadow-md transition-all hover:scale-105"
            onClick={onStartRecording}
            disabled={disabled}
          >
            <Mic className="w-5 h-5 mr-2" />
            <span>Record Your Answer</span>
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={onCancelRecording}
            >
              <X className="w-4 h-4 mr-1 text-muted-foreground" />
              <span>Discard</span>
            </Button>

            <Button
              variant="destructive"
              size="lg"
              className="rounded-full px-6 py-6 shadow-md animate-pulse"
              onClick={onStopRecording}
            >
              <Square className="w-4 h-4 mr-2 fill-current" />
              <span>Done Speaking</span>
            </Button>
          </>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center max-w-sm">
        {isRecording
          ? "Speak clearly. When you finish, click Done to transcribe and review your answer."
          : "Click Record to deliver your spoken technical explanation."}
      </p>
    </div>
  )
}

