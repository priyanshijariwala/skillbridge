import React, { useState } from "react"
import {
  Plus,
  Search,
  MessageSquare,
  Edit2,
  Trash2,
  Check,
  X,
  Sparkles,
} from "lucide-react"
import type { Conversation } from "@/features/assistant/types/assistant.types"

interface AssistantSidebarProps {
  conversations: Conversation[]
  activeConversationId?: string
  searchQuery: string
  onSearchChange: (query: string) => void
  onSelectConversation: (id: string) => void
  onNewConversation: () => void
  onRenameConversation: (id: string, newTitle: string) => void
  onDeleteConversation: (id: string) => void
  isOpenMobile?: boolean
  onCloseMobile?: () => void
  isLoading?: boolean
}

export const AssistantSidebar: React.FC<AssistantSidebarProps> = ({
  conversations,
  activeConversationId,
  searchQuery,
  onSearchChange,
  onSelectConversation,
  onNewConversation,
  onRenameConversation,
  onDeleteConversation,
  isOpenMobile,
  onCloseMobile,
  isLoading,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")

  const handleStartEdit = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingId(conv.id)
    setEditTitle(conv.title)
  }

  const handleSaveEdit = (convId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (editTitle.trim()) {
      onRenameConversation(convId, editTitle.trim())
    }
    setEditingId(null)
  }

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingId(null)
  }

  const handleDelete = (convId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.confirm("Are you sure you want to delete this conversation?")) {
      onDeleteConversation(convId)
    }
  }

  const sidebarContent = (
    <div className="flex flex-col h-full bg-card/60 backdrop-blur-md border-r border-border/70 w-72 lg:w-80 select-none">
      {/* Top Header */}
      <div className="p-3 sm:p-4 border-b border-border/60">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="font-semibold text-sm tracking-tight text-foreground">
              Career Conversations
            </h2>
          </div>
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden p-1 rounded-md text-muted-foreground hover:bg-muted"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* New Chat Button */}
        <button
          type="button"
          onClick={() => {
            onNewConversation()
            if (onCloseMobile) onCloseMobile()
          }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/95 transition-colors cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>New Chat</span>
        </button>

        {/* Search Bar */}
        <div className="relative mt-3">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-muted/50 border border-border/60 rounded-lg text-foreground placeholder:text-muted-foreground/60 outline-hidden focus:border-primary/60 focus:bg-background transition-all"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isLoading ? (
          <div className="p-4 text-center text-xs text-muted-foreground animate-pulse">
            Loading chats...
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground">
            {searchQuery ? "No conversations match your search." : "No conversations yet. Start a new chat!"}
          </div>
        ) : (
          conversations.map((conv) => {
            const isActive = conv.id === activeConversationId
            const isEditing = editingId === conv.id

            return (
              <div
                key={conv.id}
                onClick={() => {
                  if (!isEditing) {
                    onSelectConversation(conv.id)
                    if (onCloseMobile) onCloseMobile()
                  }
                }}
                className={`group relative flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/20 shadow-xs"
                    : "text-foreground/80 hover:bg-muted/70 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <MessageSquare
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? "text-primary" : "text-muted-foreground/70"
                    }`}
                  />
                  {isEditing ? (
                    <input
                      type="text"
                      autoFocus
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit(conv.id, e as unknown as React.MouseEvent)
                        if (e.key === "Escape") handleCancelEdit(e as unknown as React.MouseEvent)
                      }}
                      className="flex-1 bg-background border border-primary px-1.5 py-0.5 rounded text-xs text-foreground outline-hidden"
                    />
                  ) : (
                    <span className="truncate text-left">{conv.title}</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={(e) => handleSaveEdit(conv.id, e)}
                        className="p-1 hover:text-emerald-500 rounded"
                        title="Save"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="p-1 hover:text-destructive rounded"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={(e) => handleStartEdit(conv, e)}
                        className="p-1 text-muted-foreground hover:text-foreground rounded"
                        title="Rename"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(conv.id, e)}
                        className="p-1 text-muted-foreground hover:text-destructive rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block shrink-0 h-full">{sidebarContent}</aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 h-full flex flex-col">{sidebarContent}</div>
        </div>
      )}
    </>
  )
}

