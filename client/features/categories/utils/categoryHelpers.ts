import type { CategoryStats, CategorizedSong } from "../types/category.types";
import type { ClientSong } from "@features/songs/types/song.types";
import { SPIRITUAL_CATEGORIES, getCategoryById } from "./categoryMappings";

// Sort categories by various criteria
export function sortCategories(
  categories: CategoryStats[],
  sortBy: "popular" | "alphabetical" | "count" | "rating",
): CategoryStats[] {
  switch (sortBy) {
    case "popular":
      return [...categories].sort(
        (a, b) => b.popularityScore - a.popularityScore,
      );
    case "alphabetical":
      return [...categories].sort((a, b) => a.name.localeCompare(b.name));
    case "count":
      return [...categories].sort((a, b) => b.songCount - a.songCount);
    case "rating":
      return [...categories].sort((a, b) => b.avgRating - a.avgRating);
    default:
      return categories;
  }
}

// Filter categories by minimum song count
export function filterCategoriesByMinSongs(
  categories: CategoryStats[],
  minSongs: number = 1,
): CategoryStats[] {
  return categories.filter((cat) => cat.songCount >= minSongs);
}

// Calculate category diversity score (how many different categories a song belongs to)
export function calculateCategoryDiversity(song: ClientSong): number {
  const { categories } = assignClientSongCategories(song);
  return categories.length;
}

// Get dominant category for a song (highest scoring category)
export function getDominantCategory(song: ClientSong): string | null {
  const { categories, scores } = assignClientSongCategories(song);
  if (categories.length === 0) {
    return null;
  }

  return categories.reduce((dominant, current) =>
    scores[current] > scores[dominant] ? current : dominant,
  );
}

// Client-side category assignment (simplified version for ClientSong)
export function assignClientSongCategories(song: ClientSong): {
  categories: string[];
  scores: Record<string, number>;
} {
  const categoryScores: Record<string, number> = {};

  SPIRITUAL_CATEGORIES.forEach((category) => {
    let score = 0;

    category.mappingRules.forEach((rule) => {
      switch (rule.type) {
        case "theme":
          if (
            song.themes?.some((theme) =>
              rule.values.some((value) =>
                theme.toLowerCase().includes(value.toLowerCase()),
              ),
            )
          ) {
            score += rule.weight;
          }
          break;
        case "artist":
          if (
            song.artist &&
            rule.values.some((value) =>
              song.artist!.toLowerCase().includes(value.toLowerCase()),
            )
          ) {
            score += rule.weight;
          }
          break;
        case "title_pattern":
          if (
            rule.values.some((pattern) =>
              song.title.toLowerCase().includes(pattern.toLowerCase()),
            )
          ) {
            score += rule.weight;
          }
          break;
        // Skip 'source' and 'lyrics_pattern' as they're not available in ClientSong
      }
    });

    if (score >= 5) {
      // Minimum threshold
      categoryScores[category.id] = score;
    }
  });

  const categories = Object.keys(categoryScores);
  return { categories, scores: categoryScores };
}

// Enhance songs with category information
export function enhanceSongsWithCategories(
  songs: ClientSong[],
): CategorizedSong[] {
  return songs.map((song) => {
    const { categories, scores } = assignClientSongCategories(song);

    return {
      ...song,
      assignedCategories: categories,
      categoryScores: scores,
      usageContext: inferUsageContext(song),
    };
  });
}

// Infer usage context from song metadata
function inferUsageContext(song: ClientSong): CategorizedSong["usageContext"] {
  const themes = song.themes || [];
  const title = song.title.toLowerCase();

  if (
    themes.some((t) => t.toLowerCase().includes("opening")) ||
    title.includes("welcome") ||
    title.includes("gather")
  ) {
    return "opening";
  }

  if (
    themes.some((t) => t.toLowerCase().includes("communion")) ||
    title.includes("bread") ||
    title.includes("wine") ||
    title.includes("table")
  ) {
    return "communion";
  }

  if (
    themes.some((t) => t.toLowerCase().includes("closing")) ||
    title.includes("send") ||
    title.includes("go forth") ||
    title.includes("blessing")
  ) {
    return "closing";
  }

  if (
    themes.some((t) =>
      ["seasonal", "christmas", "easter", "wedding"].includes(t.toLowerCase()),
    )
  ) {
    return "special";
  }

  return undefined;
}

// Generate category insights for dashboard
export function generateCategoryInsights(categories: CategoryStats[]): {
  totalSongs: number;
  mostPopular: CategoryStats | null;
  mostRated: CategoryStats | null;
  trending: CategoryStats[];
  diverse: number; // Number of categories with songs
} {
  const totalSongs = categories.reduce((sum, cat) => sum + cat.songCount, 0);

  const mostPopular = categories.reduce(
    (prev, current) =>
      current.popularityScore > prev.popularityScore ? current : prev,
    categories[0] || null,
  );

  const mostRated = categories.reduce(
    (prev, current) => (current.avgRating > prev.avgRating ? current : prev),
    categories[0] || null,
  );

  const trending = categories
    .filter((cat) => cat.recentCount > 0)
    .sort((a, b) => b.recentCount - a.recentCount)
    .slice(0, 3);

  const diverse = categories.filter((cat) => cat.songCount > 0).length;

  return {
    totalSongs,
    mostPopular,
    mostRated,
    trending,
    diverse,
  };
}

