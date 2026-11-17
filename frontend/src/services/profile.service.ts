import apiClient from "@/lib/axios"
import type { ProfileRead, ProfileUpdate } from "@/features/profile/types/profile.types"
import type { UserRead, UserUpdate } from "@/features/auth/types/auth.types"

export const profileService = {
  async getMyProfile(): Promise<ProfileRead> {
    const { data } = await apiClient.get<ProfileRead>("/profiles/me")
    return data
  },

  async updateProfile(payload: ProfileUpdate): Promise<ProfileRead> {
    const { data } = await apiClient.put<ProfileRead>("/profiles/me", payload)
    return data
  },

  async getMyUser(): Promise<UserRead> {
    const { data } = await apiClient.get<UserRead>("/users/me")
    return data
  },

  async updateUser(payload: UserUpdate): Promise<UserRead> {
    const { data } = await apiClient.patch<UserRead>("/users/me", payload)
    return data
  },
}
