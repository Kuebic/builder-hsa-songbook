// Category types
export type {
  SpiritualCategory,
  CategoryMappingRule,
  CategoryStats,
  CategoryBrowsingState,
  CategorizedSong,
  CategoryStatsResponse,
  CategoryFilterKey,
  CategorySortOption,
  CategoryViewMode,
  CategoryCardProps,
  CategoryGridProps,
  CategoryFiltersProps,
} from "./types/category.types";

export {
  categoryStatsSchema,
  categoryBrowsingFiltersSchema,
  isCategoryStats,
} from "./types/category.types";

// Category mappings and utilities
export {
  SPIRITUAL_CATEGORIES,
  assignSongCategories,
  getCategoryById,
  getCategoryColorClass,
  getAllCategories,
  getCategoriesByPopularity,
  filterCategories,
  categoryIdToSlug,
  slugToCategoryId,
  getCategoryBreadcrumb,
} from "./utils/categoryMappings";

export {
  sortCategories,
  filterCategoriesByMinSongs,
  calculateCategoryDiversity,
  getDominantCategory,
  enhanceSongsWithCategories,
  generateCategoryInsights,
  formatCategoryStats,
  getCategoryThemeColors,
  generateMockCategoryStats,
  hasRecentActivity,
  getCategoryRecommendations,
  assignClientSongCategories,
} from "./utils/categoryHelpers";

// Components
export { CategoryGrid, CategoryGridCompact } from "./components/CategoryGrid";
export { CategoryCard } from "./components/CategoryCard";
export { CategoryBrowser } from "./components/CategoryBrowser";
// export { CategoryFilters } from './components/CategoryFilters';

// Hooks
export {
  useCategoryStats,
  useCategoryStatsById,
  useCategoriesWithRecentActivity,
  usePopularCategories,
} from "./hooks/useCategoryStats";

export {
  useCategoryBrowsing,
  useCategoryBrowsingInfinite,
  useMultiCategorySongs,
  useCategoryBrowsingState,
} from "./hooks/useCategoryBrowsing";

export {
  useCategoryAnalytics,
  useTrendingCategories,
  useCategoryRecommendations,
  useCategoryComparison,
  useCategoryPerformance,
  useCategoryHealth,
  useCategorySearchAnalytics,
} from "./hooks/useCategoryAnalytics";
