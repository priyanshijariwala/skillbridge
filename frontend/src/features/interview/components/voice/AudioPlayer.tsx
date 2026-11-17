import React from "react"
import { Volume2, VolumeX, RotateCcw, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AudioWaveform } from "./AudioWaveform"

export interface AudioPlayerProps {
  isPlaying: boolean
  isSynthesizing: boolean
  isMuted: boolean
  label?: string
  onReplay: () => void
  onToggleMute: () => void
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  isPlaying,
  isSynthesizing,
  isMuted,
  label = "Interviewer Question Audio",
  onReplay,
  onToggleMute,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between p-3.5 rounded-xl border border-border bg-card/60 shadow-xs gap-3">
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
          {isSynthesizing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isMuted ? (
            <VolumeX className="w-4 h-4 text-muted-foreground" />
          ) : (
            <Volume2 className={`w-4 h-4 ${isPlaying ? "animate-pulse" : ""}`} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <span className="text-xs font-semibold text-foreground block truncate">
            {isSynthesizing ? "Generating speech..." : label}
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">
            {isMuted
              ? "Audio muted"
              : isPlaying
              ? "Speaking now..."
              : "Audio ready for playback"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        {/* Waveform indicator */}
        <div className="hidden sm:block w-24">
          <AudioWaveform isActive={isPlaying} variant="indigo" barsCount={12} />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onReplay}
          disabled={isSynthesizing}
          title="Replay spoken question"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1" />
          <span>Replay Question</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleMute}
          title={isMuted ? "Unmute audio" : "Mute audio"}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-muted-foreground" />
          ) : (
            <Volume2 className="w-4 h-4 text-foreground" />
          )}
        </Button>
      </div>
    </div>
  )
}

