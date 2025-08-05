import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Calendar, 
  Eye, 
  Heart, 
  Star, 
  Clock,
  User,
  Globe,
  Tag,
} from "lucide-react";
import { ClientSong } from "../types/song.types";

export interface SongOverviewProps {
  song: ClientSong;
}

/**
 * Song overview component that displays conceptual information about the song
 * (title, artist, themes, context) without musical arrangement details
 */
export default function SongOverview({ song }: SongOverviewProps) {
  const formatCount = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  const formatDate = (date: Date | undefined): string => {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Song Identity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            Song Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {song.artist && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" />
                Artist
              </span>
              <span className="font-medium">{song.artist}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Globe className="h-3 w-3" />
              Source
            </span>
            <Badge variant="outline">Traditional Holy Song</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Year
            </span>
            <span className="font-medium">1772</span>
          </div>
        </CardContent>
      </Card>

      {/* Community Engagement */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Heart className="h-4 w-4 text-muted-foreground" />
            Community
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
              <Heart className="h-3 w-3" />
              Favorites
            </span>
            <span className="font-medium">127 users</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Star className="h-3 w-3" />
              Song Rating
            </span>
            <span className="font-medium">{song.avgRating.toFixed(1)} / 5.0</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Last Discussed
            </span>
            <span className="font-medium">{formatDate(song.lastUsed)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Themes & Context */}
      <Card className="md:col-span-2 lg:col-span-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            Themes & Context
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {song.themes && song.themes.length > 0 && (
            <div>
              <span className="text-sm text-muted-foreground block mb-2">Themes</span>
              <div className="flex flex-wrap gap-1">
                {song.themes.map((theme, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {theme}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* Placeholder for Bible verses section */}
          <div>
            <span className="text-sm text-muted-foreground block mb-2">Related Verses</span>
            <div className="space-y-1">
              <Badge variant="outline" className="text-xs">
                Ephesians 2:8-9 (45 upvotes)
              </Badge>
            </div>
          </div>

          {/* Placeholder for CCLI */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">CCLI</span>
            <span className="font-medium text-xs">#4587123</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
