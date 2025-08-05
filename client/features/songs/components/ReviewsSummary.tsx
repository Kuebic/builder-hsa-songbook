import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Star } from "lucide-react";
import { StarRating } from "./StarRating";

interface ReviewsSummaryProps {
  averageRating: number;
  totalReviews: number;
}

/**
 * Rating summary component showing average rating and distribution
 */
export const ReviewsSummary = ({ averageRating, totalReviews }: ReviewsSummaryProps) => {
  if (totalReviews === 0) {
    return null;
  }

  // Calculate rating distribution (mock data for now)
  const distribution = [
    { stars: 5, count: Math.floor(totalReviews * 0.6) },
    { stars: 4, count: Math.floor(totalReviews * 0.25) },
    { stars: 3, count: Math.floor(totalReviews * 0.1) },
    { stars: 2, count: Math.floor(totalReviews * 0.03) },
    { stars: 1, count: Math.floor(totalReviews * 0.02) },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Rating Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-3xl font-bold">{averageRating.toFixed(1)}</div>
          <StarRating rating={Math.round(averageRating)} readOnly size="large" />
          <p className="text-sm text-muted-foreground mt-1">
            {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
          </p>
        </div>
        <div className="space-y-2">
          {distribution.map(({ stars, count }) => (
            <div key={stars} className="flex items-center gap-2">
              <span className="text-sm w-3">{stars}</span>
              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
              <Progress value={(count / totalReviews) * 100} className="h-2 flex-1" />
              <span className="text-sm text-muted-foreground w-8 text-right">{count}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReviewsSummary;