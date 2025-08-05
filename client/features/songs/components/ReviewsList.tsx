import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Star,
  ThumbsUp,
  Flag,
  User,
  Edit2,
  MessageSquare,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUserId } from "@/shared/hooks/useAuth";
import { useReviewsByArrangement, useCreateOrUpdateReview, useMarkReviewHelpful, useReportReview } from "../hooks/useReviews";
import { formatDistanceToNow } from "@/shared/utils/formatRelativeTime";
import { cn } from "@/lib/utils";

interface ReviewsListProps {
  arrangementId: string;
  arrangementName: string;
}

interface ReviewFormData {
  rating: number;
  comment: string;
}

const StarRating = ({ rating, onRate, readOnly = false, size = "default" }: {
  rating: number;
  onRate?: (rating: number) => void;
  readOnly?: boolean;
  size?: "small" | "default" | "large";
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  const sizeClasses = {
    small: "h-4 w-4",
    default: "h-5 w-5",
    large: "h-6 w-6",
  };

  return (
    <div 
      className="flex gap-1"
      role="group"
      aria-label="Star rating"
      aria-valuemin={1}
      aria-valuemax={5}
      aria-valuenow={rating}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={cn(
            "transition-colors",
            readOnly ? "cursor-default" : "cursor-pointer hover:scale-110",
          )}
          onClick={() => !readOnly && onRate?.(star)}
          onMouseEnter={() => !readOnly && setHoverRating(star)}
          onMouseLeave={() => !readOnly && setHoverRating(0)}
          disabled={readOnly}
          aria-label={`Rate ${star} out of 5 stars`}
        >
          <Star
            className={cn(
              sizeClasses[size],
              (hoverRating || rating) >= star
                ? "fill-yellow-500 text-yellow-500"
                : "text-gray-300",
            )}
            aria-hidden="true"
          />
        </button>
      ))}
    </div>
  );
};

