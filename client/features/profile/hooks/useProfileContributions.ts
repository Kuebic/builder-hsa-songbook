import { useQuery } from "@tanstack/react-query";
import { apiClient as api } from "@/shared/services/api";
import { ProfileContributions } from "@features/profile/types/profile.types";

export function useProfileContributions(userId: string) {
  return useQuery({
    queryKey: ["profile", userId, "contributions"],
    queryFn: async () => {
      const response = await api.get(`/users/${userId}/contributions`);
      if (!response.success) {
        const errorMessage = typeof response.error === 'string' 
          ? response.error 
          : (response.error && typeof response.error === 'object' && 'message' in response.error) 
            ? (response.error as any).message 
            : "Failed to fetch contributions";
        throw new Error(errorMessage);
      }
      return response.data as ProfileContributions;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
