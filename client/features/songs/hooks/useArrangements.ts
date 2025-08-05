import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Arrangement, arrangementCreateSchema } from "../types/song.types";
import { z } from "zod";

interface APIResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    total: number;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// Fetch arrangements for a specific song
export function useArrangementsBySong(songId: string) {
  return useQuery({
    queryKey: ["arrangements", "song", songId],
    queryFn: async (): Promise<Arrangement[]> => {
      if (!songId) {return [];}
      
      const response = await fetch(`/api/songs/${songId}/arrangements`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch arrangements: ${response.statusText}`);
      }
      
      const result: APIResponse<Arrangement[]> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || "Failed to fetch arrangements");
      }
      
      return result.data;
    },
    enabled: !!songId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Create new arrangement
export function useCreateArrangement() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (arrangementData: z.infer<typeof arrangementCreateSchema> & { 
      songIds: string[]; 
      createdBy: string;
      isPublic?: boolean;
    }): Promise<Arrangement> => {
      const response = await fetch("/api/arrangements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(arrangementData),
      });

      if (!response.ok) {
        throw new Error(`Failed to create arrangement: ${response.statusText}`);
      }

      const result: APIResponse<Arrangement> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || "Failed to create arrangement");
      }

      return result.data;
    },
    onSuccess: (data) => {
      // Invalidate arrangements for all songs this arrangement belongs to
      data.songIds.forEach((songId) => {
        queryClient.invalidateQueries({ queryKey: ["arrangements", "song", songId] });
      });
      // Also invalidate the general arrangements list
      queryClient.invalidateQueries({ queryKey: ["arrangements"] });
    },
  });
}

// Update arrangement
export function useUpdateArrangement() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...arrangementData }: { id: string } & Partial<z.infer<typeof arrangementCreateSchema> & {
      songIds?: string[];
      isPublic?: boolean;
    }>): Promise<Arrangement> => {
      const response = await fetch(`/api/arrangements/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(arrangementData),
      });

      if (!response.ok) {
        throw new Error(`Failed to update arrangement: ${response.statusText}`);
      }

      const result: APIResponse<Arrangement> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || "Failed to update arrangement");
      }

      return result.data;
    },
    onSuccess: (data) => {
      // Invalidate the specific arrangement
      queryClient.setQueryData(["arrangements", data._id], data);
      // Invalidate arrangements for all songs this arrangement belongs to
      data.songIds.forEach((songId) => {
        queryClient.invalidateQueries({ queryKey: ["arrangements", "song", songId] });
      });
      // Also invalidate the general arrangements list
      queryClient.invalidateQueries({ queryKey: ["arrangements"] });
    },
  });
}

// Delete arrangement
export function useDeleteArrangement() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string): Promise<{ id: string }> => {
      const response = await fetch(`/api/arrangements/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Failed to delete arrangement: ${response.statusText}`);
      }

      const result: APIResponse<{ id: string }> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || "Failed to delete arrangement");
      }

      return result.data;
    },
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ["arrangements", id] });
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ["arrangements"] });
    },
  });
}

// Rate an arrangement
export function useRateArrangement() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, rating }: { id: string; rating: number }) => {
      const response = await fetch(`/api/arrangements/${id}/rate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rating }),
      });

      if (!response.ok) {
        throw new Error(`Failed to rate arrangement: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || "Failed to rate arrangement");
      }

      return result.data;
    },
    onSuccess: (_, { id }) => {
      // Invalidate the specific arrangement to refresh its rating
      queryClient.invalidateQueries({ queryKey: ["arrangements", id] });
      queryClient.invalidateQueries({ queryKey: ["arrangements"] });
    },
  });
}