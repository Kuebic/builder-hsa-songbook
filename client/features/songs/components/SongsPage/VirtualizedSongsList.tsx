import { useRef, useCallback, useEffect, useState, memo } from "react";
import { FixedSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import SongCard from "../SongCard";
import { ClientSong } from "../../types/song.types";
import { ViewMode } from "../../hooks/useFilteredSongs";

const CARD_HEIGHT = 160; // Approximate height for grid cards
const LIST_ITEM_HEIGHT = 80; // Height for list items
const GRID_GAP = 16;

export interface VirtualizedSongsListProps {
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

interface GridRowProps {
  index: number;
  style: React.CSSProperties;
  data: {
    songs: ClientSong[];
    itemsPerRow: number;
    viewMode: ViewMode;
    onToggleFavorite: (songId: string) => void;
    onAddToSetlist: (songId: string) => void;
  };
}

/**
 * Renders a row of songs in grid view or a single song in list view
 */
const GridRow = memo<GridRowProps>(({ index, style, data }) => {
  const { songs, itemsPerRow, viewMode, onToggleFavorite, onAddToSetlist } = data;
  
  if (viewMode === "list") {
    const song = songs[index];
    if (!song) return null;
    
    return (
      <div style={style}>
        <SongCard
          song={song}
          variant="compact"
          onToggleFavorite={onToggleFavorite}
          onAddToSetlist={onAddToSetlist}
        />
      </div>
    );
  }
  
  // Grid view - render multiple items per row
  const startIndex = index * itemsPerRow;
  const endIndex = Math.min(startIndex + itemsPerRow, songs.length);
  const rowSongs = songs.slice(startIndex, endIndex);
  
  return (
    <div style={style}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-1">
        {rowSongs.map((song) => (
          <SongCard
            key={song.id}
            song={song}
            variant="default"
            onToggleFavorite={onToggleFavorite}
            onAddToSetlist={onAddToSetlist}
          />
        ))}
        {/* Fill empty cells to maintain grid layout */}
        {rowSongs.length < itemsPerRow && 
          Array.from({ length: itemsPerRow - rowSongs.length }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))
        }
      </div>
    </div>
  );
});

GridRow.displayName = "GridRow";

export function VirtualizedSongsList({
  songs,
  viewMode,
  isLoading,
  isPending,
  error,
  hasActiveFilters,
  onClearFilters,
  onToggleFavorite,
  onAddToSetlist,
}: VirtualizedSongsListProps) {
  const [itemsPerRow, setItemsPerRow] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Calculate items per row based on container width
  const updateItemsPerRow = useCallback(() => {
    if (viewMode === "list") {
      setItemsPerRow(1);
      return;
    }
    
    if (containerRef.current) {
      const width = containerRef.current.offsetWidth;
      if (width >= 1024) {
        setItemsPerRow(3); // lg:grid-cols-3
      } else if (width >= 768) {
        setItemsPerRow(2); // md:grid-cols-2
      } else {
        setItemsPerRow(1);
      }
    }
  }, [viewMode]);
  
  useEffect(() => {
    updateItemsPerRow();
    window.addEventListener("resize", updateItemsPerRow);
    return () => window.removeEventListener("resize", updateItemsPerRow);
  }, [updateItemsPerRow]);
  
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
  
  // Calculate virtualization parameters
  const itemHeight = viewMode === "list" ? LIST_ITEM_HEIGHT : CARD_HEIGHT + GRID_GAP;
  const itemCount = viewMode === "list" 
    ? songs.length 
    : Math.ceil(songs.length / itemsPerRow);
  
  // Virtualized songs display
  return (
    <div ref={containerRef} className="h-full min-h-[600px]">
      <AutoSizer>
        {({ height, width }) => (
          <List
            height={height}
            width={width}
            itemCount={itemCount}
            itemSize={itemHeight}
            itemData={{
              songs,
              itemsPerRow,
              viewMode,
              onToggleFavorite,
              onAddToSetlist,
            }}
            overscanCount={3}
          >
            {GridRow}
          </List>
        )}
      </AutoSizer>
    </div>
  );
}

export default VirtualizedSongsList;