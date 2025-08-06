import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getApiUrl,
  getFavoriteEndpoint,
  getFavoritesListEndpoint,
} from "@/shared/utils/api-helpers";
import {
  FavoritesResponse,
  AddFavoriteResponse,
  RemoveFavoriteResponse,
  CheckFavoriteResponse,
} from "@/shared/types/api-schemas";

// Request types
export interface AddFavoriteRequest {
  type: "song" | "arrangement";
  itemId: string;
  userId: string;
}

export interface RemoveFavoriteRequest {
  type: "song" | "arrangement";
  itemId: string;
  userId: string;
}

// API functions
const fetchFavorites = async (
  userId: string,
  type: "songs" | "arrangements" | "both" = "both",
): Promise<FavoritesResponse> => {
  const endpoint = getFavoritesListEndpoint(userId, type);
  const response = await fetch(getApiUrl(endpoint));
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error?.message || "Failed to fetch favorites");
  }
  return data.data;
};

const addFavorite = async (
  data: AddFavoriteRequest,
): Promise<AddFavoriteResponse> => {
  const endpoint = getFavoriteEndpoint(data.userId, data.type, data.itemId);

  const response = await fetch(getApiUrl(endpoint), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error?.message || "Failed to add favorite");
  }
  return result.data;
};

const removeFavorite = async (
  data: RemoveFavoriteRequest,
): Promise<RemoveFavoriteResponse> => {
  const endpoint = getFavoriteEndpoint(data.userId, data.type, data.itemId);

  const response = await fetch(getApiUrl(endpoint), {
    method: "DELETE",
  });
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error?.message || "Failed to remove favorite");
  }
  return result.data;
};

const checkFavorite = async (
  type: "song" | "arrangement",
  itemId: string,
  userId: string,
): Promise<CheckFavoriteResponse> => {
  // For now, we'll check by fetching the user's favorites
  // In a production app, you might want a dedicated endpoint
  const favorites = await fetchFavorites(
    userId,
    type === "song" ? "songs" : "arrangements",
  );
  const items = type === "song" ? favorites.songs : favorites.arrangements;
  const isFavorite = items?.some((item) => item._id === itemId) || false;

  return {
    userId,
    [type === "song" ? "songId" : "arrangementId"]: itemId,
    isFavorite,
  };
};

// Hooks
export const useFavorites = (
  userId?: string,
  type: "songs" | "arrangements" | "both" = "both",
) => {
  return useQuery({
    queryKey: ["favorites", userId, type],
    queryFn: () => fetchFavorites(userId!, type),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useAddFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addFavorite,
    onSuccess: (_, variables) => {
      // Invalidate favorites queries to refetch
      queryClient.invalidateQueries({
        queryKey: ["favorites", variables.userId],
      });
      // Also invalidate the specific check query
      queryClient.invalidateQueries({
        queryKey: [
          "favorite-check",
          variables.type,
          variables.itemId,
          variables.userId,
        ],
      });
    },
  });
};

export const useRemoveFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeFavorite,
    onSuccess: (_, variables) => {
      // Invalidate favorites queries to refetch
      queryClient.invalidateQueries({
        queryKey: ["favorites", variables.userId],
      });
      // Also invalidate the specific check query
      queryClient.invalidateQueries({
        queryKey: [
          "favorite-check",
          variables.type,
          variables.itemId,
          variables.userId,
        ],
      });
    },
  });
};

export const useCheckFavorite = (
  type: "song" | "arrangement",
  itemId: string,
  userId?: string,
) => {
  return useQuery({
    queryKey: ["favorite-check", type, itemId, userId],
    queryFn: () => checkFavorite(type, itemId, userId!),
    enabled: !!userId && !!itemId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
