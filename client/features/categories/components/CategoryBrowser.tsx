// This file re-exports the refactored CategoryBrowser component for backward compatibility
export { CategoryBrowser } from "./CategoryBrowser/CategoryBrowser";

// Legacy implementation below (can be removed once all imports are updated)
import { useState, useMemo, useCallback, useDeferredValue, useTransition } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import {
  Search,
  Filter,
  Grid,
  List,
  TrendingUp,
  Clock,
  Star,
  Music,
  Home,
  ArrowLeft,
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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCategoryBrowsing } from "../hooks/useCategoryBrowsing";
import { getCategoryById } from "../utils/categoryMappings";
import { getCategoryThemeColors } from "../utils/categoryHelpers";
import SongCard from "@features/songs/components/SongCard";
import { useUserId } from "@/shared/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

type ViewMode = "grid" | "list";
type SortOption = "popular" | "recent" | "rating" | "title";

export function CategoryBrowser() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize state from URL parameters
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [viewMode, setViewMode] = useState<ViewMode>((searchParams.get('view') as ViewMode) || 'grid');
  const [sortBy, setSortBy] = useState<SortOption>((searchParams.get('sort') as SortOption) || 'popular');
  const [selectedKey, setSelectedKey] = useState<string>(searchParams.get('key') || 'all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>(searchParams.get('difficulty') || 'all');
  
  // React 18 performance optimizations
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [isPending, startTransition] = useTransition();
  
  // Get user context
  const userId = useUserId();
  const { toast } = useToast();
  
  // Get category configuration
  const categoryConfig = categoryId ? getCategoryById(categoryId) : null;
  const themeColors = categoryId ? getCategoryThemeColors(categoryId) : null;
  
  // Fetch category songs
  const currentPage = parseInt(searchParams.get('page') || '1');
  const { data: categoryData, isLoading, error } = useCategoryBrowsing({
    categoryId: categoryId || '',
    page: currentPage,
    limit: 20,
    sortBy,
    searchQuery: deferredSearchQuery,
  });
  
  const songs = categoryData?.data || [];
  const pagination = categoryData?.meta?.pagination;
  
  // Client-side filtering for immediate feedback
  const filteredSongs = useMemo(() => {
    return songs.filter((song) => {
      const matchesKey = !selectedKey || selectedKey === "all" || song.key === selectedKey;
      const matchesDifficulty = !selectedDifficulty || selectedDifficulty === "all" || song.difficulty === selectedDifficulty;
      return matchesKey && matchesDifficulty;
    });
  }, [songs, selectedKey, selectedDifficulty]);
  
  // Get unique values for filters from current songs
  const availableKeys = useMemo(() => {
    const keys = [...new Set(songs.map((song) => song.key).filter(Boolean))] as string[];
    return keys.sort();
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
      setSortBy("popular");
      const newParams = new URLSearchParams(searchParams);
      ['search', 'key', 'difficulty', 'sort'].forEach(key => newParams.delete(key));
      setSearchParams(newParams);
    });
  }, [searchParams, setSearchParams]);
  
  const hasActiveFilters = searchQuery || (selectedKey && selectedKey !== "all") || (selectedDifficulty && selectedDifficulty !== "all");
  
  // Event handlers
  const handleSearchChange = useCallback((value: string) => {
    startTransition(() => {
      setSearchQuery(value);
      updateSearchParams({ search: value, page: null }); // Reset page on search
    });
  }, [updateSearchParams]);
  
  const handleSortChange = useCallback((value: SortOption) => {
    startTransition(() => {
      setSortBy(value);
      updateSearchParams({ sort: value, page: null }); // Reset page on sort change
    });
  }, [updateSearchParams]);
  
  const handleViewModeChange = useCallback((mode: ViewMode) => {
    startTransition(() => {
      setViewMode(mode);
      updateSearchParams({ view: mode });
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
  
  // Handle invalid category
  if (!categoryId || !categoryConfig) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto py-16">
          <Alert className="border-destructive">
            <AlertDescription>
              Category not found. Please check the URL or go back to browse all categories.
            </AlertDescription>
          </Alert>
          <div className="mt-6 flex justify-center">
            <Button asChild>
              <Link to="/songs">Browse All Songs</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }
  
  const IconComponent = categoryConfig.icon;
  
  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumb Navigation */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/"><Home className="h-4 w-4" /></Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/songs">Songs</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{categoryConfig.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        {/* Category Header */}
        <div className={`rounded-lg border p-6 ${themeColors?.background} ${themeColors?.border}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-lg ${themeColors?.text} bg-white/80`}>
                <IconComponent className="h-8 w-8" />
              </div>
              <div>
                <h1 className={`text-3xl font-bold ${themeColors?.text}`}>{categoryConfig.name}</h1>
                <p className="text-muted-foreground mt-2 max-w-2xl">
                  {categoryConfig.description}
                </p>
                {pagination && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {pagination.total} {pagination.total === 1 ? 'song' : 'songs'} in this category
                  </p>
                )}
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link to="/songs">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to All Songs
              </Link>
            </Button>
          </div>
        </div>
        
        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search within ${categoryConfig.name}...`}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              
              {availableKeys.length > 0 && (
                <Select value={selectedKey} onValueChange={(value) => {
                  startTransition(() => {
                    setSelectedKey(value);
                    updateSearchParams({ key: value });
                  });
                }}>
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
              )}
              
              <Select value={selectedDifficulty} onValueChange={(value) => {
                startTransition(() => {
                  setSelectedDifficulty(value);
                  updateSearchParams({ difficulty: value });
                });
              }}>
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
              
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">
                    <div className="flex items-center">
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Popular
                    </div>
                  </SelectItem>
                  <SelectItem value="recent">
                    <div className="flex items-center">
                      <Clock className="mr-2 h-4 w-4" />
                      Recent
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
                <Button variant="outline" size="sm" onClick={clearFilters} disabled={isPending}>
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
            </div>
          )}
        </div>
        
        {/* Songs Display */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              Songs in {categoryConfig.name}
              {isPending && (
                <span className="ml-2 text-sm text-muted-foreground">
                  (Filtering...)
                </span>
              )}
            </h2>
            {filteredSongs.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Showing {filteredSongs.length} of {pagination?.total || 0} songs
              </div>
            )}
          </div>
          
          {/* Songs List */}
          {isLoading || isPending ? (
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
          ) : error ? (
            <Card className="p-8 text-center">
              <CardContent>
                <p className="text-muted-foreground">
                  Unable to load songs for this category. Please try again later.
                </p>
              </CardContent>
            </Card>
          ) : filteredSongs.length === 0 ? (
            <Card className="p-8 text-center">
              <CardContent>
                <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No songs found</h3>
                <p className="text-muted-foreground mb-4">
                  {hasActiveFilters
                    ? "Try adjusting your filters to find more songs in this category."
                    : "No songs have been categorized here yet."}
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
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
          )}
        </div>
        
        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasPrevPage}
                asChild={pagination.hasPrevPage}
              >
                <Link 
                  to={pagination.hasPrevPage ? `?${new URLSearchParams({...Object.fromEntries(searchParams), page: String(pagination.page - 1)}).toString()}` : '#'}
                >
                  Previous
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasNextPage}
                asChild={pagination.hasNextPage}
              >
                <Link 
                  to={pagination.hasNextPage ? `?${new URLSearchParams({...Object.fromEntries(searchParams), page: String(pagination.page + 1)}).toString()}` : '#'}
                >
                  Next
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}