import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { MemoryRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ProfileScreen } from "@/features/profile/ProfileScreen"
import * as useAuthModule from "@/features/auth/hooks/useAuth"
import * as useProfileModule from "@/features/profile/hooks/useProfile"

// Mock react-router navigate
const mockNavigate = vi.fn()
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom")
  return { ...actual, useNavigate: () => mockNavigate }
})

const mockProfile = {
  id: "prof_1",
  user_id: "user_1",
  full_name: "Alex Vance",
  email: "alex@example.com",
  headline: "Backend Engineer",
  bio: "Loves scalable systems.",
  target_role_title: "Senior Backend Engineer",
  target_seniority: "Senior",
  years_of_experience: 5,
  skills: ["Python", "FastAPI"],
  education: [],
  linkedin_url: null,
  github_url: null,
  portfolio_url: null,
  created_at: null,
  updated_at: null,
}

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

describe("ProfileScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: { id: "user_1", name: "Alex Vance", email: "alex@example.com" },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    })
  })

  it("shows loading state while profile is fetching", () => {
    vi.spyOn(useProfileModule, "useGetProfile").mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as unknown as ReturnType<typeof useProfileModule.useGetProfile>)
    vi.spyOn(useProfileModule, "useUpdateProfile").mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useProfileModule.useUpdateProfile>)

    render(<ProfileScreen />, { wrapper: makeWrapper() })
    expect(screen.getByText(/loading profile/i)).toBeInTheDocument()
  })

  it("shows error state when profile fails to load", () => {
    vi.spyOn(useProfileModule, "useGetProfile").mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as unknown as ReturnType<typeof useProfileModule.useGetProfile>)
    vi.spyOn(useProfileModule, "useUpdateProfile").mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useProfileModule.useUpdateProfile>)

    render(<ProfileScreen />, { wrapper: makeWrapper() })
    expect(screen.getByText(/failed to load/i)).toBeInTheDocument()
  })

  it("renders profile data when loaded", async () => {
    vi.spyOn(useProfileModule, "useGetProfile").mockReturnValue({
      data: mockProfile,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useProfileModule.useGetProfile>)
    vi.spyOn(useProfileModule, "useUpdateProfile").mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useProfileModule.useUpdateProfile>)

    render(<ProfileScreen />, { wrapper: makeWrapper() })
    await waitFor(() => {
      expect(screen.getByDisplayValue("Alex Vance")).toBeInTheDocument()
    })
    // Email is read-only
    expect(screen.getByDisplayValue("alex@example.com")).toBeInTheDocument()
    // Skills are shown
    expect(screen.getByText("Python")).toBeInTheDocument()
    expect(screen.getByText("FastAPI")).toBeInTheDocument()
  })

  it("calls updateProfile on submit with form values", async () => {
    const mockMutateAsync = vi.fn().mockResolvedValue(mockProfile)
    vi.spyOn(useProfileModule, "useGetProfile").mockReturnValue({
      data: mockProfile,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useProfileModule.useGetProfile>)
    vi.spyOn(useProfileModule, "useUpdateProfile").mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useProfileModule.useUpdateProfile>)

    const user = userEvent.setup()
    render(<ProfileScreen />, { wrapper: makeWrapper() })

    await waitFor(() =>
      expect(screen.getByDisplayValue("Alex Vance")).toBeInTheDocument()
    )

    await user.click(screen.getByRole("button", { name: /save profile/i }))
    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalled())
  })

  it("validates full_name minimum length", async () => {
    vi.spyOn(useProfileModule, "useGetProfile").mockReturnValue({
      data: mockProfile,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useProfileModule.useGetProfile>)
    vi.spyOn(useProfileModule, "useUpdateProfile").mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useProfileModule.useUpdateProfile>)

    const user = userEvent.setup()
    render(<ProfileScreen />, { wrapper: makeWrapper() })

    await waitFor(() => screen.getByDisplayValue("Alex Vance"))

    const nameInput = screen.getByDisplayValue("Alex Vance")
    await user.clear(nameInput)
    await user.type(nameInput, "A")
    await user.click(screen.getByRole("button", { name: /save profile/i }))

    await waitFor(() =>
      expect(screen.getByText(/at least 2 characters/i)).toBeInTheDocument()
    )
  })
})

