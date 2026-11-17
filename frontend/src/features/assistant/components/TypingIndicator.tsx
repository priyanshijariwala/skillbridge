import React from "react"
import { Bot } from "lucide-react"

export const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-start gap-3 my-2" data-testid="typing-indicator">
      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
        <Bot className="w-4 h-4" />
      </div>
      <div className="bg-muted/60 border border-border/50 rounded-2xl rounded-tl-sm px-4 py-3 shadow-xs">
        <div className="flex items-center gap-1.5 h-4">
          <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.3s]" />
          <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.15s]" />
          <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" />
          <span className="text-xs text-muted-foreground ml-2">Thinking...</span>
        </div>
      </div>
    </div>
  )
}

