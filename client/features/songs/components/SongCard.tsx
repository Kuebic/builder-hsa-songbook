import { useState, useMemo, memo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Heart,
  MoreHorizontal,
  Play,
  Plus,
  Star,
  Eye,
  Copy,
  Edit,
  Share,
} from "lucide-react";
import { ClientSong } from "../types/song.types";

// Constants moved outside component to prevent recreation
const DIFFICULTY_COLORS = {
  beginner: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  intermediate: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300", 
  advanced: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
} as const;

// Utility functions moved outside component to prevent recreation
const formatCount = (count: number): string => {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
};

const formatLastUsedDate = (date: Date): string => {
  return new Date(date).toLocaleDateString();
};

interface SongCardProps {
  song: ClientSong;
  onAddToSetlist?: (songId: string) => void;
  onToggleFavorite?: (songId: string) => void;
  showActions?: boolean;
  variant?: "default" | "compact";
}

function SongCard({
  song,
  onAddToSetlist,
  onToggleFavorite,
  showActions = true,
  variant = "default",
}: SongCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Memoize expensive date formatting
  const formattedLastUsed = useMemo(() => {
    return song.lastUsed ? formatLastUsedDate(song.lastUsed) : null;
  }, [song.lastUsed]);

  if (variant === "compact") {
    return (
      <Card className="group hover:shadow-md transition-all duration-200 cursor-pointer">
        <Link to={`/songs/${song.id}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">{song.title}</h3>
                <p className="text-xs text-muted-foreground truncate">
                  {song.artist}
                </p>
              </div>
              <div className="flex items-center space-x-2 ml-2">
                <Badge variant="outline" className="text-xs">
                  {song.key}
                </Badge>
                {song.tempo && (
                  <Badge variant="outline" className="text-xs">
                    {song.tempo} BPM
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Link>
      </Card>
    );
  }

  return (
    <Card
      className="group hover:shadow-lg transition-all duration-200 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/songs/${song.id}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate group-hover:text-worship transition-colors">
                {song.title}
              </h3>
              <p className="text-sm text-muted-foreground truncate">
                {song.artist}
              </p>
            </div>
            {showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  asChild
                  onClick={(e) => e.preventDefault()}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onAddToSetlist?.(song.id)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add to Setlist
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Share className="mr-2 h-4 w-4" />
                    Share
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>
      </Link>

      <CardContent className="pt-0">
        <Link to={`/songs/${song.id}`}>
          {/* Song metadata */}
          <div className="flex items-center space-x-3 mb-3">
            <Badge variant="outline" className="font-medium">
              Key: {song.key}
            </Badge>
            {song.tempo && <Badge variant="outline">{song.tempo} BPM</Badge>}
            <Badge
              variant="secondary"
              className={DIFFICULTY_COLORS[song.difficulty]}
            >
              {song.difficulty}
            </Badge>
          </div>

          {/* Chord preview */}
          {song.basicChords && song.basicChords.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-muted-foreground mb-1">
                Common chords:
              </p>
              <div className="flex flex-wrap gap-1">
                {song.basicChords.slice(0, 6).map((chord, index) => (
                  <span key={index} className="chord text-xs">
                    {chord}
                  </span>
                ))}
                {song.basicChords.length > 6 && (
                  <span className="text-xs text-muted-foreground">
                    +{song.basicChords.length - 6} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Themes */}
          {song.themes && song.themes.length > 0 && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-1">
                {song.themes.slice(0, 3).map((theme, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {theme}
                  </Badge>
                ))}
                {song.themes.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{song.themes.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </Link>
      </CardContent>

      <CardFooter className="pt-0 flex items-center justify-between">
        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Eye className="h-3 w-3" />
            <span>{formatCount(song.viewCount)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Star className="h-3 w-3 fill-current" />
            <span>{song.avgRating.toFixed(1)}</span>
          </div>
          {formattedLastUsed && (
            <span>Used {formattedLastUsed}</span>
          )}
        </div>

        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.preventDefault();
              onToggleFavorite?.(song.id);
            }}
          >
            <Heart
              className={`h-4 w-4 ${song.isFavorite ? "fill-red-500 text-red-500" : ""}`}
            />
          </Button>

          {isHovered && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 animate-fade-in"
              onClick={(e) => {
                e.preventDefault();
                // Handle quick play/preview
              }}
            >
              <Play className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

// Custom comparison function for React.memo
const arePropsEqual = (prevProps: SongCardProps, nextProps: SongCardProps): boolean => {
  const { song: prevSong, onAddToSetlist: prevOnAdd, onToggleFavorite: prevOnToggle, ...prevRest } = prevProps;
  const { song: nextSong, onAddToSetlist: nextOnAdd, onToggleFavorite: nextOnToggle, ...nextRest } = nextProps;

  // Compare primitive props
  if (prevRest.showActions !== nextRest.showActions || prevRest.variant !== nextRest.variant) {
    return false;
  }

  // Compare callback functions by reference (parent should use useCallback)
  if (prevOnAdd !== nextOnAdd || prevOnToggle !== nextOnToggle) {
    return false;
  }

  // Compare song object properties that affect rendering
  if (
    prevSong.id !== nextSong.id ||
    prevSong.title !== nextSong.title ||
    prevSong.artist !== nextSong.artist ||
    prevSong.key !== nextSong.key ||
    prevSong.tempo !== nextSong.tempo ||
    prevSong.difficulty !== nextSong.difficulty ||
    prevSong.viewCount !== nextSong.viewCount ||
    prevSong.avgRating !== nextSong.avgRating ||
    prevSong.isFavorite !== nextSong.isFavorite ||
    prevSong.lastUsed !== nextSong.lastUsed
  ) {
    return false;
  }

  // Compare basicChords array
  if (prevSong.basicChords.length !== nextSong.basicChords.length) {
    return false;
  }
  for (let i = 0; i < prevSong.basicChords.length; i++) {
    if (prevSong.basicChords[i] !== nextSong.basicChords[i]) {
      return false;
    }
  }

  // Compare themes array
  if (prevSong.themes.length !== nextSong.themes.length) {
    return false;
  }
  for (let i = 0; i < prevSong.themes.length; i++) {
    if (prevSong.themes[i] !== nextSong.themes[i]) {
      return false;
    }
  }

  return true;
};

// Export memoized component
export default memo(SongCard, arePropsEqual);
