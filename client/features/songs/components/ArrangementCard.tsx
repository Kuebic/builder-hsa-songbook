import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Star, ListMusic, Eye, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ArrangementWithMetrics } from "@features/songs/types/song.types";

export interface ArrangementCardProps {
  arrangement: ArrangementWithMetrics;
}

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case "beginner":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "intermediate":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    case "advanced":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    default:
      return "";
  }
};

function ArrangementCard({ arrangement }: ArrangementCardProps) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/arrangements/${arrangement.slug}`);
  };

  const rating = arrangement.rating || { average: 0, count: 0 };
  const favoriteCount = arrangement.favoriteCount || 0;
  const setlistCount = arrangement.setlistCount || 0;

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer group"
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="space-y-2 flex-1">
            {/* Name and Key */}
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="font-semibold text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {arrangement.name}
              </h3>
              <Badge variant="outline" className="font-medium">
                {arrangement.metadata.key}
              </Badge>
              {arrangement.capo && (
                <Badge variant="secondary">Capo {arrangement.capo}</Badge>
              )}
            </div>

            {/* Rating */}
            {rating.count > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-4 w-4",
                        i < Math.floor(rating.average)
                          ? "text-yellow-500 fill-yellow-500"
                          : "text-gray-300",
                      )}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium">
                  {rating.average.toFixed(1)}
                </span>
                <span className="text-sm text-muted-foreground">
                  ({rating.count} review{rating.count !== 1 ? "s" : ""})
                </span>
              </div>
            )}

            {/* Social Proof Metrics */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {favoriteCount > 0 && (
                <>
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    {favoriteCount} favorite{favoriteCount !== 1 ? "s" : ""}
                  </span>
                  <span>•</span>
                </>
              )}
              {setlistCount > 0 && (
                <span className="flex items-center gap-1">
                  <ListMusic className="h-3 w-3" />
                  Used in {setlistCount} setlist{setlistCount !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {/* Additional Info */}
            <div className="flex items-center gap-2 flex-wrap">
              {arrangement.metadata.difficulty && (
                <Badge
                  variant="outline"
                  className={getDifficultyColor(
                    arrangement.metadata.difficulty,
                  )}
                >
                  {arrangement.metadata.difficulty.charAt(0).toUpperCase() +
                    arrangement.metadata.difficulty.slice(1)}
                </Badge>
              )}

              {arrangement.metadata.tempo && (
                <Badge variant="outline">
                  {arrangement.metadata.tempo} BPM
                </Badge>
              )}

              {arrangement.metadata.timeSignature && (
                <Badge variant="outline">
                  {arrangement.metadata.timeSignature}
                </Badge>
              )}

              {arrangement.metadata.isMashup && (
                <Badge
                  variant="secondary"
                  className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                >
                  Mashup
                </Badge>
              )}
            </div>

            {/* Instruments */}
            {arrangement.metadata.instruments &&
              arrangement.metadata.instruments.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  Instruments: {arrangement.metadata.instruments.join(", ")}
                </div>
              )}
          </div>

          {/* Action Buttons */}
          <div
            className="flex gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              title="View arrangement"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              title="Edit arrangement"
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Created info */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs text-muted-foreground">
          <span>
            Created {new Date(arrangement.createdAt).toLocaleDateString()}
          </span>
          {arrangement.stats?.lastUsed && (
            <span>
              Last used{" "}
              {new Date(arrangement.stats.lastUsed).toLocaleDateString()}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default memo(ArrangementCard);
