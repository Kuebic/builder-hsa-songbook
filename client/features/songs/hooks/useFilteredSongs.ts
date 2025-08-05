import { useState, useMemo, useCallback, useDeferredValue, useTransition } from "react";
import { useSearchParams } from "react-router-dom";
import { ClientSong } from "../types/song.types";
import { assignClientSongCategories } from "@features/categories";

export type ViewMode = "grid" | "list";
export type SortOption = "recent" | "popular" | "title" | "rating";

export interface FilterState {
  searchQuery: string;
  selectedKey: string;
  selectedDifficulty: string;
  selectedTheme: string;
  selectedCategory: string;
  sortBy: SortOption;
  viewMode: ViewMode;
}

export interface UseFilteredSongsOptions {
  songs: ClientSong[];
  defaultSort?: SortOption;
  defaultView?: ViewMode;
}

export interface UseFilteredSongsReturn {
  // State
  filters: FilterState;
  deferredSearchQuery: string;
  isPending: boolean;
  hasActiveFilters: boolean;
  
  // Filtered data
  filteredSongs: ClientSong[];
  availableKeys: string[];
  availableThemes: string[];
  
  // Update handlers
  updateFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  clearFilters: () => void;
  updateSearchParams: (updates: Record<string, string | null>) => void;
}

export function useFilteredSongs({
  songs,
  defaultSort = "recent",
  defaultView = "grid"
}: UseFilteredSongsOptions): UseFilteredSongsReturn {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize state from URL parameters
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [viewMode, setViewMode] = useState<ViewMode>((searchParams.get('view') as ViewMode) || defaultView);
  const [sortBy, setSortBy] = useState<SortOption>((searchParams.get('sort') as SortOption) || defaultSort);
  const [selectedKey, setSelectedKey] = useState<string>(searchParams.get('key') || 'all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>(searchParams.get('difficulty') || 'all');
  const [selectedTheme, setSelectedTheme] = useState<string>(searchParams.get('theme') || 'all');
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || 'all');
  
  // React 18 performance optimizations
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [isPending, startTransition] = useTransition();
  
  // Filter and sort songs
  const filteredSongs = useMemo(() => {
    const filtered = songs.filter((song) => {
      const matchesSearch =
        !deferredSearchQuery ||
        song.title.toLowerCase().includes(deferredSearchQuery.toLowerCase()) ||
        song.artist?.toLowerCase().includes(deferredSearchQuery.toLowerCase()) ||
        song.themes?.some(theme => theme.toLowerCase().includes(deferredSearchQuery.toLowerCase()));

      const matchesKey =
        !selectedKey || selectedKey === "all" || song.key === selectedKey;
      const matchesDifficulty =
        !selectedDifficulty ||
        selectedDifficulty === "all" ||
        song.difficulty === selectedDifficulty;
      const matchesTheme =
        !selectedTheme ||
        selectedTheme === "all" ||
        song.themes?.includes(selectedTheme);

      // Category filtering using category assignment algorithm
      const matchesCategory = !selectedCategory || selectedCategory === "all" || (() => {
        const { categories } = assignClientSongCategories(song);
        return categories.includes(selectedCategory);
      })();

      return matchesSearch && matchesKey && matchesDifficulty && matchesTheme && matchesCategory;
    });

    // Sort songs
    switch (sortBy) {
      case "popular":
        filtered.sort((a, b) => b.viewCount - a.viewCount);
        break;
      case "rating":
        filtered.sort((a, b) => b.avgRating - a.avgRating);
        break;
      case "title":
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "recent":
      default:
        // Already sorted by recent (assuming API returns in creation order)
        break;
    }

    return filtered;
  }, [
    songs,
    deferredSearchQuery,
    selectedKey,
    selectedDifficulty,
    selectedTheme,
    selectedCategory,
    sortBy,
  ]);
  
  // Get unique values for filters
  const availableKeys = useMemo(() => {
    const keys = [...new Set(songs.map((song) => song.key).filter(Boolean))] as string[];
    return keys.sort();
  }, [songs]);

  const availableThemes = useMemo(() => {
    const themes = [...new Set(songs.flatMap((song) => song.themes || []))];
    return themes.sort();
  }, [songs]);
  
  // URL state management
  const updateSearchParams = useCallback((updates: Record<string, string | null>) => {
    const newSearchParams = new URLSearchParams(searchParams);
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== '') {
        newSearchParams.set(key, value);
      } else {
        newSearchParams.delete(key);
      }
    });
    
    setSearchParams(newSearchParams);
  }, [searchParams, setSearchParams]);
  
  // Generic filter update handler
  const updateFilter = useCallback(<K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    startTransition(() => {
      switch (key) {
        case 'searchQuery':
          setSearchQuery(value as string);
          updateSearchParams({ search: value as string });
          break;
        case 'selectedKey':
          setSelectedKey(value as string);
          updateSearchParams({ key: value as string });
          break;
        case 'selectedDifficulty':
          setSelectedDifficulty(value as string);
          updateSearchParams({ difficulty: value as string });
          break;
        case 'selectedTheme':
          setSelectedTheme(value as string);
          updateSearchParams({ theme: value as string });
          break;
        case 'selectedCategory':
          setSelectedCategory(value as string);
          updateSearchParams({ category: value as string });
          break;
        case 'sortBy':
          setSortBy(value as SortOption);
          updateSearchParams({ sort: value as string });
          break;
        case 'viewMode':
          setViewMode(value as ViewMode);
          updateSearchParams({ view: value as string });
          break;
      }
    });
  }, [updateSearchParams]);
  
  const clearFilters = useCallback(() => {
    startTransition(() => {
      setSearchQuery("");
      setSelectedKey("all");
      setSelectedDifficulty("all");
      setSelectedTheme("all");
      setSelectedCategory("all");
      setSortBy(defaultSort);
      setSearchParams({});
    });
  }, [defaultSort, setSearchParams]);
  
  const hasActiveFilters =
    searchQuery ||
    (selectedKey && selectedKey !== "all") ||
    (selectedDifficulty && selectedDifficulty !== "all") ||
    (selectedTheme && selectedTheme !== "all") ||
    (selectedCategory && selectedCategory !== "all") ||
    sortBy !== defaultSort;
  
  return {
    filters: {
      searchQuery,
      selectedKey,
      selectedDifficulty,
      selectedTheme,
      selectedCategory,
      sortBy,
      viewMode,
    },
    deferredSearchQuery,
    isPending,
    hasActiveFilters,
    filteredSongs,
    availableKeys,
    availableThemes,
    updateFilter,
    clearFilters,
    updateSearchParams,
  };
}