import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Heart,
  MoreVertical,
  Edit,
  Share,
  Copy,
  Trash2,
  Download,
  ChevronLeft,
} from "lucide-react";
import { Link } from "react-router-dom";
import { ClientSong } from "../types/song.types";

export interface SongHeaderProps {
  song: ClientSong;
  onToggleFavorite?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
  onExport?: () => void;
}

export default function SongHeader({
  song,
  onToggleFavorite,
  onEdit,
  onDelete,
  onShare,
  onExport,
}: SongHeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Link to="/songs">
                <Button variant="ghost" size="sm" className="gap-1">
                  <ChevronLeft className="h-4 w-4" />
                  Back to Songs
                </Button>
              </Link>
            </div>
            
            <h1 className="text-3xl font-bold tracking-tight truncate">
              {song.title}
            </h1>
            
            {song.artist && (
              <p className="text-lg text-muted-foreground mt-1">
                {song.artist}
              </p>
            )}
            
            <div className="flex items-center gap-2 mt-3">
              <Badge variant="outline" className="font-medium">
                Key: {song.key}
              </Badge>
              {song.tempo && (
                <Badge variant="outline">
                  {song.tempo} BPM
                </Badge>
              )}
              <Badge 
                variant="secondary" 
                className={
                  song.difficulty === "beginner" 
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                    : song.difficulty === "intermediate"
                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                }
              >
                {song.difficulty}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            <Button
              variant="outline"
              size="icon"
              onClick={onToggleFavorite}
              className="h-10 w-10"
            >
              <Heart
                className={`h-5 w-5 ${
                  song.isFavorite 
                    ? "fill-red-500 text-red-500" 
                    : ""
                }`}
              />
            </Button>
            
            <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Song
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onShare}>
                  <Share className="mr-2 h-4 w-4" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onExport}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={onDelete}
                  className="text-red-600 dark:text-red-400"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}