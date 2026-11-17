import React, { useState, useRef, useEffect } from "react"
import { Send, StopCircle } from "lucide-react"

interface ChatInputProps {
  onSendMessage: (message: string) => void
  onStopStreaming?: () => void
  disabled?: boolean
  isStreaming?: boolean
  placeholder?: string
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onStopStreaming,
  disabled = false,
  isStreaming = false,
  placeholder = "Ask your AI Career Assistant anything (Shift+Enter for newline)...",
}) => {
  const [text, setText] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        160
      )}px`
    }
  }, [text])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleSubmit = () => {
    const trimmed = text.trim()
    if (!trimmed || disabled || isStreaming) return
    onSendMessage(trimmed)
    setText("")
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }

  return (
    <div className="relative border-t border-border/60 bg-background/95 backdrop-blur-xs p-3 sm:p-4">
      <div className="max-w-4xl mx-auto relative flex items-end gap-2 bg-muted/40 rounded-2xl border border-border/80 p-2 shadow-xs focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/40 transition-all">
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className="flex-1 bg-transparent px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/60 resize-none outline-hidden max-h-40 overflow-y-auto leading-relaxed"
        />

        <div className="flex items-center gap-1 shrink-0 pb-0.5">
          {isStreaming ? (
            <button
              type="button"
              onClick={onStopStreaming}
              className="p-2 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors cursor-pointer shadow-xs"
              title="Stop response"
            >
              <StopCircle className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!text.trim() || disabled}
              className="p-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      <div className="max-w-4xl mx-auto flex items-center justify-between text-[11px] text-muted-foreground/70 px-2 mt-1.5">
        <span>Press <kbd className="px-1 py-0.5 bg-muted rounded border border-border/60">Enter</kbd> to send, <kbd className="px-1 py-0.5 bg-muted rounded border border-border/60">Shift + Enter</kbd> for newline</span>
        <span>Personalized Career AI</span>
      </div>
    </div>
  )
}

