import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { MemoryRouter } from "react-router-dom"
import { RegisterScreen } from "@/features/auth/RegisterScreen"
import * as useAuthModule from "@/features/auth/hooks/useAuth"

describe("RegisterScreen", () => {
  const mockRegister = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      register: mockRegister,
      logout: vi.fn(),
      refreshUser: vi.fn(),
    })
  })

  it("validates empty fields on submission", async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <RegisterScreen />
      </MemoryRouter>
    )

    const submitBtn = screen.getByRole("button", { name: /create account/i })
    await user.click(submitBtn)

    expect(await screen.findByText(/full name must be at least 2 characters/i)).toBeInTheDocument()
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument()
    expect(await screen.findByText(/password must be at least 8 characters/i)).toBeInTheDocument()
    expect(await screen.findByText(/please confirm your password/i)).toBeInTheDocument()
  })

  it("validates mismatched passwords", async () => {
    const user = userEvent.setup()
    const { container } = render(
      <MemoryRouter>
        <RegisterScreen />
      </MemoryRouter>
    )

    const nameInput = container.querySelector("#name") as HTMLInputElement
    const emailInput = container.querySelector("#email") as HTMLInputElement
    const passwordInput = container.querySelector("#password") as HTMLInputElement
    const confirmPasswordInput = container.querySelector("#confirmPassword") as HTMLInputElement

    await user.type(nameInput, "Alex Vance")
    await user.type(emailInput, "alex@example.com")
    await user.type(passwordInput, "Password123!")
    await user.type(confirmPasswordInput, "DifferentPass123!")

    await user.click(screen.getByRole("button", { name: /create account/i }))

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument()
  })

  it("handles successful registration", async () => {
    mockRegister.mockResolvedValueOnce({
      id: "user-123",
      name: "Alex Vance",
      email: "alex@example.com",
    })

    const user = userEvent.setup()
    const { container } = render(
      <MemoryRouter>
        <RegisterScreen />
      </MemoryRouter>
    )

    const nameInput = container.querySelector("#name") as HTMLInputElement
    const emailInput = container.querySelector("#email") as HTMLInputElement
    const passwordInput = container.querySelector("#password") as HTMLInputElement
    const confirmPasswordInput = container.querySelector("#confirmPassword") as HTMLInputElement

    await user.type(nameInput, "Alex Vance")
    await user.type(emailInput, "alex@example.com")
    await user.type(passwordInput, "Password123!")
    await user.type(confirmPasswordInput, "Password123!")

    await user.click(screen.getByRole("button", { name: /create account/i }))

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        name: "Alex Vance",
        email: "alex@example.com",
        password: "Password123!",
        confirmPassword: "Password123!",
      })
    })

    expect(
      await screen.findByText(/account created successfully! redirecting to login/i)
    ).toBeInTheDocument()
  })

  it("displays duplicate email error from API gracefully", async () => {
    mockRegister.mockRejectedValueOnce(
      new Error("A user with this email already exists.")
    )

    const user = userEvent.setup()
    const { container } = render(
      <MemoryRouter>
        <RegisterScreen />
      </MemoryRouter>
    )

    const nameInput = container.querySelector("#name") as HTMLInputElement
    const emailInput = container.querySelector("#email") as HTMLInputElement
    const passwordInput = container.querySelector("#password") as HTMLInputElement
    const confirmPasswordInput = container.querySelector("#confirmPassword") as HTMLInputElement

    await user.type(nameInput, "Alex Vance")
    await user.type(emailInput, "existing@example.com")
    await user.type(passwordInput, "Password123!")
    await user.type(confirmPasswordInput, "Password123!")

    await user.click(screen.getByRole("button", { name: /create account/i }))

    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent(/a user with this email already exists/i)
  })
})
