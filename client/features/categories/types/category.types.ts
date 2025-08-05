import { z } from "zod";
import { ComponentType } from "react";
import type { ClientSong } from "@features/songs/types/song.types";

// Lucide icon component type
type LucideIcon = ComponentType<{ className?: string }>;

// Primary category definitions based on Unification Church context  
export interface SpiritualCategory {
  id: string;
  name: string;
  description: string;
  color: string; // Tailwind color for theming
  icon: LucideIcon; // Lucide React icon
  subcategories?: SpiritualCategory[];
  mappingRules: CategoryMappingRule[];
}

export interface CategoryMappingRule {
  type: "theme" | "source" | "artist" | "title_pattern" | "lyrics_pattern";
  values: string[];
  weight: number; // 1-10 for fuzzy matching
}

// Category statistics for dashboard display
export interface CategoryStats {
  id: string;
  name: string;
  songCount: number;
  avgRating: number;
  recentCount: number; // Songs added in last 7 days
  popularityScore: number; // Based on views and usage
  topSongs: Pick<ClientSong, "id" | "title" | "artist">[];
  lastUpdated: Date;
}

// Category browsing state management
export interface CategoryBrowsingState {
  activeCategory?: string;
  subCategory?: string;
  filters: {
    key?: string;
    difficulty?: string;
    themes: string[];
    artist?: string;
    yearRange?: [number, number];
  };
  sortBy: "popular" | "recent" | "rating" | "title";
  viewMode: "grid" | "list";
  searchQuery: string;
}

// Enhanced song interface with category assignments
export interface CategorizedSong extends ClientSong {
  assignedCategories: string[]; // Auto-assigned spiritual categories
  categoryScores: Record<string, number>; // Confidence scores per category
  usageContext?: "opening" | "communion" | "closing" | "special"; // Functional categorization
}

// API Response wrapper for categories
export interface CategoryStatsResponse {
  success: boolean;
  data: CategoryStats[];
  meta?: {
    totalCategories: number;
    generated: string;
    cacheHit: boolean;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// Zod validation schemas
export const categoryStatsSchema = z.object({
  id: z.string(),
  name: z.string(),
  songCount: z.number().min(0),
  avgRating: z.number().min(0).max(5),
  recentCount: z.number().min(0),
  popularityScore: z.number().min(0),
  topSongs: z.array(z.object({
    id: z.string(),
    title: z.string(),
    artist: z.string().optional(),
  })),
  lastUpdated: z.date(),
});

export const categoryBrowsingFiltersSchema = z.object({
  category: z.string().optional(),
  key: z.string().optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  themes: z.array(z.string()).default([]),
  searchQuery: z.string().default(""),
  sortBy: z.enum(["popular", "recent", "rating", "title"]).default("popular"),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

// Type guards
export function isCategoryStats(obj: unknown): obj is CategoryStats {
  return (
    typeof obj === "object" &&
    obj !== null &&
    'id' in obj &&
    'name' in obj &&
    'songCount' in obj &&
    'avgRating' in obj &&
    'recentCount' in obj &&
    'popularityScore' in obj &&
    'topSongs' in obj &&
    typeof (obj as CategoryStats).id === "string" &&
    typeof (obj as CategoryStats).name === "string" &&
    typeof (obj as CategoryStats).songCount === "number" &&
    typeof (obj as CategoryStats).avgRating === "number" &&
    typeof (obj as CategoryStats).recentCount === "number" &&
    typeof (obj as CategoryStats).popularityScore === "number" &&
    Array.isArray((obj as CategoryStats).topSongs)
  );
}

// Utility types for component props
export type CategoryFilterKey = keyof CategoryBrowsingState["filters"];
export type CategorySortOption = CategoryBrowsingState["sortBy"];
export type CategoryViewMode = CategoryBrowsingState["viewMode"];

// Component prop types
export interface CategoryCardProps {
  category: CategoryStats;
  onClick: (categoryId: string) => void;
  isLoading?: boolean;
}

export interface CategoryGridProps {
  onCategorySelect: (categoryId: string) => void;
  maxCategories?: number;
  className?: string;
}

export interface CategoryFiltersProps {
  filters: CategoryBrowsingState["filters"];
  onFilterChange: (key: CategoryFilterKey, value: string | number | boolean | undefined) => void;
  onClearAll: () => void;
  availableThemes: string[];
  availableKeys: string[];
}