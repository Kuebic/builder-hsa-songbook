import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, ThumbsUp, Flag } from "lucide-react";
import { formatDistanceToNow } from "@/shared/utils/formatRelativeTime";
import { StarRating } from "./StarRating";

export interface ReviewCardProps {
  review: {
    id: string;
    user: {
      name: string;
    };
    rating: number;
    comment: string;
    createdAt: string;
    helpfulCount: number;
    hasMarkedHelpful: boolean;
    reported: boolean;
  };
  onMarkHelpful: (reviewId: string) => void;
  onReport: (reviewId: string) => void;
  isMarkingHelpful?: boolean;
  isReporting?: boolean;
}

/**
 * Individual review card component displaying user review with actions
 */
export const ReviewCard = ({
  review,
  onMarkHelpful,
  onReport,
  isMarkingHelpful = false,
  isReporting = false,
}: ReviewCardProps) => {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="font-medium">{review.user.name}</span>
              <span className="text-sm text-muted-foreground">•</span>
              <span className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(review.createdAt))}
              </span>
            </div>
            <StarRating rating={review.rating} readOnly size="small" />
          </div>
          {review.reported && (
            <Badge variant="destructive" className="gap-1">
              <Flag className="h-3 w-3" aria-hidden="true" />
              Reported
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm leading-relaxed">{review.comment}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant={review.hasMarkedHelpful ? "default" : "outline"}
              size="sm"
              onClick={() => onMarkHelpful(review.id)}
              disabled={isMarkingHelpful}
              className="gap-1"
              aria-label={`Mark review as helpful, ${review.helpfulCount} people found this helpful`}
            >
              <ThumbsUp className="h-3 w-3" aria-hidden="true" />
              Helpful ({review.helpfulCount})
            </Button>
          </div>
          {!review.reported && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReport(review.id)}
              disabled={isReporting}
              className="gap-1 text-muted-foreground hover:text-destructive"
              aria-label="Report this review as inappropriate"
            >
              <Flag className="h-3 w-3" aria-hidden="true" />
              Report
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReviewCard;