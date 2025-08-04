import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Users } from "lucide-react";

interface SongRatingProps {
  currentRating: number;
  totalRatings: number;
  userRating?: number;
  onRate: (rating: number) => void;
}

export default function SongRating({
  currentRating,
  totalRatings,
  userRating,
  onRate,
}: SongRatingProps) {
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isRating, setIsRating] = useState(false);

  const handleRate = async (rating: number) => {
    setIsRating(true);
    try {
      await onRate(rating);
    } catch (error) {
      console.error("Failed to rate song:", error);
    } finally {
      setIsRating(false);
    }
  };

  const renderStars = (size: "sm" | "lg" = "lg") => {
    const stars = [];
    const displayRating = hoveredRating || userRating || currentRating;
    const starSize = size === "lg" ? "h-8 w-8" : "h-4 w-4";
    
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          onClick={() => handleRate(i)}
          onMouseEnter={() => setHoveredRating(i)}
          onMouseLeave={() => setHoveredRating(0)}
          className="p-1 transition-all hover:scale-110 disabled:hover:scale-100"
          disabled={isRating}
        >
          <Star 
            className={`${starSize} transition-colors ${
              i <= displayRating 
                ? "fill-yellow-500 text-yellow-500" 
                : "text-muted-foreground hover:text-yellow-500"
            }`}
          />
        </button>
      );
    }
    
    return stars;
  };

  const getRatingDistribution = () => {
    // This would normally come from the API
    // For now, we'll generate a mock distribution
    const distribution = [
      { stars: 5, count: Math.floor(totalRatings * 0.6) },
      { stars: 4, count: Math.floor(totalRatings * 0.25) },
      { stars: 3, count: Math.floor(totalRatings * 0.1) },
      { stars: 2, count: Math.floor(totalRatings * 0.03) },
      { stars: 1, count: Math.floor(totalRatings * 0.02) },
    ];
    
    return distribution;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          Song Rating
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Current Rating Display */}
          <div className="text-center">
            <div className="text-4xl font-bold">{currentRating.toFixed(1)}</div>
            <div className="flex justify-center mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${
                    star <= Math.round(currentRating)
                      ? "fill-yellow-500 text-yellow-500"
                      : "text-muted-foreground"
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1">
              <Users className="h-3 w-3" />
              {totalRatings} ratings
            </p>
          </div>

          {/* User Rating */}
          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-2 text-center">
              {userRating ? "Your rating:" : "Rate this song:"}
            </p>
            <div className="flex justify-center gap-1">
              {renderStars()}
            </div>
            {userRating && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                You rated this song {userRating} star{userRating !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          {/* Rating Distribution */}
          {totalRatings > 10 && (
            <div className="border-t pt-4 space-y-2">
              <p className="text-sm font-medium mb-3">Rating distribution</p>
              {getRatingDistribution().map(({ stars, count }) => {
                const percentage = (count / totalRatings) * 100;
                return (
                  <div key={stars} className="flex items-center gap-2">
                    <span className="text-sm w-4">{stars}</span>
                    <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-500 transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-10 text-right">
                      {Math.round(percentage)}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}