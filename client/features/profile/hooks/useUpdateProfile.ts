import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient as api } from "@/shared/services/api";
import { UserPrivacySettings } from "@features/profile/types/profile.types";

interface UpdateProfileData {
  name?: string;
  profile?: {
    bio?: string;
    website?: string;
    location?: string;
  };
  preferences?: {
    defaultKey?: string;
    fontSize?: number;
    theme?: "light" | "dark" | "stage";
  };
}

interface UpdatePrivacyData {
  profilePrivacy: Partial<UserPrivacySettings>;
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  // Profile update mutation
  const profileMutation = useMutation({
    mutationFn: async ({
      userId,
      data,
    }: {
      userId: string;
      data: UpdateProfileData;
    }) => {
      const response = await api.put(`/users/${userId}/profile`, data);
      if (!response.success) {
        const errorMessage = typeof response.error === 'string' 
          ? response.error 
          : (response.error && typeof response.error === 'object' && 'message' in response.error) 
            ? (response.error as any).message 
            : "Failed to update profile";
        throw new Error(errorMessage);
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate profile cache to refetch updated data
      queryClient.invalidateQueries({
        queryKey: ["profile", variables.userId],
      });
    },
  });

  // Privacy update mutation with optimistic updates
  const privacyMutation = useMutation({
    mutationFn: async ({
      userId,
      data,
    }: {
      userId: string;
      data: UpdatePrivacyData;
    }) => {
      const response = await api.put(`/users/${userId}/privacy`, data);
      if (!response.success) {
        const errorMessage = typeof response.error === 'string' 
          ? response.error 
          : (response.error && typeof response.error === 'object' && 'message' in response.error) 
            ? (response.error as any).message 
            : "Failed to update privacy settings";
        throw new Error(errorMessage);
      }
      return response.data;
    },
    onMutate: async ({ userId, data }) => {
      // Cancel outgoing refetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: ["profile", userId] });

      // Snapshot the previous value
      const previousProfile = queryClient.getQueryData(["profile", userId]);

      // Optimistically update to new value
      queryClient.setQueryData(["profile", userId], (old: any) => ({
        ...old,
        profilePrivacy: {
          ...old?.profilePrivacy,
          ...data.profilePrivacy,
        },
      }));

      // Return context object with snapshot value
      return { previousProfile };
    },
    onError: (_, { userId }, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousProfile) {
        queryClient.setQueryData(["profile", userId], context.previousProfile);
      }
    },
    onSettled: (_, __, { userId }) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
    },
  });

  return {
    updateProfile: (userId: string, data: UpdateProfileData) =>
      profileMutation.mutateAsync({ userId, data }),
    updatePrivacy: (userId: string, data: UpdatePrivacyData) =>
      privacyMutation.mutateAsync({ userId, data }),
    isUpdating: profileMutation.isPending || privacyMutation.isPending,
    isUpdatingProfile: profileMutation.isPending,
    isUpdatingPrivacy: privacyMutation.isPending,
    error: profileMutation.error || privacyMutation.error,
    profileError: profileMutation.error,
    privacyError: privacyMutation.error,
  };
}
