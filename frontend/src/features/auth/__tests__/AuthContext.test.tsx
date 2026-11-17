import { renderHook, act, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import React from "react"
import { AuthProvider, useAuth } from "@/features/auth/context/AuthContext"
import { authService } from "@/services/auth.service"

vi.mock("@/services/auth.service", () => ({
  authService: {
    refreshToken: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    getMe: vi.fn(),
  },
}))

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("initializes as unauthenticated when refresh fails on mount", async () => {
    vi.mocked(authService.refreshToken).mockRejectedValueOnce(new Error("No cookie"))

    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <AuthProvider>{children}</AuthProvider>
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
  })

  it("restores user session on mount when valid refresh cookie exists", async () => {
    const mockUser = {
      id: "u-1",
      name: "Alex Vance",
      email: "alex@example.com",
    }
    vi.mocked(authService.refreshToken).mockResolvedValueOnce({
      access_token: "jwt-token",
      token_type: "bearer",
      expires_in: 900,
      user: mockUser,
    })

    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <AuthProvider>{children}</AuthProvider>
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user).toEqual(mockUser)
  })

  it("updates state upon login", async () => {
    vi.mocked(authService.refreshToken).mockRejectedValueOnce(new Error("No session"))
    const mockUser = {
      id: "u-2",
      name: "Morgan Yu",
      email: "morgan@example.com",
    }
    vi.mocked(authService.login).mockResolvedValueOnce({
      access_token: "jwt-token-2",
      token_type: "bearer",
      expires_in: 900,
      user: mockUser,
    })

    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <AuthProvider>{children}</AuthProvider>
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.login({
        email: "morgan@example.com",
        password: "Password123!",
      })
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user).toEqual(mockUser)
  })

  it("clears state upon logout", async () => {
    const mockUser = {
      id: "u-3",
      name: "Alex Vance",
      email: "alex@example.com",
    }
    vi.mocked(authService.refreshToken).mockResolvedValueOnce({
      access_token: "jwt-token-3",
      token_type: "bearer",
      expires_in: 900,
      user: mockUser,
    })
    vi.mocked(authService.logout).mockResolvedValueOnce(undefined)

    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <AuthProvider>{children}</AuthProvider>
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true)
    })

    await act(async () => {
      await result.current.logout()
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
  })
})

