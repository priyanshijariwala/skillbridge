import { apiClient, setAccessToken } from "@/lib/axios"
import type {
  AuthResponse,
  AuthUser,
} from "@/features/auth/types/auth.types"
import type {
  LoginFormValues,
  RegisterFormValues,
} from "@/features/auth/schemas/auth.schema"

export const authService = {
  async register(data: Omit<RegisterFormValues, "confirmPassword">): Promise<AuthUser> {
    const response = await apiClient.post<AuthUser>("/auth/register", {
      name: data.name,
      email: data.email,
      password: data.password,
    })
    return response.data
  },

  async login(credentials: LoginFormValues): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>("/auth/login", credentials)
    const { access_token } = response.data
    setAccessToken(access_token)
    return response.data
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post("/auth/logout")
    } finally {
      setAccessToken(null)
    }
  },

  async refreshToken(): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>("/auth/refresh")
    const { access_token } = response.data
    setAccessToken(access_token)
    return response.data
  },

  async getMe(): Promise<AuthUser> {
    const response = await apiClient.get<AuthUser>("/auth/me")
    return response.data
  },
}

export default authService

