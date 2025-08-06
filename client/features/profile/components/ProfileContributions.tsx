import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileMusic,
  MessageSquare,
  ThumbsUp,
  ListMusic,
  ExternalLink,
  Star,
} from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { useProfileContributions } from "@features/profile/hooks/useProfileContributions";
import { LoadingSpinner } from "@/shared/components/LoadingSpinner";

interface ProfileContributionsProps {
  userId: string;
}

export function ProfileContributions({ userId }: ProfileContributionsProps) {
  const [activeTab, setActiveTab] = useState<
    "arrangements" | "verses" | "reviews" | "setlists"
  >("arrangements");
  const { data: contributions, isLoading, error } = useProfileContributions(userId);

  if (isLoading) {
    return <LoadingSpinner message="Loading contributions..." />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Failed to load contributions
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!contributions) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            No contributions yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="arrangements">
            <FileMusic className="w-4 h-4 mr-1 hidden sm:inline" />
            <span className="hidden sm:inline">Arrangements</span>
            <span className="sm:hidden">Arr.</span>
            <span className="ml-1">
              ({contributions.arrangements?.length || 0})
            </span>
          </TabsTrigger>
          <TabsTrigger value="verses">
            <MessageSquare className="w-4 h-4 mr-1 hidden sm:inline" />
            Verses ({contributions.verses?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="reviews">
            <Star className="w-4 h-4 mr-1 hidden sm:inline" />
            Reviews ({contributions.reviews?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="setlists">
            <ListMusic className="w-4 h-4 mr-1 hidden sm:inline" />
            Setlists ({contributions.setlists?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="arrangements" className="mt-6">
          {contributions.arrangements &&
          contributions.arrangements.length > 0 ? (
            <div className="grid gap-4">
              {contributions.arrangements.map((arrangement) => (
                <Card key={arrangement._id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Link
                          to={`/arrangements/${arrangement._id}`}
                          className="font-semibold hover:text-primary transition-colors"
                        >
                          {arrangement.name}
                        </Link>
                        {arrangement.songIds &&
                          arrangement.songIds.length > 0 && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {arrangement.songIds
                                .map(
                                  (s) =>
                                    `${s.title}${s.artist ? ` - ${s.artist}` : ""}`,
                                )
                                .join(", ")}
                            </p>
                          )}
                        <p className="text-xs text-muted-foreground mt-2">
                          Created{" "}
                          {format(
                            new Date(arrangement.createdAt),
                            "MMM d, yyyy",
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {arrangement.metadata?.ratings?.average && (
                          <Badge variant="secondary">
                            <Star className="w-3 h-3 mr-1" />
                            {arrangement.metadata.ratings.average.toFixed(1)}
                          </Badge>
                        )}
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/arrangements/${arrangement._id}`}>
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  No arrangements created yet
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="verses" className="mt-6">
          {contributions.verses && contributions.verses.length > 0 ? (
            <div className="grid gap-4">
              {contributions.verses.map((verse) => (
                <Card key={verse._id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold">
                          Verse {verse.verseNumber} - {verse.songId.title}
                        </p>
                        <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
                          {verse.verseText}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Submitted{" "}
                          {format(new Date(verse.createdAt), "MMM d, yyyy")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          <ThumbsUp className="w-3 h-3 mr-1" />
                          {verse.upvotes}
                        </Badge>
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/songs/${verse.songId._id}`}>
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  No verses submitted yet
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="reviews" className="mt-6">
          {contributions.reviews && contributions.reviews.length > 0 ? (
            <div className="grid gap-4">
              {contributions.reviews.map((review) => (
                <Card key={review._id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold">
                          {review.arrangementId.name}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < review.rating ? "fill-yellow-500 text-yellow-500" : "text-gray-300"}`}
                            />
                          ))}
                        </div>
                        {review.comment && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {review.comment}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          Reviewed{" "}
                          {format(new Date(review.createdAt), "MMM d, yyyy")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {review.helpfulVotes.length > 0 && (
                          <Badge variant="secondary">
                            <ThumbsUp className="w-3 h-3 mr-1" />
                            {review.helpfulVotes.length}
                          </Badge>
                        )}
                        <Button variant="ghost" size="sm" asChild>
                          <Link
                            to={`/arrangements/${review.arrangementId._id}`}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  No reviews written yet
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="setlists" className="mt-6">
          {contributions.setlists && contributions.setlists.length > 0 ? (
            <div className="grid gap-4">
              {contributions.setlists
                .filter((s) => s.metadata.isPublic)
                .map((setlist) => (
                  <Card key={setlist._id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <Link
                            to={`/setlists/${setlist._id}`}
                            className="font-semibold hover:text-primary transition-colors"
                          >
                            {setlist.name}
                          </Link>
                          {setlist.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {setlist.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>{setlist.songs.length} songs</span>
                            {setlist.metadata.venue && (
                              <span>{setlist.metadata.venue}</span>
                            )}
                            {setlist.metadata.date && (
                              <span>
                                {format(
                                  new Date(setlist.metadata.date),
                                  "MMM d, yyyy",
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/setlists/${setlist._id}`}>
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
                <p className="text-center text-muted-foreground">
                  No public setlists created yet
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
