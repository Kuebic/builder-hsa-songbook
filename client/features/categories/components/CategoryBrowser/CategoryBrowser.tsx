import { useCallback, useMemo } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { Layout } from "@/shared/components/Layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useCategoryBrowsing } from "../../hooks/useCategoryBrowsing";
import { getCategoryById } from "../../utils/categoryMappings";
import { getCategoryThemeColors } from "../../utils/categoryHelpers";
import { useUserId } from "@/shared/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useFilteredSongs } from "@features/songs/hooks/useFilteredSongs";
import { CategoryHeader } from "./CategoryHeader";
import { CategoryPagination } from "./CategoryPagination";
import { SongsFilterBar } from "@features/songs/components/SongsPage/SongsFilterBar";
import { SongsList } from "@features/songs/components/SongsPage/SongsList";

export function CategoryBrowser() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [searchParams] = useSearchParams();
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
    sortBy: searchParams.get('sort') || 'popular',
    searchQuery: searchParams.get('search') || '',
  });
  
  const songs = categoryData?.data || [];
  const pagination = categoryData?.meta?.pagination;
  
  // Use the shared filtering hook
  const {
    filters,
    isPending,
    hasActiveFilters,
    filteredSongs,
    availableKeys,
    availableThemes,
    updateFilter,
    clearFilters,
  } = useFilteredSongs({ 
    songs,
    defaultSort: 'popular'
  });
  
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
  
  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        <CategoryHeader 
          category={categoryConfig}
          themeColors={themeColors}
          totalSongs={pagination?.total}
        />
        
        <SongsFilterBar
          filters={filters}
          availableKeys={availableKeys}
          availableThemes={availableThemes}
          isPending={isPending}
          hasActiveFilters={hasActiveFilters}
          onFilterChange={updateFilter}
          onClearFilters={clearFilters}
        />
        
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
          
          <SongsList
            songs={filteredSongs}
            viewMode={filters.viewMode}
            isLoading={isLoading}
            isPending={isPending}
            error={error}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
            onToggleFavorite={handleToggleFavorite}
            onAddToSetlist={handleAddToSetlist}
          />
        </div>
        
        <CategoryPagination pagination={pagination} />
      </div>
    </Layout>
  );
}