import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Eye, 
  Star, 
  Clock, 
  Music, 
  Hash,
  User,
} from "lucide-react";
import { ClientSong } from "../types/song.types";

interface SongMetadataProps {
  song: ClientSong;
}

export default function SongMetadata({ song }: SongMetadataProps) {
  const formatCount = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  const formatDate = (date: Date | undefined): string => {
    if (!date) {return "Never";}
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Music className="h-4 w-4 text-muted-foreground" />
            Song Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Key</span>
            <Badge variant="outline">{song.key}</Badge>
          </div>
          {song.tempo && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Tempo</span>
              <Badge variant="outline">{song.tempo} BPM</Badge>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Difficulty</span>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Hash className="h-4 w-4 text-muted-foreground" />
            Statistics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Eye className="h-3 w-3" />
              Views
            </span>
            <span className="font-medium">{formatCount(song.viewCount)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Star className="h-3 w-3" />
              Rating
            </span>
            <span className="font-medium">{song.avgRating.toFixed(1)} / 5.0</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Last Used
            </span>
            <span className="font-medium">{formatDate(song.lastUsed)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            Themes & Chords
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {song.themes && song.themes.length > 0 && (
            <div>
              <span className="text-sm text-muted-foreground block mb-2">Themes</span>
              <div className="flex flex-wrap gap-1">
                {song.themes.map((theme, index) => (
                  <Badge key={index} variant="secondary">
                    {theme}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {song.basicChords && song.basicChords.length > 0 && (
            <div>
              <span className="text-sm text-muted-foreground block mb-2">Common Chords</span>
              <div className="flex flex-wrap gap-1">
                {song.basicChords.map((chord, index) => (
                  <span key={index} className="chord text-sm">
                    {chord}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}