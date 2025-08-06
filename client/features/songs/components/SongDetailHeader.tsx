import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SongWithRelations } from "@features/songs/types/song.types";

export interface SongDetailHeaderProps {
  song: SongWithRelations;
  onToggleFavorite: () => void;
  onAddArrangement: () => void;
}

export default function SongDetailHeader({
  song,
  onToggleFavorite,
  onAddArrangement,
}: SongDetailHeaderProps) {
  return (
    <div className="space-y-4 pb-6 border-b">
      {/* Title & Artist */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{song.title}</h1>
        {song.artist && (
          <p className="text-xl text-muted-foreground mt-1">{song.artist}</p>
        )}
      </div>

      {/* Source & Year */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>{song.source}</span>
        {song.compositionYear && <span>• {song.compositionYear}</span>}
        {song.ccli && <span>• CCLI: {song.ccli}</span>}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <Button
          variant={song.isFavorited ? "default" : "outline"}
          onClick={onToggleFavorite}
          className="gap-2"
        >
          <Heart
            className={cn("h-4 w-4", song.isFavorited && "fill-current")}
          />
          {song.favoriteCount} Favorites
        </Button>

        <Button onClick={onAddArrangement} className="gap-2">
          <Plus className="h-4 w-4" />
          Add New Arrangement
        </Button>
      </div>

      {/* Themes */}
      {song.themes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {song.themes.map((theme) => (
            <Badge key={theme} variant="secondary">
              {theme}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
