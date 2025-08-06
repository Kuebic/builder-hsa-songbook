import { useQuery } from "@tanstack/react-query";
import { apiClient as api } from "@/shared/services/api";
import { ProfileFavorites } from "@features/profile/types/profile.types";

export function useProfileFavorites(userId: string) {
  return useQuery({
    queryKey: ["profile", userId, "favorites"],
    queryFn: async () => {
      const response = await api.get(`/users/${userId}/favorites?type=both`);
      if (!response.success) {
        const errorMessage = typeof response.error === 'string' 
          ? response.error 
          : (response.error && typeof response.error === 'object' && 'message' in response.error) 
            ? (response.error as any).message 
            : "Failed to fetch favorites";
        throw new Error(errorMessage);
      }
      return response.data as ProfileFavorites;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
