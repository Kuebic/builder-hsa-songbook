import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCategoryStats } from "./useCategoryStats";
import { 
  generateCategoryInsights, 
  getCategoryRecommendations,
  hasRecentActivity
} from "../utils/categoryHelpers";

// Hook for category insights and analytics
export function useCategoryAnalytics() {
  const { data: categoryStats, ...query } = useCategoryStats();
  
  const insights = useMemo(() => {
    if (!categoryStats || categoryStats.length === 0) {
      return {
        totalSongs: 0,
        mostPopular: null,
        mostRated: null,
        trending: [],
        diverse: 0,
      };
    }
    
    return generateCategoryInsights(categoryStats);
  }, [categoryStats]);
  
  return {
    ...query,
    data: insights,
  };
}

// Hook for trending categories (based on recent activity)
export function useTrendingCategories(limit: number = 5) {
  const { data: categoryStats, ...query } = useCategoryStats();
  
  const trendingCategories = useMemo(() => {
    if (!categoryStats) return [];
    
    return categoryStats
      .filter(category => hasRecentActivity(category))
      .sort((a, b) => {
        // Sort by recent count first, then by popularity score
        if (b.recentCount !== a.recentCount) {
          return b.recentCount - a.recentCount;
        }
        return b.popularityScore - a.popularityScore;
      })
      .slice(0, limit);
  }, [categoryStats, limit]);
  
  return {
    ...query,
    data: trendingCategories,
  };
}

// Hook for category recommendations based on user preferences
export function useCategoryRecommendations(userFavoriteThemes: string[] = [], limit: number = 3) {
  const { data: categoryStats, ...query } = useCategoryStats();
  
  const recommendations = useMemo(() => {
    if (!categoryStats) return [];
    
    return getCategoryRecommendations(userFavoriteThemes, categoryStats).slice(0, limit);
  }, [categoryStats, userFavoriteThemes, limit]);
  
  return {
    ...query,
    data: recommendations,
  };
}

// Hook for category comparison and benchmarking
export function useCategoryComparison(categoryIds: string[]) {
  const { data: allStats, ...query } = useCategoryStats();
  
  const comparisonData = useMemo(() => {
    if (!allStats || categoryIds.length === 0) return [];
    
    const selectedCategories = allStats.filter(stat => categoryIds.includes(stat.id));
    
    return selectedCategories.map(category => ({
      ...category,
      metrics: {
        songsPerRating: category.songCount > 0 ? category.avgRating / category.songCount : 0,
        activityRatio: category.songCount > 0 ? category.recentCount / category.songCount : 0,
        popularityRank: allStats.findIndex(stat => stat.id === category.id) + 1,
        isAboveAverage: {
          songCount: category.songCount > (allStats.reduce((sum, s) => sum + s.songCount, 0) / allStats.length),
          rating: category.avgRating > (allStats.reduce((sum, s) => sum + s.avgRating, 0) / allStats.length),
          popularity: category.popularityScore > (allStats.reduce((sum, s) => sum + s.popularityScore, 0) / allStats.length),
        },
      },
    }));
  }, [allStats, categoryIds]);
  
  return {
    ...query,
    data: comparisonData,
  };
}

// Hook for category performance metrics over time
export function useCategoryPerformance(categoryIds: string[]) {
  return useQuery({
    queryKey: ['categories', 'performance', categoryIds.sort()],
    queryFn: async () => {
      // This would fetch historical performance data
      // For now, return mock data structure
      const performanceData = categoryIds.map(categoryId => ({
        categoryId,
        metrics: {
          songGrowth: Math.floor(Math.random() * 20) - 10, // -10 to +10 songs
          ratingTrend: Math.round((Math.random() * 0.4 - 0.2) * 10) / 10, // -0.2 to +0.2
          popularityChange: Math.round((Math.random() * 2 - 1) * 10) / 10, // -1.0 to +1.0
          viewsGrowth: Math.floor(Math.random() * 1000) - 500, // -500 to +500
        },
        period: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          end: new Date(),
        },
      }));
      
      return performanceData;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
    enabled: categoryIds.length > 0,
  });
}

// Hook for category health check
export function useCategoryHealth() {
  const { data: categoryStats, ...query } = useCategoryStats();
  
  const healthMetrics = useMemo(() => {
    if (!categoryStats) return null;
    
    const totalCategories = categoryStats.length;
    const activeCategories = categoryStats.filter(cat => cat.songCount > 0).length;
    const trendingCategories = categoryStats.filter(cat => hasRecentActivity(cat)).length;
    const highRatedCategories = categoryStats.filter(cat => cat.avgRating > 4.0).length;
    const lowContentCategories = categoryStats.filter(cat => cat.songCount < 5).length;
    
    return {
      overall: {
        score: Math.round(((activeCategories / totalCategories) * 0.4 + 
                          (trendingCategories / totalCategories) * 0.3 + 
                          (highRatedCategories / totalCategories) * 0.3) * 100),
        status: activeCategories / totalCategories > 0.8 ? 'excellent' : 
                activeCategories / totalCategories > 0.6 ? 'good' : 
                activeCategories / totalCategories > 0.4 ? 'fair' : 'needs_attention',
      },
      metrics: {
        totalCategories,
        activeCategories,
        activationRate: Math.round((activeCategories / totalCategories) * 100),
        trendingCategories,
        trendingRate: Math.round((trendingCategories / totalCategories) * 100),
        highRatedCategories,
        qualityRate: Math.round((highRatedCategories / totalCategories) * 100),
        lowContentCategories,
        contentGapRate: Math.round((lowContentCategories / totalCategories) * 100),
      },
      recommendations: [
        ...(lowContentCategories > totalCategories * 0.3 ? 
          ['Consider consolidating categories with low content'] : []),
        ...(trendingCategories < totalCategories * 0.2 ? 
          ['Focus on promoting underperforming categories'] : []),
        ...(highRatedCategories < totalCategories * 0.4 ? 
          ['Work on improving content quality in categories'] : []),
      ],
    };
  }, [categoryStats]);
  
  return {
    ...query,
    data: healthMetrics,
  };
}

// Hook for category search and discovery analytics
export function useCategorySearchAnalytics() {
  return useQuery({
    queryKey: ['categories', 'search-analytics'],
    queryFn: async () => {
      // This would fetch search analytics data from the server
      // For now, return mock data
      return {
        popularSearches: [
          { query: 'traditional', count: 156, categories: ['traditional-holy', 'classic-hymns'] },
          { query: 'contemporary', count: 89, categories: ['contemporary-christian'] },
          { query: 'pioneer', count: 67, categories: ['american-pioneer'] },
          { query: 'holy', count: 234, categories: ['traditional-holy', 'new-holy'] },
        ],
        categoryDiscovery: {
          mostDiscovered: 'contemporary-christian',
          leastDiscovered: 'original-interchurch',
          averageTimeSpent: 145, // seconds
        },
        conversionRates: {
          browseToPlay: 0.34,
          browseToFavorite: 0.12,
          browseToSetlist: 0.08,
        },
      };
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 4 * 60 * 60 * 1000, // 4 hours
  });
}