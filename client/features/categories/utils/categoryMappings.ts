import { Book, Heart, Music, Cross, Crown, Users } from "lucide-react";
import type { SpiritualCategory } from "../types/category.types";
import type { Song } from "@features/songs/types/song.types";

export const SPIRITUAL_CATEGORIES: SpiritualCategory[] = [
  {
    id: "traditional-holy",
    name: "Traditional Holy Songs",
    description:
      "Core sacred repertoire, foundational to Unification teachings",
    color: "blue",
    icon: Book,
    mappingRules: [
      {
        type: "theme",
        values: ["holy", "sacred", "divine principle", "true parents"],
        weight: 10,
      },
      {
        type: "source",
        values: ["holy songbook", "unification hymnal"],
        weight: 9,
      },
      {
        type: "title_pattern",
        values: ["holy", "sacred", "divine"],
        weight: 7,
      },
    ],
  },
  {
    id: "new-holy",
    name: "New Holy Songs",
    description: "Modern additions to the holy canon",
    color: "purple",
    icon: Crown,
    mappingRules: [
      {
        type: "theme",
        values: ["new age", "restoration", "cheon il guk"],
        weight: 10,
      },
      {
        type: "source",
        values: ["recent compositions", "modern holy songs"],
        weight: 8,
      },
    ],
  },
  {
    id: "american-pioneer",
    name: "American Pioneer Songs",
    description:
      "Songs from American Unification pioneers like Joshua Cotter, Dan Fefferman",
    color: "green",
    icon: Users,
    mappingRules: [
      {
        type: "artist",
        values: ["joshua cotter", "dan fefferman", "julia moon"],
        weight: 10,
      },
      {
        type: "theme",
        values: ["pioneering", "witnessing", "generation of righteousness"],
        weight: 8,
      },
      {
        type: "source",
        values: ["american pioneers", "1970s-1980s"],
        weight: 7,
      },
    ],
  },
  {
    id: "contemporary-christian",
    name: "Contemporary Christian",
    description: "Modern worship songs from broader Christian traditions",
    color: "orange",
    icon: Music,
    mappingRules: [
      {
        type: "theme",
        values: ["praise", "contemporary worship", "modern christian"],
        weight: 9,
      },
      {
        type: "source",
        values: ["hillsong", "bethel", "elevation", "ccm"],
        weight: 8,
      },
      {
        type: "artist",
        values: ["chris tomlin", "hillsong", "bethel music"],
        weight: 8,
      },
    ],
  },
  {
    id: "classic-hymns",
    name: "Classic Hymns",
    description: "Traditional Christian hymns and timeless worship songs",
    color: "amber",
    icon: Cross,
    mappingRules: [
      {
        type: "theme",
        values: ["hymn", "traditional", "classic", "historic"],
        weight: 9,
      },
      {
        type: "source",
        values: ["hymnal", "traditional hymns", "church history"],
        weight: 8,
      },
      {
        type: "title_pattern",
        values: ["amazing grace", "how great thou art", "blessed assurance"],
        weight: 10,
      },
    ],
  },
  {
    id: "original-interchurch",
    name: "Original Interchurch",
    description: "User-contributed songs from various Unification communities",
    color: "teal",
    icon: Heart,
    mappingRules: [
      {
        type: "source",
        values: ["community submitted", "interchurch", "user contributed"],
        weight: 9,
      },
      {
        type: "theme",
        values: ["community", "fellowship", "local church"],
        weight: 7,
      },
    ],
  },
];

// Category assignment algorithm
export function assignSongCategories(song: Song): {
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
        case "source":
          if (
            song.source &&
            rule.values.some((value) =>
              song.source.toLowerCase().includes(value.toLowerCase()),
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
      }
    });

    if (score > 0) {
      categoryScores[category.id] = score;
    }
  });

  // Return categories with score >= 5 (configurable threshold)
  const categories = Object.entries(categoryScores)
    .filter(([_, score]) => score >= 5)
    .sort(([_, a], [__, b]) => b - a)
    .map(([categoryId]) => categoryId);

  return { categories, scores: categoryScores };
}

// Get category by ID
export function getCategoryById(
  categoryId: string,
): SpiritualCategory | undefined {
  return SPIRITUAL_CATEGORIES.find((cat) => cat.id === categoryId);
}

// Get category color class for Tailwind CSS
export function getCategoryColorClass(
  categoryId: string,
  type: "bg" | "text" | "border" = "bg",
): string {
  const category = getCategoryById(categoryId);
  if (!category) {
    return `${type}-gray-500`;
  }

  const colorMap: Record<string, string> = {
    blue: `${type}-blue-500`,
    purple: `${type}-purple-500`,
    green: `${type}-green-500`,
    orange: `${type}-orange-500`,
    amber: `${type}-amber-500`,
    teal: `${type}-teal-500`,
  };

  return colorMap[category.color] || `${type}-gray-500`;
}

// Get all available categories
export function getAllCategories(): SpiritualCategory[] {
  return SPIRITUAL_CATEGORIES;
}

// Get categories by song count (mock implementation - would be populated by API)
export function getCategoriesByPopularity(): string[] {
  return SPIRITUAL_CATEGORIES.sort((a, b) => a.name.localeCompare(b.name)).map(
    (cat) => cat.id,
  );
}

// Filter categories by search query
export function filterCategories(searchQuery: string): SpiritualCategory[] {
  if (!searchQuery.trim()) {
    return SPIRITUAL_CATEGORIES;
  }

  const query = searchQuery.toLowerCase();
  return SPIRITUAL_CATEGORIES.filter(
    (category) =>
      category.name.toLowerCase().includes(query) ||
      category.description.toLowerCase().includes(query) ||
      category.mappingRules.some((rule) =>
        rule.values.some((value) => value.toLowerCase().includes(query)),
      ),
  );
}

// Category slug utilities for URL routing
export function categoryIdToSlug(categoryId: string): string {
  return categoryId.replace(/_/g, "-");
}

export function slugToCategoryId(slug: string): string {
  return slug.replace(/-/g, "_");
}

// Get category breadcrumb path
export function getCategoryBreadcrumb(
  categoryId: string,
): { id: string; name: string }[] {
  const category = getCategoryById(categoryId);
  if (!category) {
    return [];
  }

  return [
    { id: "all", name: "All Categories" },
    { id: categoryId, name: category.name },
  ];
}