// Format category statistics for display
export function formatCategoryStats(category: CategoryStats): {
  formattedRating: string;
  formattedPopularity: string;
  recentLabel: string;
  songCountLabel: string;
} {
  const formattedRating =
    category.avgRating > 0 ? category.avgRating.toFixed(1) : "N/A";
  const formattedPopularity = category.popularityScore.toFixed(1);

  const recentLabel =
    category.recentCount === 0
      ? "No recent additions"
      : category.recentCount === 1
        ? "1 recent addition"
        : `${category.recentCount} recent additions`;

  const songCountLabel =
    category.songCount === 1 ? "1 song" : `${category.songCount} songs`;

  return {
    formattedRating,
    formattedPopularity,
    recentLabel,
    songCountLabel,
  };
}

// Get category theme colors for UI consistency
export function getCategoryThemeColors(categoryId: string): {
  background: string;
  text: string;
  border: string;
  hover: string;
} {
  const category = getCategoryById(categoryId);

  const colorMap: Record<string, any> = {
    blue: {
      background: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
      hover: "hover:bg-blue-100",
    },
    purple: {
      background: "bg-purple-50",
      text: "text-purple-700",
      border: "border-purple-200",
      hover: "hover:bg-purple-100",
    },
    green: {
      background: "bg-green-50",
      text: "text-green-700",
      border: "border-green-200",
      hover: "hover:bg-green-100",
    },
    orange: {
      background: "bg-orange-50",
      text: "text-orange-700",
      border: "border-orange-200",
      hover: "hover:bg-orange-100",
    },
    amber: {
      background: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
      hover: "hover:bg-amber-100",
    },
    teal: {
      background: "bg-teal-50",
      text: "text-teal-700",
      border: "border-teal-200",
      hover: "hover:bg-teal-100",
    },
  };

  return (
    colorMap[category?.color || "gray"] || {
      background: "bg-gray-50",
      text: "text-gray-700",
      border: "border-gray-200",
      hover: "hover:bg-gray-100",
    }
  );
}

// Mock data generator for development and testing
export function generateMockCategoryStats(): CategoryStats[] {
  return SPIRITUAL_CATEGORIES.map((category, index) => ({
    id: category.id,
    name: category.name,
    songCount: Math.floor(Math.random() * 50) + 5, // 5-55 songs
    avgRating: Math.round((Math.random() * 2 + 3) * 10) / 10, // 3.0-5.0 rating
    recentCount: Math.floor(Math.random() * 5), // 0-4 recent songs
    popularityScore: Math.round((Math.random() * 5 + 3) * 10) / 10, // 3.0-8.0 popularity
    topSongs: [
      {
        id: `song-${index}-1`,
        title: `Popular Song ${index + 1}`,
        artist: `Artist ${index + 1}`,
      },
      {
        id: `song-${index}-2`,
        title: `Beloved Hymn ${index + 1}`,
        artist: `Composer ${index + 1}`,
      },
    ],
    lastUpdated: new Date(),
  }));
}

// Check if a category has recent activity
export function hasRecentActivity(
  category: CategoryStats,
  daysThreshold: number = 7,
): boolean {
  const daysSinceUpdate = Math.floor(
    (Date.now() - category.lastUpdated.getTime()) / (1000 * 60 * 60 * 24),
  );
  return daysSinceUpdate <= daysThreshold || category.recentCount > 0;
}

// Get category recommendations based on user preferences
export function getCategoryRecommendations(
  userFavoriteThemes: string[],
  categories: CategoryStats[],
): CategoryStats[] {
  if (userFavoriteThemes.length === 0) {
    return sortCategories(categories, "popular").slice(0, 3);
  }

  // Score categories based on theme overlap
  const scoredCategories = categories.map((category) => {
    const spiritualCategory = getCategoryById(category.id);
    if (!spiritualCategory) {
      return { ...category, recommendationScore: 0 };
    }

    const themeOverlap = spiritualCategory.mappingRules
      .filter((rule) => rule.type === "theme")
      .reduce((score, rule) => {
        const overlap = rule.values.filter((value) =>
          userFavoriteThemes.some((theme) =>
            theme.toLowerCase().includes(value.toLowerCase()),
          ),
        ).length;
        return score + overlap * rule.weight;
      }, 0);

    return {
      ...category,
      recommendationScore: themeOverlap + category.popularityScore,
    };
  });

  return scoredCategories
    .sort((a, b) => b.recommendationScore - a.recommendationScore)
    .slice(0, 3);
}