export default function ReviewsList({ arrangementId, arrangementName }: ReviewsListProps) {
  const userId = useUserId();
  const { toast } = useToast();
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ReviewFormData>({
    rating: 0,
    comment: "",
  });

  const { data: reviewsData, isLoading, refetch } = useReviewsByArrangement(arrangementId);
  const createOrUpdateReviewMutation = useCreateOrUpdateReview();
  const markHelpfulMutation = useMarkReviewHelpful();
  const reportReviewMutation = useReportReview();

  const handleSubmitReview = useCallback(async () => {
    if (!userId) {
      toast({
        title: "Authentication required",
        description: "Please sign in to submit reviews",
        variant: "default",
      });
      return;
    }

    if (formData.rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a star rating",
        variant: "destructive",
      });
      return;
    }

    if (formData.comment.trim().length < 10) {
      toast({
        title: "Review too short",
        description: "Please write at least 10 characters",
        variant: "destructive",
      });
      return;
    }

    try {
      await createOrUpdateReviewMutation.mutateAsync({
        arrangementId,
        rating: formData.rating,
        comment: formData.comment.trim(),
        userId,
      });

      toast({
        title: "Review submitted",
        description: "Your review has been posted successfully",
      });

      setFormData({ rating: 0, comment: "" });
      setIsReviewDialogOpen(false);
      refetch();
    } catch (error) {
      toast({
        title: "Failed to submit review",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  }, [userId, formData, arrangementId, createOrUpdateReviewMutation, toast, refetch]);

  const handleMarkHelpful = useCallback(async (reviewId: string) => {
    if (!userId) {
      toast({
        title: "Authentication required",
        description: "Please sign in to mark reviews as helpful",
        variant: "default",
      });
      return;
    }

    try {
      await markHelpfulMutation.mutateAsync({ reviewId, userId });
      refetch();
    } catch (error) {
      toast({
        title: "Failed to update",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  }, [userId, markHelpfulMutation, toast, refetch]);

  const handleReportReview = useCallback(async (reviewId: string) => {
    if (!userId) {
      toast({
        title: "Authentication required",
        description: "Please sign in to report reviews",
        variant: "default",
      });
      return;
    }

    try {
      await reportReviewMutation.mutateAsync({ reviewId, userId });
      toast({
        title: "Review reported",
        description: "Thank you for helping keep our community safe",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Failed to report",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  }, [userId, reportReviewMutation, toast, refetch]);

  const handleEditReview = useCallback(() => {
    if (reviewsData?.currentUserReview) {
      setFormData({
        rating: reviewsData.currentUserReview.rating,
        comment: reviewsData.currentUserReview.comment,
      });
      setIsReviewDialogOpen(true);
    }
  }, [reviewsData]);

  const renderRatingBreakdown = () => {
    if (!reviewsData || reviewsData.summary.totalReviews === 0) {return null;}

    // Calculate rating distribution (mock data for now)
    const distribution = [
      { stars: 5, count: Math.floor(reviewsData.summary.totalReviews * 0.6) },
      { stars: 4, count: Math.floor(reviewsData.summary.totalReviews * 0.25) },
      { stars: 3, count: Math.floor(reviewsData.summary.totalReviews * 0.1) },
      { stars: 2, count: Math.floor(reviewsData.summary.totalReviews * 0.03) },
      { stars: 1, count: Math.floor(reviewsData.summary.totalReviews * 0.02) },
    ];

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Rating Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold">{reviewsData.summary.averageRating.toFixed(1)}</div>
            <StarRating rating={Math.round(reviewsData.summary.averageRating)} readOnly size="large" />
            <p className="text-sm text-muted-foreground mt-1">
              {reviewsData.summary.totalReviews} {reviewsData.summary.totalReviews === 1 ? "review" : "reviews"}
            </p>
          </div>
          <div className="space-y-2">
            {distribution.map(({ stars, count }) => (
              <div key={stars} className="flex items-center gap-2">
                <span className="text-sm w-3">{stars}</span>
                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                <Progress value={(count / reviewsData.summary.totalReviews) * 100} className="h-2 flex-1" />
                <span className="text-sm text-muted-foreground w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderReviewCard = (review: any) => (
    <Card key={review.id} className="transition-shadow hover:shadow-md">
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
              onClick={() => handleMarkHelpful(review.id)}
              disabled={markHelpfulMutation.isPending}
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
              onClick={() => handleReportReview(review.id)}
              disabled={reportReviewMutation.isPending}
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

  if (isLoading) {
    return (
      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <Skeleton className="h-48 w-full" />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Reviews for {arrangementName}
        </h2>
        
        {reviewsData?.currentUserReview ? (
          <Button size="sm" onClick={handleEditReview} className="gap-1">
            <Edit2 className="h-4 w-4" />
            Edit Your Review
          </Button>
        ) : (
          <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <Star className="h-4 w-4" />
                Write a Review
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Review {arrangementName}</DialogTitle>
                <DialogDescription>
                  Share your experience with this arrangement
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Rating</label>
                  <div className="flex items-center gap-2">
                    <StarRating
                      rating={formData.rating}
                      onRate={(rating) => setFormData({ ...formData, rating })}
                      size="large"
                    />
                    {formData.rating > 0 && (
                      <span className="text-sm text-muted-foreground">
                        {formData.rating} star{formData.rating !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="comment" className="text-sm font-medium">
                    Your Review
                  </label>
                  <Textarea
                    id="comment"
                    value={formData.comment}
                    onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                    placeholder="What did you think of this arrangement?"
                    rows={4}
                    minLength={10}
                    maxLength={2000}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {formData.comment.length}/2000 characters
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsReviewDialogOpen(false);
                    setFormData({ rating: 0, comment: "" });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmitReview}
                  disabled={createOrUpdateReviewMutation.isPending}
                >
                  {createOrUpdateReviewMutation.isPending ? "Submitting..." : "Submit Review"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Current User Review */}
      {reviewsData?.currentUserReview && (
        <Alert>
          <Star className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-medium">Your Review</div>
              <StarRating rating={reviewsData.currentUserReview.rating} readOnly size="small" />
              <p className="text-sm">{reviewsData.currentUserReview.comment}</p>
              <p className="text-xs text-muted-foreground">
                Posted {formatDistanceToNow(new Date(reviewsData.currentUserReview.createdAt))}
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Reviews Grid */}
      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        {/* Rating Summary */}
        {renderRatingBreakdown()}

        {/* Reviews List */}
        <div className="space-y-4">
          {reviewsData && reviewsData.reviews.length > 0 ? (
            reviewsData.reviews.map(renderReviewCard)
          ) : (
            <Card className="p-8 text-center">
              <CardContent>
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No reviews yet</h3>
                <p className="text-muted-foreground mb-4">
                  Be the first to review this arrangement.
                </p>
                {userId && !reviewsData?.currentUserReview && (
                  <Button
                    size="sm"
                    onClick={() => setIsReviewDialogOpen(true)}
                    className="gap-1"
                  >
                    <Star className="h-4 w-4" />
                    Write First Review
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}