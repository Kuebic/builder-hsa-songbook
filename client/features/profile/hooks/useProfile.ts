import { useQuery } from "@tanstack/react-query";
import { apiClient as api } from "@/shared/services/api";
import { UserProfile } from "@features/profile/types/profile.types";

export function useProfile(userId?: string) {
  return useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      if (!userId) {
        return null;
      }

      const response = await api.get(`/users/${userId}/profile`);
      if (!response.success) {
        const errorMessage = typeof response.error === 'string' 
          ? response.error 
          : (response.error && typeof response.error === 'object' && 'message' in response.error) 
            ? (response.error as any).message 
            : "Failed to fetch profile";
        throw new Error(errorMessage);
      }
      return response.data as UserProfile;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
