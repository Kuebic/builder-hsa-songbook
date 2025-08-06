import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Music, FileMusic, Star, Eye, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { useProfileFavorites } from "@features/profile/hooks/useProfileFavorites";
import { LoadingSpinner } from "@/shared/components/LoadingSpinner";

interface ProfileFavoritesProps {
  userId: string;
}

export function ProfileFavorites({ userId }: ProfileFavoritesProps) {
  const [activeTab, setActiveTab] = useState<"songs" | "arrangements">("songs");
  const { data: favorites, isLoading, error } = useProfileFavorites(userId);

  if (isLoading) {
    return <LoadingSpinner message="Loading favorites..." />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Failed to load favorites
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!favorites) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No favorites yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "songs" | "arrangements")}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="songs">
            <Music className="w-4 h-4 mr-2" />
            Songs ({favorites.songs?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="arrangements">
            <FileMusic className="w-4 h-4 mr-2" />
            Arrangements ({favorites.arrangements?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="songs" className="mt-6">
          {favorites.songs && favorites.songs.length > 0 ? (
            <div className="grid gap-4">
              {favorites.songs.map((song) => (
                <Card key={song._id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex-1">
                      <Link
                        to={`/songs/${song.slug}`}
                        className="font-semibold hover:text-primary transition-colors"
                      >
                        {song.title}
                      </Link>
                      {song.artist && (
                        <p className="text-sm text-muted-foreground">
                          {song.artist}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {song.themes?.slice(0, 3).map((theme) => (
                          <Badge
                            key={theme}
                            variant="secondary"
                            className="text-xs"
                          >
                            {theme}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {song.metadata?.ratings?.average && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                          <span>
                            {song.metadata.ratings.average.toFixed(1)}
                          </span>
                        </div>
                      )}
                      {song.metadata?.views && (
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          <span>{song.metadata.views}</span>
                        </div>
                      )}
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/songs/${song.slug}`}>
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <Heart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No favorite songs yet</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="arrangements" className="mt-6">
          {favorites.arrangements && favorites.arrangements.length > 0 ? (
            <div className="grid gap-4">
              {favorites.arrangements.map((arrangement) => (
                <Card key={arrangement._id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex-1">
                      <Link
                        to={`/arrangements/${arrangement._id}`}
                        className="font-semibold hover:text-primary transition-colors"
                      >
                        {arrangement.name}
                      </Link>
                      {arrangement.songIds &&
                        arrangement.songIds.length > 0 && (
                          <p className="text-sm text-muted-foreground">
                            {arrangement.metadata?.isMashup ? "Mashup: " : ""}
                            {arrangement.songIds.map((s) => s.title).join(", ")}
                          </p>
                        )}
                      <div className="flex items-center gap-2 mt-2">
                        {arrangement.key && (
                          <Badge variant="outline" className="text-xs">
                            Key: {arrangement.key}
                          </Badge>
                        )}
                        <Badge
                          variant={
                            arrangement.difficulty === "beginner"
                              ? "secondary"
                              : arrangement.difficulty === "intermediate"
                                ? "default"
                                : "destructive"
                          }
                          className="text-xs"
                        >
                          {arrangement.difficulty}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {arrangement.metadata?.ratings?.average && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                          <span>
                            {arrangement.metadata.ratings.average.toFixed(1)}
                          </span>
                        </div>
                      )}
                      {arrangement.metadata?.views && (
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          <span>{arrangement.metadata.views}</span>
                        </div>
                      )}
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/arrangements/${arrangement._id}`}>
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <Heart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No favorite arrangements yet</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
