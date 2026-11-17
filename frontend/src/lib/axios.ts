import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios"
import type { ApiErrorResponse, AuthResponse } from "@/features/auth/types/auth.types"

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1"

// In-memory access token storage
let currentAccessToken: string | null = null

export const setAccessToken = (token: string | null): void => {
  currentAccessToken = token
}

export const getAccessToken = (): string | null => {
  return currentAccessToken
}

// Global callback for auth expiration/logout
let onUnauthorizedCallback: (() => void) | null = null

export const setOnUnauthorizedCallback = (callback: (() => void) | null): void => {
  onUnauthorizedCallback = callback
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: 15000,
})

// Request Interceptor: Attach Access Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (currentAccessToken && config.headers) {
      config.headers.Authorization = `Bearer ${currentAccessToken}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Concurrency lock for refresh token rotation
let isRefreshing = false
let refreshSubscribers: Array<(token: string | null, error?: Error) => void> = []

const subscribeTokenRefresh = (
  callback: (token: string | null, error?: Error) => void
) => {
  refreshSubscribers.push(callback)
}

const onRefreshed = (token: string | null, error?: Error) => {
  refreshSubscribers.forEach((cb) => cb(token, error))
  refreshSubscribers = []
}

// Centralized error extraction
export const extractErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorResponse | undefined
    if (data?.error?.message) {
      if (data.error.details && data.error.details.length > 0) {
        const detailMsgs = data.error.details
          .map((d) => d.message)
          .filter(Boolean)
          .join(", ")
        return detailMsgs ? `${data.error.message}: ${detailMsgs}` : data.error.message
      }
      return data.error.message
    }
    if (error.response?.status === 401) {
      return "Your session has expired. Please log in again."
    }
    if (error.response?.status === 403) {
      return "You do not have permission to perform this action."
    }
    if (error.response?.status === 404) {
      return "The requested resource was not found."
    }
    if (error.response?.status === 409) {
      return "A resource conflict occurred. Please check your data."
    }
    if (error.response?.status === 500) {
      return "A server error occurred. Please try again later."
    }
    if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
      return "The request timed out. Please check your connection and try again."
    }
    if (error.message === "Network Error") {
      return "Network error: Unable to connect to SkillBridge server. Please ensure the backend is running."
    }
    return error.message || "An unexpected network error occurred."
  }
  if (error instanceof Error) {
    return error.message
  }
  return "An unexpected error occurred."
}

// Response Interceptor: 401 token refresh queue
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }

    if (!originalRequest || !error.response) {
      return Promise.reject(new Error(extractErrorMessage(error)))
    }

    const is401 = error.response.status === 401
    const requestUrl = originalRequest.url || ""
    const isAuthEndpoint =
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/register") ||
      requestUrl.includes("/auth/refresh") ||
      requestUrl.includes("/auth/logout")

    // If 401 and not an auth endpoint, attempt token refresh
    if (is401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        // Queue the request until refresh finishes
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((token, refreshErr) => {
            if (refreshErr || !token) {
              reject(new Error(extractErrorMessage(refreshErr || error)))
            } else {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`
              }
              resolve(apiClient(originalRequest))
            }
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // Call refresh endpoint using cookies
        const { data } = await axios.post<AuthResponse>(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true, timeout: 10000 }
        )

        const newAccessToken = data.access_token
        setAccessToken(newAccessToken)
        onRefreshed(newAccessToken)

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        }
        return apiClient(originalRequest)
      } catch (refreshError) {
        setAccessToken(null)
        onRefreshed(null, refreshError as Error)
        if (onUnauthorizedCallback) {
          onUnauthorizedCallback()
        }
        return Promise.reject(new Error(extractErrorMessage(refreshError)))
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(new Error(extractErrorMessage(error)))
  }
)

export default apiClient

