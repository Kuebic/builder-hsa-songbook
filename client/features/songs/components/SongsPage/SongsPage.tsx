import { useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Layout } from "@/shared/components/Layout";
import { useSongs } from "../../hooks/useSongsAPI";
import { useFilteredSongs } from "../../hooks/useFilteredSongs";
import { useUserId } from "@/shared/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { SongsPageHeader } from "./SongsPageHeader";
import { SongsFilterBar } from "./SongsFilterBar";
import { SongsList } from "./SongsList";

export default function SongsPage() {
  const [searchParams] = useSearchParams();
  const userId = useUserId();
  const { toast } = useToast();

  // Fetch songs with search parameters
  const {
    data: songs = [],
    isLoading: songsLoading,
    error: songsError,
  } = useSongs();

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
  } = useFilteredSongs({ songs });

  // Handle direct navigation with category parameter
  useEffect(() => {
    const categoryParam = searchParams.get("category");
    if (categoryParam && categoryParam !== filters.selectedCategory) {
      updateFilter("selectedCategory", categoryParam);
    }
  }, [searchParams, filters.selectedCategory, updateFilter]);

  // Authentication-dependent functionality
  const handleToggleFavorite = useCallback(
    async (_songId: string) => {
      if (!userId) {
        toast({
          title: "Authentication required",
          description: "Please sign in to save favorites",
          variant: "default",
        });
        return;
      }
      // TODO: Implement favorites toggle with API call
    },
    [userId, toast],
  );

  const handleAddToSetlist = useCallback(
    (_songId: string) => {
      if (!userId) {
        toast({
          title: "Authentication required",
          description: "Please sign in to add songs to setlists",
          variant: "default",
        });
        return;
      }
      // TODO: Implement add to setlist functionality
    },
    [userId, toast],
  );

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        <SongsPageHeader songCount={filteredSongs.length} />

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
              Browse Songs
              {isPending && (
                <span className="ml-2 text-sm text-muted-foreground">
                  (Filtering...)
                </span>
              )}
            </h2>
          </div>

          <SongsList
            songs={filteredSongs}
            viewMode={filters.viewMode}
            isLoading={songsLoading}
            isPending={isPending}
            error={songsError}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
            onToggleFavorite={handleToggleFavorite}
            onAddToSetlist={handleAddToSetlist}
          />
        </div>
      </div>
    </Layout>
  );
}
