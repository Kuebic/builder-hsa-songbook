import { useQuery } from "@tanstack/react-query";
import type { CategoryStats, CategoryStatsResponse } from "../types/category.types";

interface CategoryStatsQueryParams {
  includeEmpty?: boolean;
  sortBy?: 'popularity' | 'count' | 'rating' | 'alphabetical';
  limit?: number;
}

export function useCategoryStats(params: CategoryStatsQueryParams = {}) {
  return useQuery({
    queryKey: ['categories', 'stats', params],
    queryFn: async (): Promise<CategoryStats[]> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      try {
        const searchParams = new URLSearchParams();
        
        // Add query parameters
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            searchParams.append(key, String(value));
          }
        });
        
        const response = await fetch(`/api/categories/stats?${searchParams.toString()}`, {
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          // If API is not available, fallback to mock data
          if (response.status >= 500) {
            console.warn("Categories API not available, using mock data");
            const { generateMockCategoryStats } = await import('../utils/categoryHelpers');
            return generateMockCategoryStats();
          }
          throw new Error(`Failed to fetch category stats: ${response.statusText}`);
        }
        
        const result: CategoryStatsResponse = await response.json();
        
        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to fetch category stats');
        }
        
        return result.data;
      } catch (error) {
        clearTimeout(timeoutId);
        
        if (error instanceof Error && error.name === 'AbortError') {
          console.warn('Category stats request timed out, using mock data');
        } else {
          console.warn('Using mock category stats due to error:', error);
        }
        
        // Fallback to mock data for development and error scenarios
        const { generateMockCategoryStats } = await import('../utils/categoryHelpers');
        return generateMockCategoryStats();
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes  
    retry: 2,
    refetchOnWindowFocus: false,
    // Enable background refetching but don't show loading state
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook for a single category's statistics
export function useCategoryStatsById(categoryId: string) {
  const { data: allStats, ...query } = useCategoryStats();
  
  const categoryStats = allStats?.find(stat => stat.id === categoryId) || null;
  
  return {
    ...query,
    data: categoryStats,
  };
}

// Hook to check if categories have recent activity
export function useCategoriesWithRecentActivity() {
  const { data: allStats, ...query } = useCategoryStats();
  
  const categoriesWithActivity = allStats?.filter(stat => stat.recentCount > 0) || [];
  
  return {
    ...query,
    data: categoriesWithActivity,
  };
}

// Hook for category recommendations based on popularity
export function usePopularCategories(limit: number = 6) {
  return useCategoryStats({
    sortBy: 'popularity',
    limit,
    includeEmpty: false,
  });
}