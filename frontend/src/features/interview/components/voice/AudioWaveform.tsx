import React from "react"

export interface AudioWaveformProps {
  isActive: boolean
  level?: number // 0 to 1
  barsCount?: number
  variant?: "primary" | "emerald" | "indigo"
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  isActive,
  level = 0.5,
  barsCount = 18,
  variant = "primary",
}) => {
  const getBarColor = () => {
    switch (variant) {
      case "emerald":
        return "bg-emerald-500"
      case "indigo":
        return "bg-indigo-600"
      default:
        return "bg-primary"
    }
  }

  return (
    <div className="flex items-center justify-center gap-1 h-8 px-2" aria-hidden="true">
      {Array.from({ length: barsCount }).map((_, index) => {
        // Vary height based on index and active level
        const offset = Math.sin((index / barsCount) * Math.PI)
        const heightMultiplier = isActive ? Math.max(0.2, (level || 0.4) * offset) : 0.15
        const heightPx = Math.round(Math.max(4, heightMultiplier * 32))

        return (
          <span
            key={index}
            className={`w-1 rounded-full transition-all duration-100 ${getBarColor()} ${
              isActive ? "opacity-90 animate-pulse" : "opacity-30"
            }`}
            style={{
              height: `${heightPx}px`,
              animationDelay: `${(index % 4) * 120}ms`,
            }}
          />
        )
      })}
    </div>
  )
}

