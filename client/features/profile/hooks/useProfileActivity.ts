import { useQuery } from "@tanstack/react-query";
import { apiClient as api } from "@/shared/services/api";
import { ProfileActivity } from "@features/profile/types/profile.types";

export function useProfileActivity(userId: string) {
  return useQuery({
    queryKey: ["profile", userId, "activity"],
    queryFn: async () => {
      const response = await api.get(`/users/${userId}/activity`);
      if (!response.success) {
        const errorMessage = typeof response.error === 'string' 
          ? response.error 
          : (response.error && typeof response.error === 'object' && 'message' in response.error) 
            ? (response.error as any).message 
            : "Failed to fetch activity";
        throw new Error(errorMessage);
      }
      return response.data as ProfileActivity[];
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes (more fresh for activity)
  });
}
