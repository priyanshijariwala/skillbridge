import React, { useState } from "react"
import { Bot, User, Copy, Check, Sparkles } from "lucide-react"
import type { ChatMessage } from "@/features/assistant/types/assistant.types"

interface ChatMessageItemProps {
  message: ChatMessage
  isStreaming?: boolean
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message, isStreaming }) => {
  const [copied, setCopied] = useState(false)
  const isAssistant = message.role === "assistant"

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatTimestamp = (dateStr?: string) => {
    if (!dateStr) return ""
    try {
      const date = new Date(dateStr)
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } catch {
      return ""
    }
  }

  const sources = message.context_metadata?.sources_included as string[] | undefined

  return (
    <div
      className={`flex items-start gap-3 my-4 group ${
        isAssistant ? "justify-start" : "justify-end"
      }`}
    >
      {isAssistant && (
        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20 shadow-xs">
          <Bot className="w-4 h-4" />
        </div>
      )}

      <div
        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 shadow-xs transition-colors ${
          isAssistant
            ? "bg-muted/70 text-foreground border border-border/60 rounded-tl-sm"
            : "bg-primary text-primary-foreground rounded-tr-sm"
        }`}
      >
        {isAssistant && (
          <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-border/30 text-xs">
            <div className="flex items-center gap-1.5 font-medium text-foreground/80">
              <Sparkles className="w-3 h-3 text-primary" />
              <span>SkillBridge Assistant</span>
            </div>
            <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={handleCopy}
                title="Copy response"
                className="p-1 rounded hover:bg-background/40 transition-colors cursor-pointer"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>
        )}

        <div className="text-sm whitespace-pre-wrap leading-relaxed select-text font-normal break-words">
          {message.content}
          {isStreaming && (
            <span className="inline-block w-1.5 h-4 ml-1 bg-primary animate-pulse align-middle" />
          )}
        </div>

        <div
          className={`flex items-center justify-between gap-2 mt-2 pt-1 text-[11px] ${
            isAssistant ? "text-muted-foreground" : "text-primary-foreground/75"
          }`}
        >
          {isAssistant && sources && sources.length > 0 ? (
            <span className="inline-flex items-center gap-1 text-[10px] bg-background/50 px-1.5 py-0.5 rounded border border-border/30">
              <Sparkles className="w-2.5 h-2.5 text-primary" />
              <span>Grounded in your data</span>
            </span>
          ) : (
            <span />
          )}

          {message.created_at && (
            <span className="text-[10px]">{formatTimestamp(message.created_at)}</span>
          )}
        </div>
      </div>

      {!isAssistant && (
        <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center shrink-0 border border-border/60 shadow-xs">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  )
}

