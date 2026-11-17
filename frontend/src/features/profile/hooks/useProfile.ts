import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { profileService } from "@/services/profile.service"
import type { ProfileUpdate } from "@/features/profile/types/profile.types"

export const PROFILE_QUERY_KEY = ["profile", "me"] as const

export function useGetProfile() {
  return useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: () => profileService.getMyProfile(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ProfileUpdate) => profileService.updateProfile(payload),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(PROFILE_QUERY_KEY, updatedProfile)
    },
  })
}

