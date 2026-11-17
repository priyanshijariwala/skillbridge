import React, { useRef, useEffect } from "react"
import { Menu, Sparkles } from "lucide-react"
import type { ChatMessage, ContextSummary, Conversation } from "@/features/assistant/types/assistant.types"
import { ContextIndicator } from "./ContextIndicator"
import { ChatMessageItem } from "./ChatMessageItem"
import { SuggestedPrompts } from "./SuggestedPrompts"
import { TypingIndicator } from "./TypingIndicator"
import { ChatInput } from "./ChatInput"

interface ChatWindowProps {
  conversation?: Conversation | null
  messages: ChatMessage[]
  streamingText: string
  isStreaming: boolean
  isLoadingMessages: boolean
  contextSummary?: ContextSummary | null
  isLoadingContext: boolean
  onSendMessage: (message: string) => void
  onStopStreaming?: () => void
  onToggleMobileSidebar: () => void
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  messages,
  streamingText,
  isStreaming,
  isLoadingMessages,
  contextSummary,
  isLoadingContext,
  onSendMessage,
  onStopStreaming,
  onToggleMobileSidebar,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (typeof messagesEndRef.current?.scrollIntoView === "function") {
      messagesEndRef.current.scrollIntoView({ behavior })
    }
  }

  useEffect(() => {
    scrollToBottom(isStreaming ? "auto" : "smooth")
  }, [messages, streamingText, isStreaming])

  const hasMessages = messages.length > 0 || !!streamingText

  return (
    <div className="flex flex-col flex-1 h-full min-w-0 bg-background overflow-hidden">
      {/* Top Header */}
      <header className="border-b border-border/60 px-4 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-card/40 backdrop-blur-xs shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-1.5 rounded-lg border border-border/70 text-muted-foreground hover:bg-muted"
            title="Toggle conversations sidebar"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0 hidden sm:flex">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-semibold text-foreground truncate">
                {conversation?.title || "New Career Conversation"}
              </h1>
              <p className="text-[11px] text-muted-foreground truncate hidden sm:block">
                SkillBridge AI Career Copilot
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic Context Summary Indicator */}
        <ContextIndicator summary={contextSummary} isLoading={isLoadingContext} />
      </header>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
        {isLoadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground animate-pulse">
              <Sparkles className="w-6 h-6 text-primary animate-spin" />
              <span>Loading messages...</span>
            </div>
          </div>
        ) : !hasMessages ? (
          <SuggestedPrompts
            onSelectPrompt={onSendMessage}
            disabled={isStreaming}
          />
        ) : (
          <div className="max-w-4xl mx-auto space-y-1">
            {messages.map((msg) => (
              <ChatMessageItem key={msg.id} message={msg} />
            ))}

            {isStreaming && streamingText && (
              <ChatMessageItem
                message={{
                  id: "streaming-message",
                  conversation_id: conversation?.id || "",
                  role: "assistant",
                  content: streamingText,
                }}
                isStreaming={true}
              />
            )}

            {isStreaming && !streamingText && <TypingIndicator />}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Form at Bottom */}
      <ChatInput
        onSendMessage={onSendMessage}
        onStopStreaming={onStopStreaming}
        disabled={isLoadingMessages}
        isStreaming={isStreaming}
      />
    </div>
  )
}
