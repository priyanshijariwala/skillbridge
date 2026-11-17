export interface AuthUser {
  id: string
  name: string
  email: string
  role?: string
  is_active?: boolean
  created_at?: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  expires_in: number
  user: AuthUser
}

export interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface UserRead {
  id: string
  name: string
  email: string
  role: string
  is_active: boolean
  created_at?: string | null
}

export interface UserUpdate {
  name?: string
}

export interface ApiErrorDetail {
  field?: string
  message: string
  type?: string
}

export interface ApiErrorResponse {
  error: {
    code: string
    message: string
    details: ApiErrorDetail[]
    request_id?: string
  }
}

