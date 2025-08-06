import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import type { ClientSong } from "@features/songs/types/song.types";
import type { CategoryBrowsingState } from "@features/categories/types/category.types";

interface CategorySongsResponse {
  success: boolean;
  data: ClientSong[];
  meta: {
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
    category: {
      id: string;
      name: string;
    };
    appliedFilters: {
      sortBy: string;
      searchQuery: string | null;
    };
  };
  error?: {
    code: string;
    message: string;
  };
}

interface CategoryBrowsingParams {
  categoryId: string;
  page?: number;
  limit?: number;
  sortBy?: "popular" | "recent" | "rating" | "title";
  searchQuery?: string;
}

// Hook for browsing songs within a specific category with pagination
export function useCategoryBrowsing(params: CategoryBrowsingParams) {
  const {
    categoryId,
    page = 1,
    limit = 20,
    sortBy = "popular",
    searchQuery,
  } = params;

  return useQuery({
    queryKey: [
      "categories",
      categoryId,
      "songs",
      { page, limit, sortBy, searchQuery },
    ],
    queryFn: async (): Promise<CategorySongsResponse> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const searchParams = new URLSearchParams();
        searchParams.append("page", String(page));
        searchParams.append("limit", String(limit));
        searchParams.append("sortBy", sortBy);

        if (searchQuery && searchQuery.trim()) {
          searchParams.append("searchQuery", searchQuery.trim());
        }

        const response = await fetch(
          `/api/categories/${categoryId}/songs?${searchParams.toString()}`,
          { signal: controller.signal },
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Category not found");
          }
          if (response.status >= 500) {
            console.warn("Category songs API not available, using fallback");
            return {
              success: true,
              data: [],
              meta: {
                pagination: {
                  page,
                  limit,
                  total: 0,
                  totalPages: 0,
                  hasNextPage: false,
                  hasPrevPage: false,
                },
                category: {
                  id: categoryId,
                  name: "Unknown Category",
                },
                appliedFilters: {
                  sortBy,
                  searchQuery: searchQuery || null,
                },
              },
            };
          }
          throw new Error(
            `Failed to fetch category songs: ${response.statusText}`,
          );
        }

        const result: CategorySongsResponse = await response.json();

        if (!result.success) {
          throw new Error(
            result.error?.message || "Failed to fetch category songs",
          );
        }

        return result;
      } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof Error && error.name === "AbortError") {
          console.warn("Category songs request timed out");
        }

        // Re-throw error to let React Query handle it
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    enabled: !!categoryId, // Only run if categoryId is provided
  });
}

// Hook for infinite scrolling within a category
export function useCategoryBrowsingInfinite(
  params: Omit<CategoryBrowsingParams, "page">,
) {
  const { categoryId, limit = 20, sortBy = "popular", searchQuery } = params;

  return useInfiniteQuery({
    queryKey: [
      "categories",
      categoryId,
      "songs",
      "infinite",
      { limit, sortBy, searchQuery },
    ],
    queryFn: async ({ pageParam = 1 }): Promise<CategorySongsResponse> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const searchParams = new URLSearchParams();
        searchParams.append("page", String(pageParam));
        searchParams.append("limit", String(limit));
        searchParams.append("sortBy", sortBy);

        if (searchQuery && searchQuery.trim()) {
          searchParams.append("searchQuery", searchQuery.trim());
        }

        const response = await fetch(
          `/api/categories/${categoryId}/songs?${searchParams.toString()}`,
          { signal: controller.signal },
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(
            `Failed to fetch category songs: ${response.statusText}`,
          );
        }

        const result: CategorySongsResponse = await response.json();

        if (!result.success) {
          throw new Error(
            result.error?.message || "Failed to fetch category songs",
          );
        }

        return result;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { hasNextPage, page } = lastPage.meta.pagination;
      return hasNextPage ? page + 1 : undefined;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!categoryId,
  });
}

// Hook to get songs from multiple categories (for recommendations)
export function useMultiCategorySongs(
  categoryIds: string[],
  limit: number = 10,
) {
  return useQuery({
    queryKey: ["categories", "multi", categoryIds.sort(), { limit }],
    queryFn: async (): Promise<Record<string, ClientSong[]>> => {
      const results: Record<string, ClientSong[]> = {};

      // Fetch songs from each category in parallel
      const promises = categoryIds.map(async (categoryId) => {
        try {
          const response = await fetch(
            `/api/categories/${categoryId}/songs?limit=${limit}&sortBy=popular`,
          );

          if (response.ok) {
            const result: CategorySongsResponse = await response.json();
            if (result.success) {
              results[categoryId] = result.data;
            }
          }
        } catch (error) {
          console.warn(
            `Failed to fetch songs for category ${categoryId}:`,
            error,
          );
          results[categoryId] = [];
        }
      });

      await Promise.all(promises);
      return results;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    enabled: categoryIds.length > 0,
  });
}

// Hook for category browsing state management
export function useCategoryBrowsingState() {
  // This would typically use a state management solution like Zustand or context
  // For now, implementing basic state that can be extended

  const defaultState: CategoryBrowsingState = {
    filters: {
      themes: [],
    },
    sortBy: "popular",
    viewMode: "grid",
    searchQuery: "",
  };

  // In a real implementation, this would connect to state management
  return {
    state: defaultState,
    updateState: (updates: Partial<CategoryBrowsingState>) => {
      // State update logic would go here
      console.log("Category browsing state update:", updates);
    },
    resetState: () => {
      // Reset to default state logic would go here
      console.log("Resetting category browsing state");
    },
  };
}
