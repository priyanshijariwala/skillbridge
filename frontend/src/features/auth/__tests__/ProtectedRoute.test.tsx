import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import ProtectedRoute from "@/features/auth/components/ProtectedRoute"
import * as useAuthModule from "@/features/auth/hooks/useAuth"

describe("ProtectedRoute", () => {
  it("renders loading state when isLoading is true", () => {
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    })

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>Dashboard Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText(/verifying secure session/i)).toBeInTheDocument()
    expect(screen.queryByText("Dashboard Content")).not.toBeInTheDocument()
  })

  it("redirects unauthenticated user to /login", () => {
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    })

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>Dashboard Content</div>} />
          </Route>
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText("Login Page")).toBeInTheDocument()
    expect(screen.queryByText("Dashboard Content")).not.toBeInTheDocument()
  })

  it("renders protected content when authenticated", () => {
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: { id: "1", name: "Alex Vance", email: "alex@example.com" },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    })

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>Dashboard Content</div>} />
          </Route>
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText("Dashboard Content")).toBeInTheDocument()
    expect(screen.queryByText("Login Page")).not.toBeInTheDocument()
  })
})

