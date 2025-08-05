// This file re-exports the refactored SongsPage component for backward compatibility
export { default } from "./SongsPage/SongsPage";

// Legacy implementation below (can be removed once all imports are updated)
import { useState, useMemo, useCallback, useDeferredValue, useTransition, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search,
  Filter,
  Grid,
  List,
  TrendingUp,
  Clock,
  Star,
  Music,
} from "lucide-react";
import { Layout } from "@/shared/components/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { useSongs } from "../hooks/useSongsAPI";
import SongCard from "./SongCard";
import { useUserId } from "@/shared/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { SPIRITUAL_CATEGORIES } from "@features/categories/utils/categoryMappings";
import { getCategoryById, assignClientSongCategories } from "@features/categories";

type ViewMode = "grid" | "list";
type SortOption = "recent" | "popular" | "title" | "rating";

export default function SongsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize state from URL parameters
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [viewMode, setViewMode] = useState<ViewMode>((searchParams.get('view') as ViewMode) || 'grid');
  const [sortBy, setSortBy] = useState<SortOption>((searchParams.get('sort') as SortOption) || 'recent');
  const [selectedKey, setSelectedKey] = useState<string>(searchParams.get('key') || 'all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>(searchParams.get('difficulty') || 'all');
  const [selectedTheme, setSelectedTheme] = useState<string>(searchParams.get('theme') || 'all');
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || 'all');

  // React 18 performance optimizations
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [isPending, startTransition] = useTransition();

  // Handle direct navigation with category parameter
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam && categoryParam !== selectedCategory) {
      setSelectedCategory(categoryParam);
    }
  }, [searchParams, selectedCategory]);

  // Get user ID from authentication context
  const userId = useUserId();
  const { toast } = useToast();
  
  // Fetch songs with search parameters
  const songsParams = useMemo(() => {
    const params: any = {};
    if (deferredSearchQuery) params.search = deferredSearchQuery;
    if (selectedKey !== 'all') params.key = selectedKey;
    if (selectedDifficulty !== 'all') params.difficulty = selectedDifficulty;
    if (selectedTheme !== 'all') params.themes = selectedTheme;
    if (selectedCategory !== 'all') params.category = selectedCategory;
    return params;
  }, [deferredSearchQuery, selectedKey, selectedDifficulty, selectedTheme, selectedCategory]);

  const {
    data: songs = [],
    isLoading: songsLoading,
    error: songsError,
  } = useSongs(songsParams);

  // Filter and sort songs client-side for immediate feedback
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

  const clearFilters = useCallback(() => {
    startTransition(() => {
      setSearchQuery("");
      setSelectedKey("all");
      setSelectedDifficulty("all");
      setSelectedTheme("all");
      setSelectedCategory("all");
      setSortBy("recent");
      setSearchParams({});
    });
  }, [setSearchParams]);

  const hasActiveFilters =
    searchQuery ||
    (selectedKey && selectedKey !== "all") ||
    (selectedDifficulty && selectedDifficulty !== "all") ||
    (selectedTheme && selectedTheme !== "all") ||
    (selectedCategory && selectedCategory !== "all") ||
    sortBy !== "recent";

  // Event handlers with URL state updates
  const handleSearchChange = useCallback((value: string) => {
    startTransition(() => {
      setSearchQuery(value);
      updateSearchParams({ search: value });
    });
  }, [updateSearchParams]);

  const handleKeyChange = useCallback((value: string) => {
    startTransition(() => {
      setSelectedKey(value);
      updateSearchParams({ key: value });
    });
  }, [updateSearchParams]);

  const handleDifficultyChange = useCallback((value: string) => {
    startTransition(() => {
      setSelectedDifficulty(value);
      updateSearchParams({ difficulty: value });
    });
  }, [updateSearchParams]);

  const handleThemeChange = useCallback((value: string) => {
    startTransition(() => {
      setSelectedTheme(value);
      updateSearchParams({ theme: value });
    });
  }, [updateSearchParams]);

  const handleSortChange = useCallback((value: SortOption) => {
    startTransition(() => {
      setSortBy(value);
      updateSearchParams({ sort: value });
    });
  }, [updateSearchParams]);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    startTransition(() => {
      setViewMode(mode);
      updateSearchParams({ view: mode });
    });
  }, [updateSearchParams]);

  const handleCategoryChange = useCallback((value: string) => {
    startTransition(() => {
      setSelectedCategory(value);
      updateSearchParams({ category: value });
    });
  }, [updateSearchParams]);

  // Authentication-dependent functionality
  const handleToggleFavorite = useCallback(async (_songId: string) => {
    if (!userId) {
      toast({
        title: "Authentication required",
        description: "Please sign in to save favorites",
        variant: "default",
      });
      return;
    }
    // TODO: Implement favorites toggle with API call
  }, [userId, toast]);

  const handleAddToSetlist = useCallback((_songId: string) => {
    if (!userId) {
      toast({
        title: "Authentication required",
        description: "Please sign in to add songs to setlists",
        variant: "default",
      });
      return;
    }
    // TODO: Implement add to setlist functionality
  }, [userId, toast]);

  const renderSearchAndFilters = () => (
    <div className="space-y-4 mb-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search songs, artists, or themes..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-muted-foreground" />

          <Select value={selectedKey} onValueChange={handleKeyChange}>
            <SelectTrigger className="w-24">
              <SelectValue placeholder="Key" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Keys</SelectItem>
              {availableKeys.map((key) => (
                <SelectItem key={key} value={key}>
                  {key}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedDifficulty} onValueChange={handleDifficultyChange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedTheme} onValueChange={handleThemeChange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Theme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Themes</SelectItem>
              {availableThemes.map((theme) => (
                <SelectItem key={theme} value={theme}>
                  {theme}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {SPIRITUAL_CATEGORIES.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={sortBy}
            onValueChange={handleSortChange}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4" />
                  Recent
                </div>
              </SelectItem>
              <SelectItem value="popular">
                <div className="flex items-center">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Popular
                </div>
              </SelectItem>
              <SelectItem value="rating">
                <div className="flex items-center">
                  <Star className="mr-2 h-4 w-4" />
                  Top Rated
                </div>
              </SelectItem>
              <SelectItem value="title">
                <div className="flex items-center">
                  <Music className="mr-2 h-4 w-4" />
                  A-Z
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {hasActiveFilters && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearFilters}
              disabled={isPending}
            >
              Clear Filters
            </Button>
          )}

          <div className="flex border rounded-md">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => handleViewModeChange("grid")}
              className="rounded-r-none"
              disabled={isPending}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => handleViewModeChange("list")}
              className="rounded-l-none"
              disabled={isPending}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {searchQuery && (
            <Badge variant="secondary">{`Search: "${searchQuery}"`}</Badge>
          )}
          {selectedKey && selectedKey !== "all" && (
            <Badge variant="secondary">Key: {selectedKey}</Badge>
          )}
          {selectedDifficulty && selectedDifficulty !== "all" && (
            <Badge variant="secondary">Difficulty: {selectedDifficulty}</Badge>
          )}
          {selectedTheme && selectedTheme !== "all" && (
            <Badge variant="secondary">Theme: {selectedTheme}</Badge>
          )}
          {selectedCategory && selectedCategory !== "all" && (
            <Badge variant="secondary">
              Category: {getCategoryById(selectedCategory)?.name || selectedCategory}
            </Badge>
          )}
          {sortBy !== "recent" && (
            <Badge variant="secondary">Sort: {sortBy}</Badge>
          )}
        </div>
      )}
    </div>
  );

  const renderSongsList = () => {
    if (songsLoading || isPending) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (songsError) {
      return (
        <Card className="p-8 text-center">
          <CardContent>
            <p className="text-muted-foreground">
              Unable to load songs. Please try again later.
            </p>
          </CardContent>
        </Card>
      );
    }

    if (filteredSongs.length === 0) {
      return (
        <Card className="p-8 text-center">
          <CardContent>
            <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No songs found</h3>
            <p className="text-muted-foreground mb-4">
              {hasActiveFilters
                ? "Try adjusting your filters to find more songs."
                : "Be the first to add songs to the community!"}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      );
    }

    return (
      <div
        className={
          viewMode === "grid"
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            : "space-y-3"
        }
      >
        {filteredSongs.map((song) => (
          <SongCard
            key={song.id}
            song={song}
            variant={viewMode === "list" ? "compact" : "default"}
            onToggleFavorite={handleToggleFavorite}
            onAddToSetlist={handleAddToSetlist}
          />
        ))}
      </div>
    );
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Songs Library</h1>
            <p className="text-muted-foreground mt-1">
              Discover and explore our collection of worship songs
            </p>
          </div>
          {filteredSongs.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {filteredSongs.length} {filteredSongs.length === 1 ? "song" : "songs"}
            </div>
          )}
        </div>

        {renderSearchAndFilters()}

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              Browse Songs
              {isPending && (
                <span className="ml-2 text-sm text-muted-foreground">
                  (Filtering...)
                </span>
              )}
            </h2>
          </div>
          {renderSongsList()}
        </div>
      </div>
    </Layout>
  );
}