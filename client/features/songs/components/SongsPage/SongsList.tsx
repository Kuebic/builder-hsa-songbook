import { Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import SongCard from "../SongCard";
import { ClientSong } from "../../types/song.types";
import { ViewMode } from "../../hooks/useFilteredSongs";

export interface SongsListProps {
  songs: ClientSong[];
  viewMode: ViewMode;
  isLoading: boolean;
  isPending: boolean;
  error?: any;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onToggleFavorite: (songId: string) => void;
  onAddToSetlist: (songId: string) => void;
}

export function SongsList({
  songs,
  viewMode,
  isLoading,
  isPending,
  error,
  hasActiveFilters,
  onClearFilters,
  onToggleFavorite,
  onAddToSetlist,
}: SongsListProps) {
  // Loading state
  if (isLoading || isPending) {
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

  // Error state
  if (error) {
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

  // Empty state
  if (songs.length === 0) {
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
            <Button variant="outline" onClick={onClearFilters}>
              Clear Filters
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Songs display
  return (
    <div
      className={
        viewMode === "grid"
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          : "space-y-3"
      }
    >
      {songs.map((song) => (
        <SongCard
          key={song.id}
          song={song}
          variant={viewMode === "list" ? "compact" : "default"}
          onToggleFavorite={onToggleFavorite}
          onAddToSetlist={onAddToSetlist}
        />
      ))}
    </div>
  );
}