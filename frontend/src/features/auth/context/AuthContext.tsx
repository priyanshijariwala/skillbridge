import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"
import { authService } from "@/services/auth.service"
import { setOnUnauthorizedCallback } from "@/lib/axios"
import type {
  AuthState,
  AuthUser,
} from "@/features/auth/types/auth.types"
import type {
  LoginFormValues,
  RegisterFormValues,
} from "@/features/auth/schemas/auth.schema"

export interface AuthContextType extends AuthState {
  login: (credentials: LoginFormValues) => Promise<AuthUser>
  register: (data: RegisterFormValues) => Promise<AuthUser>
  logout: () => Promise<void>
  refreshUser: () => Promise<AuthUser | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const handleUnauthorized = useCallback(() => {
    setUser(null)
  }, [])

  // Initialize session on mount
  useEffect(() => {
    setOnUnauthorizedCallback(handleUnauthorized)

    let isMounted = true

    const initAuth = async () => {
      try {
        // Attempt silent session recovery using HTTP-only cookie
        const authData = await authService.refreshToken()
        if (isMounted) {
          setUser(authData.user)
        }
      } catch {
        // If refresh fails, candidate is not currently logged in
        if (isMounted) {
          setUser(null)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    initAuth()

    return () => {
      isMounted = false
    }
  }, [handleUnauthorized])

  const login = async (credentials: LoginFormValues): Promise<AuthUser> => {
    const authData = await authService.login(credentials)
    setUser(authData.user)
    return authData.user
  }

  const register = async (data: RegisterFormValues): Promise<AuthUser> => {
    return await authService.register({
      name: data.name,
      email: data.email,
      password: data.password,
    })
  }

  const logout = async (): Promise<void> => {
    try {
      await authService.logout()
    } finally {
      setUser(null)
    }
  }

  const refreshUser = async (): Promise<AuthUser | null> => {
    try {
      const currentUser = await authService.getMe()
      setUser(currentUser)
      return currentUser
    } catch {
      setUser(null)
      return null
    }
  }

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export default AuthContext

