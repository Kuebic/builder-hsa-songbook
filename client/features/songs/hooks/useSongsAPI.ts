import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ClientSong } from "../types/song.types";

interface APIResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
    compressed: boolean;
    cacheHit: boolean;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

interface SongQueryParams {
  search?: string;
  key?: string;
  difficulty?: string;
  themes?: string;
  limit?: number;
  offset?: number;
  isPublic?: boolean;
}

// Fetch songs with optional filters
export function useSongs(params: SongQueryParams = {}) {
  return useQuery({
    queryKey: ["songs", params],
    queryFn: async (): Promise<ClientSong[]> => {
      try {
        const searchParams = new URLSearchParams();

        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            searchParams.append(key, String(value));
          }
        });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

        const response = await fetch(`/api/songs?${searchParams.toString()}`, {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          // If API is not available, fallback to mock data
          if (response.status >= 500) {
            console.warn("API not available, using mock data");
            const { mockClientSongs } = await import("../utils/mockData");
            return mockClientSongs;
          }
          throw new Error(`Failed to fetch songs: ${response.statusText}`);
        }

        const result: APIResponse<ClientSong[]> = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || "Failed to fetch songs");
        }

        return result.data;
      } catch (error) {
        // Fallback to mock data on any error (including timeouts)
        if (error instanceof Error && error.name === "AbortError") {
          console.warn("API request timed out, using mock data");
        } else {
          console.warn("Using mock data due to error:", error);
        }
        const { mockClientSongs } = await import("../utils/mockData");
        return mockClientSongs;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
    retry: false, // Disable retries to prevent infinite loops
    refetchOnWindowFocus: false, // Disable refetch on window focus
  });
}

// Fetch single song by ID
export function useSong(id: string) {
  return useQuery({
    queryKey: ["songs", id],
    queryFn: async (): Promise<ClientSong> => {
      const response = await fetch(`/api/songs/${id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch song: ${response.statusText}`);
      }

      const result: APIResponse<ClientSong> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || "Failed to fetch song");
      }

      return result.data;
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Fetch single song by slug
export function useSongBySlug(slug: string) {
  return useQuery({
    queryKey: ["songs", "slug", slug],
    queryFn: async (): Promise<ClientSong> => {
      if (!slug) {throw new Error("Slug is required");}
      
      const response = await fetch(`/api/songs/slug/${slug}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch song: ${response.statusText}`);
      }
      
      const result: APIResponse<ClientSong> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || "Failed to fetch song");
      }
      
      return result.data;
    },
    enabled: !!slug,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
}

// Search songs
export function useSearchSongs(query: string, enabled = true) {
  return useQuery({
    queryKey: ["songs", "search", query],
    queryFn: async (): Promise<ClientSong[]> => {
      if (!query.trim()) {return [];}
      
      const response = await fetch(`/api/songs/search?q=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const result: APIResponse<ClientSong[]> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || "Search failed");
      }

      return result.data;
    },
    enabled: enabled && !!query.trim(),
    staleTime: 2 * 60 * 1000, // 2 minutes for search results
  });
}

// Create new song
export function useCreateSong() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (songData: any): Promise<ClientSong> => {
      const response = await fetch("/api/songs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(songData),
      });

      if (!response.ok) {
        throw new Error(`Failed to create song: ${response.statusText}`);
      }

      const result: APIResponse<ClientSong> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || "Failed to create song");
      }

      return result.data;
    },
    onSuccess: () => {
      // Invalidate songs queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ["songs"] });
    },
  });
}

// Update song
export function useUpdateSong() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...songData }: { id: string } & any): Promise<ClientSong> => {
      const response = await fetch(`/api/songs/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(songData),
      });

      if (!response.ok) {
        throw new Error(`Failed to update song: ${response.statusText}`);
      }

      const result: APIResponse<ClientSong> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || "Failed to update song");
      }

      return result.data;
    },
    onSuccess: (data) => {
      // Update the specific song in cache
      queryClient.setQueryData(["songs", data.id], data);
      // Invalidate songs list to refresh
      queryClient.invalidateQueries({ queryKey: ["songs"] });
    },
  });
}

// Delete song
export function useDeleteSong() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string): Promise<{ id: string }> => {
      const response = await fetch(`/api/songs/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Failed to delete song: ${response.statusText}`);
      }

      const result: APIResponse<{ id: string }> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || "Failed to delete song");
      }

      return result.data;
    },
    onSuccess: () => {
      // Invalidate songs queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ["songs"] });
    },
  });
}

// Rate a song
export function useRateSong() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, rating }: { id: string; rating: number }) => {
      const response = await fetch(`/api/songs/${id}/rate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rating }),
      });

      if (!response.ok) {
        throw new Error(`Failed to rate song: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || "Failed to rate song");
      }

      return result.data;
    },
    onSuccess: (_, { id }) => {
      // Invalidate the specific song to refresh its rating
      queryClient.invalidateQueries({ queryKey: ["songs", id] });
      queryClient.invalidateQueries({ queryKey: ["songs"] });
    },
  });
}

// Get songs stats for dashboard
export function useSongsStats() {
  return useQuery({
    queryKey: ["songs", "stats"],
    queryFn: async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

        const response = await fetch("/api/songs/stats", {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          // Fallback to mock stats if endpoint doesn't exist yet
          console.warn("Stats API not available, using fallback data");
          const { mockStats } = await import("../utils/mockData");
          return mockStats;
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || "Failed to fetch stats");
        }

        return result.data;
      } catch (error) {
        // Fallback to mock stats on any error (including timeouts)
        if (error instanceof Error && error.name === "AbortError") {
          console.warn("Stats API request timed out, using mock data");
        } else {
          console.warn("Using mock stats due to error:", error);
        }
        const { mockStats } = await import("../utils/mockData");
        return mockStats;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Disable retries to prevent infinite loops
    refetchOnWindowFocus: false, // Disable refetch on window focus
  });
}
