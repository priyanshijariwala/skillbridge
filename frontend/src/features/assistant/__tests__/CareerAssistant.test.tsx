import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { MemoryRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { CareerAssistantScreen } from "@/features/assistant/CareerAssistantScreen"
import * as useAssistantModule from "@/features/assistant/hooks/useAssistant"
import { assistantService } from "@/services/assistant.service"
import type {
  Conversation,
  ChatMessage,
  ContextSummary,
} from "@/features/assistant/types/assistant.types"

vi.mock("@/services/assistant.service", () => ({
  assistantService: {
    listConversations: vi.fn(),
    createConversation: vi.fn(),
    getConversation: vi.fn(),
    renameConversation: vi.fn(),
    deleteConversation: vi.fn(),
    listMessages: vi.fn(),
    sendMessage: vi.fn(),
    getContextSummary: vi.fn(),
    streamMessage: vi.fn(),
  },
}))

const mockConversations: Conversation[] = [
  {
    id: "conv-1",
    user_id: "user-123",
    title: "Backend Prep Discussion",
    status: "active",
    created_at: "2026-11-17T10:00:00Z",
    last_message_at: "2026-11-17T10:05:00Z",
  },
  {
    id: "conv-2",
    user_id: "user-123",
    title: "Resume Optimization",
    status: "active",
    created_at: "2026-11-17T09:00:00Z",
    last_message_at: "2026-11-17T09:15:00Z",
  },
]

const mockMessages: ChatMessage[] = [
  {
    id: "msg-1",
    conversation_id: "conv-1",
    role: "user",
    content: "What skills should I prioritize?",
    created_at: "2026-11-17T10:01:00Z",
  },
  {
    id: "msg-2",
    conversation_id: "conv-1",
    role: "assistant",
    content: "Focus on Docker containerization and FastAPI asynchronous routing.",
    created_at: "2026-11-17T10:01:05Z",
    context_metadata: {
      sources_included: ["skill_gap", "roadmap"],
      model: "mock-career-assistant-v1",
    },
  },
]

const mockContextSummary: ContextSummary = {
  profile_available: true,
  resume_available: true,
  skill_gap_available: true,
  roadmap_available: true,
  interview_available: true,
  target_role: "Senior Backend Engineer",
  user_name: "Jane Dev",
}

function renderComponent() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <CareerAssistantScreen />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe("CareerAssistantScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    vi.spyOn(useAssistantModule, "useConversations").mockReturnValue({
      data: {
        items: mockConversations,
        total: 2,
        page: 1,
        page_size: 20,
      },
      isLoading: false,
    } as any)

    vi.spyOn(useAssistantModule, "useMessages").mockReturnValue({
      data: {
        items: mockMessages,
        total: 2,
        conversation_id: "conv-1",
      },
      isLoading: false,
    } as any)

    vi.spyOn(useAssistantModule, "useContextSummary").mockReturnValue({
      data: mockContextSummary,
      isLoading: false,
    } as any)
  })

  it("renders the sidebar with conversation list and context indicator", () => {
    renderComponent()

    expect(screen.getByText("Career Conversations")).toBeInTheDocument()
    expect(screen.getAllByText("Backend Prep Discussion").length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText("Resume Optimization")).toBeInTheDocument()
    expect(screen.getByText("Senior Backend Engineer")).toBeInTheDocument()
    expect(screen.getByText("Resume")).toBeInTheDocument()
    expect(screen.getByText("Skill Gap")).toBeInTheDocument()
    expect(screen.getByText("Roadmap")).toBeInTheDocument()
  })

  it("renders messages in the active conversation", () => {
    renderComponent()

    expect(screen.getByText("What skills should I prioritize?")).toBeInTheDocument()
    expect(
      screen.getByText("Focus on Docker containerization and FastAPI asynchronous routing.")
    ).toBeInTheDocument()
    expect(screen.getByText("Grounded in your data")).toBeInTheDocument()
  })

  it("displays suggested prompt cards when message list is empty", () => {
    vi.spyOn(useAssistantModule, "useMessages").mockReturnValue({
      data: { items: [], total: 0, conversation_id: "conv-empty" },
      isLoading: false,
    } as any)

    renderComponent()

    expect(screen.getByText("How can I help you today?")).toBeInTheDocument()
    expect(screen.getByText("Analyze Skill Gaps")).toBeInTheDocument()
    expect(screen.getByText("Portfolio Project Idea")).toBeInTheDocument()
    expect(screen.getByText("Mock Interview Strategy")).toBeInTheDocument()
  })

  it("allows typing and sending a new message", () => {
    renderComponent()

    const textarea = screen.getByPlaceholderText(
      "Ask your AI Career Assistant anything (Shift+Enter for newline)..."
    )
    fireEvent.change(textarea, { target: { value: "Tell me about microservices" } })
    expect(textarea).toHaveValue("Tell me about microservices")

    const sendBtn = screen.getByTitle("Send message")
    expect(sendBtn).not.toBeDisabled()
    fireEvent.click(sendBtn)

    expect(assistantService.streamMessage).toHaveBeenCalled()
  })

  it("supports clicking a suggested prompt card to trigger message stream", () => {
    vi.spyOn(useAssistantModule, "useMessages").mockReturnValue({
      data: { items: [], total: 0, conversation_id: "conv-empty" },
      isLoading: false,
    } as any)

    renderComponent()

    const skillGapCard = screen.getByText("Analyze Skill Gaps")
    fireEvent.click(skillGapCard)

    expect(assistantService.streamMessage).toHaveBeenCalledWith(
      expect.any(String),
      "How should I prioritize my missing skills to prepare for my target job role?",
      expect.any(Function),
      expect.any(Function),
      expect.any(Function)
    )
  })
})
