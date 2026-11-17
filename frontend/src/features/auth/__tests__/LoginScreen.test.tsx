import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { MemoryRouter } from "react-router-dom"
import { LoginScreen } from "@/features/auth/LoginScreen"
import * as useAuthModule from "@/features/auth/hooks/useAuth"

const mockNavigate = vi.fn()
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom")
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe("LoginScreen", () => {
  const mockLogin = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: mockLogin,
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    })
  })

  it("validates empty email and password", async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <LoginScreen />
      </MemoryRouter>
    )

    await user.click(screen.getByRole("button", { name: /sign in/i }))

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument()
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument()
  })

  it("handles successful login and navigation", async () => {
    mockLogin.mockResolvedValueOnce({
      id: "user-123",
      name: "Alex Vance",
      email: "alex@example.com",
    })

    const user = userEvent.setup()
    const { container } = render(
      <MemoryRouter>
        <LoginScreen />
      </MemoryRouter>
    )

    const emailInput = container.querySelector("#email") as HTMLInputElement
    const passwordInput = container.querySelector("#password") as HTMLInputElement

    await user.type(emailInput, "alex@example.com")
    await user.type(passwordInput, "Password123!")

    await user.click(screen.getByRole("button", { name: /sign in/i }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: "alex@example.com",
        password: "Password123!",
      })
    })

    expect(mockNavigate).toHaveBeenCalledWith("/dashboard", { replace: true })
  })

  it("displays invalid credentials error", async () => {
    mockLogin.mockRejectedValueOnce(new Error("Invalid email or password."))

    const user = userEvent.setup()
    const { container } = render(
      <MemoryRouter>
        <LoginScreen />
      </MemoryRouter>
    )

    const emailInput = container.querySelector("#email") as HTMLInputElement
    const passwordInput = container.querySelector("#password") as HTMLInputElement

    await user.type(emailInput, "alex@example.com")
    await user.type(passwordInput, "WrongPassword123!")

    await user.click(screen.getByRole("button", { name: /sign in/i }))

    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent(/invalid email or password/i)
  })

  it("displays network error message when server is unreachable", async () => {
    mockLogin.mockRejectedValueOnce(
      new Error("Network error: Unable to connect to SkillBridge server.")
    )

    const user = userEvent.setup()
    const { container } = render(
      <MemoryRouter>
        <LoginScreen />
      </MemoryRouter>
    )

    const emailInput = container.querySelector("#email") as HTMLInputElement
    const passwordInput = container.querySelector("#password") as HTMLInputElement

    await user.type(emailInput, "alex@example.com")
    await user.type(passwordInput, "Password123!")

    await user.click(screen.getByRole("button", { name: /sign in/i }))

    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent(/unable to connect to skillbridge server/i)
  })
})
