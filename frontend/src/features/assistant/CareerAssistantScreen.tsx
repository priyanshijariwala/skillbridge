import React, { useState, useEffect, useRef } from "react"
import {
  useConversations,
  useMessages,
  useContextSummary,
  useCreateConversation,
  useRenameConversation,
  useDeleteConversation,
} from "./hooks/useAssistant"
import { AssistantSidebar } from "./components/AssistantSidebar"
import { ChatWindow } from "./components/ChatWindow"
import { assistantService } from "@/services/assistant.service"
import type { ChatMessage } from "./types/assistant.types"
import { useQueryClient } from "@tanstack/react-query"
import { ASSISTANT_KEYS } from "./hooks/useAssistant"

export const CareerAssistantScreen: React.FC = () => {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>()
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  // Streaming State
  const [streamingText, setStreamingText] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [optimisticUserMessage, setOptimisticUserMessage] = useState<ChatMessage | null>(null)
  const stopStreamRef = useRef<(() => void) | null>(null)

  // Queries
  const { data: convData, isLoading: isLoadingConvs } = useConversations(searchQuery)
  const { data: messagesData, isLoading: isLoadingMessages } = useMessages(activeConversationId)
  const { data: contextSummary, isLoading: isLoadingContext } = useContextSummary()

  // Mutations
  const createConvMutation = useCreateConversation()
  const renameConvMutation = useRenameConversation()
  const deleteConvMutation = useDeleteConversation()

  const conversations = convData?.items || []
  const activeConversation = conversations.find((c) => c.id === activeConversationId)

  // Auto-select latest conversation on initial load if none selected
  useEffect(() => {
    if (!activeConversationId && conversations.length > 0) {
      setActiveConversationId(conversations[0].id)
    }
  }, [conversations, activeConversationId])

  // Handle New Conversation
  const handleNewConversation = async () => {
    try {
      const newConv = await createConvMutation.mutateAsync({})
      setActiveConversationId(newConv.id)
      setOptimisticUserMessage(null)
      setStreamingText("")
    } catch (err) {
      console.error("Failed to create conversation:", err)
    }
  }

  // Handle Send Message with SSE streaming
  const handleSendMessage = async (text: string) => {
    let targetConvId = activeConversationId

    // If no active conversation exists, create one first
    if (!targetConvId) {
      try {
        const created = await createConvMutation.mutateAsync({})
        targetConvId = created.id
        setActiveConversationId(created.id)
      } catch (err) {
        console.error("Failed to create conversation:", err)
        return
      }
    }

    // Set optimistic user message
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: targetConvId,
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    }
    setOptimisticUserMessage(tempUserMsg)
    setIsStreaming(true)
    setStreamingText("")

    // Initiate SSE stream
    stopStreamRef.current = assistantService.streamMessage(
      targetConvId,
      text,
      (chunk: string) => {
        setStreamingText((prev) => prev + chunk)
      },
      (_messageId?: string) => {
        setIsStreaming(false)
        setStreamingText("")
        setOptimisticUserMessage(null)
        // Refresh conversation messages and conversations list
        queryClient.invalidateQueries({ queryKey: ASSISTANT_KEYS.messages(targetConvId) })
        queryClient.invalidateQueries({ queryKey: [...ASSISTANT_KEYS.all, "conversations"] })
      },
      (err: Error) => {
        console.error("Streaming error:", err)
        setIsStreaming(false)
        setStreamingText("")
        setOptimisticUserMessage(null)
        queryClient.invalidateQueries({ queryKey: ASSISTANT_KEYS.messages(targetConvId) })
      }
    )
  }

  const handleStopStreaming = () => {
    if (stopStreamRef.current) {
      stopStreamRef.current()
      stopStreamRef.current = null
    }
    setIsStreaming(false)
    setStreamingText("")
    setOptimisticUserMessage(null)
  }

  // Handle Rename Conversation
  const handleRenameConversation = (id: string, newTitle: string) => {
    renameConvMutation.mutate({ conversationId: id, title: newTitle })
  }

  // Handle Delete Conversation
  const handleDeleteConversation = async (id: string) => {
    await deleteConvMutation.mutateAsync(id)
    if (activeConversationId === id) {
      const remaining = conversations.filter((c) => c.id !== id)
      setActiveConversationId(remaining.length > 0 ? remaining[0].id : undefined)
    }
  }

  // Combine server messages with any optimistic user message
  const serverMessages = messagesData?.items || []
  const displayMessages = optimisticUserMessage
    ? [...serverMessages, optimisticUserMessage]
    : serverMessages

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-background">
      {/* Sidebar */}
      <AssistantSidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelectConversation={(id) => {
          setActiveConversationId(id)
          setStreamingText("")
          setOptimisticUserMessage(null)
        }}
        onNewConversation={handleNewConversation}
        onRenameConversation={handleRenameConversation}
        onDeleteConversation={handleDeleteConversation}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        isLoading={isLoadingConvs}
      />

      {/* Main Chat Area */}
      <ChatWindow
        conversation={activeConversation}
        messages={displayMessages}
        streamingText={streamingText}
        isStreaming={isStreaming}
        isLoadingMessages={isLoadingMessages && !activeConversationId}
        contextSummary={contextSummary}
        isLoadingContext={isLoadingContext}
        onSendMessage={handleSendMessage}
        onStopStreaming={handleStopStreaming}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
      />
    </div>
  )
}

export default CareerAssistantScreen

