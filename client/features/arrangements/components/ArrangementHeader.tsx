import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Heart, Star, ListMusic, Key, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ArrangementWithMetrics } from "@/features/songs/types/song.types";

interface ArrangementHeaderProps {
  arrangement: ArrangementWithMetrics;
  songTitle: string;
  songArtist: string;
  isFavorited: boolean;
  onToggleFavorite: () => void;
  onEdit: () => void;
  onAddToSetlist: () => void;
  onBack: () => void;
}

export function ArrangementHeader({
  arrangement,
  songTitle,
  songArtist,
  isFavorited,
  onToggleFavorite,
  onEdit,
  onAddToSetlist,
  onBack,
}: ArrangementHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{songTitle}</h1>
          <p className="text-xl text-muted-foreground">{songArtist}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="font-medium">
              <Key className="h-3 w-3 mr-1" />
              {arrangement.metadata.key}
            </Badge>
            {arrangement.metadata.capo && (
              <Badge variant="secondary">Capo {arrangement.metadata.capo}</Badge>
            )}
            {arrangement.metadata.tempo && (
              <Badge variant="outline">
                <Clock className="h-3 w-3 mr-1" />
                {arrangement.metadata.tempo} BPM
              </Badge>
            )}
            {arrangement.metadata.timeSignature && (
              <Badge variant="outline">{arrangement.metadata.timeSignature}</Badge>
            )}
            {arrangement.metadata?.difficulty && (
              <Badge
                variant="outline"
                className={cn(
                  arrangement.metadata.difficulty === "beginner" &&
                    "bg-green-100 text-green-800",
                  arrangement.metadata.difficulty === "intermediate" &&
                    "bg-yellow-100 text-yellow-800",
                  arrangement.metadata.difficulty === "advanced" &&
                    "bg-red-100 text-red-800"
                )}
              >
                {arrangement.metadata.difficulty.charAt(0).toUpperCase() +
                  arrangement.metadata.difficulty.slice(1)}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant={isFavorited ? "default" : "outline"}
            size="sm"
            onClick={onToggleFavorite}
          >
            <Heart className={cn("h-4 w-4 mr-2", isFavorited && "fill-current")} />
            {isFavorited ? "Favorited" : "Favorite"}
          </Button>
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button size="sm" onClick={onAddToSetlist}>
            <ListMusic className="h-4 w-4 mr-2" />
            Add to Setlist
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        {arrangement.rating.count > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-4 w-4",
                    i < Math.floor(arrangement.rating.average)
                      ? "text-yellow-500 fill-yellow-500"
                      : "text-gray-300"
                  )}
                />
              ))}
            </div>
            <span className="font-medium">{arrangement.rating.average.toFixed(1)}</span>
            <span>({arrangement.rating.count} reviews)</span>
          </div>
        )}

        {arrangement.favoriteCount > 0 && (
          <span className="flex items-center gap-1">
            <Heart className="h-3 w-3" />
            {arrangement.favoriteCount} favorites
          </span>
        )}

        {arrangement.setlistCount > 0 && (
          <span className="flex items-center gap-1">
            <ListMusic className="h-3 w-3" />
            Used in {arrangement.setlistCount} setlists
          </span>
        )}
      </div>
    </div>
  );
}