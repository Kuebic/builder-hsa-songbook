import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, MessageSquare, Info } from "lucide-react";
import { ReviewCard } from "./ReviewCard";
import { ReviewsSummary } from "./ReviewsSummary";
import { StarRating } from "./StarRating";

export interface SongReviewsSectionProps {
  songId: string;
  songTitle: string;
  averageRating: number;
  totalReviews: number;
  userReview?: {
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
    helpfulCount: number;
    hasMarkedHelpful: boolean;
    reported: boolean;
  };
  onSubmitReview?: (rating: number, comment: string) => Promise<void>;
  onUpdateReview?: (rating: number, comment: string) => Promise<void>;
  onMarkHelpful?: (reviewId: string) => void;
  onReport?: (reviewId: string) => void;
}

/**
 * Song-level reviews section that allows users to review the song concept
 * (not specific arrangements) and view community feedback
 */
export default function SongReviewsSection({
  songId,
  songTitle,
  averageRating,
  totalReviews,
  userReview,
  onSubmitReview,
  onUpdateReview,
  onMarkHelpful,
  onReport,
}: SongReviewsSectionProps) {
  const [isWritingReview, setIsWritingReview] = useState(false);
  const [rating, setRating] = useState(userReview?.rating || 0);
  const [comment, setComment] = useState(userReview?.comment || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock recent reviews data (would come from props in real implementation)
  const recentReviews = [
    {
      id: "1",
      user: { name: "Sarah M." },
      rating: 5,
      comment: "This song has such a powerful message about grace. It really speaks to the heart of the gospel and our church loves singing it during communion services.",
      createdAt: "2024-01-15T10:30:00Z",
      helpfulCount: 12,
      hasMarkedHelpful: false,
      reported: false,
    },
    {
      id: "2", 
      user: { name: "David L." },
      rating: 4,
      comment: "Beautiful lyrics and timeless message. The theological depth is amazing - it captures the essence of redemption so well.",
      createdAt: "2024-01-10T14:20:00Z",
      helpfulCount: 8,
      hasMarkedHelpful: true,
      reported: false,
    },
    {
      id: "3",
      user: { name: "Michael K." },
      rating: 5,
      comment: "One of the most moving songs about God's grace. The story behind John Newton's conversion adds so much meaning to every verse.",
      createdAt: "2024-01-08T09:15:00Z",
      helpfulCount: 15,
      hasMarkedHelpful: false,
      reported: false,
    },
  ];

  const handleSubmitReview = async () => {
    if (rating === 0 || !comment.trim()) return;

    setIsSubmitting(true);
    try {
      if (userReview && onUpdateReview) {
        await onUpdateReview(rating, comment);
      } else if (onSubmitReview) {
        await onSubmitReview(rating, comment);
      }
      setIsWritingReview(false);
    } catch (error) {
      console.error("Failed to submit review:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsWritingReview(false);
    setRating(userReview?.rating || 0);
    setComment(userReview?.comment || "");
  };

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      {totalReviews > 0 && (
        <ReviewsSummary 
          averageRating={averageRating}
          totalReviews={totalReviews}
        />
      )}

      {/* Info about song-level reviews */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          These reviews are about the song "{songTitle}" itself - its message, lyrics, and spiritual significance. 
          For arrangement-specific feedback (difficulty, chords, etc.), visit individual arrangement pages.
        </AlertDescription>
      </Alert>

      {/* User's review or review form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {userReview ? "Your Review" : "Share Your Thoughts"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userReview && !isWritingReview ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <StarRating rating={userReview.rating} readOnly />
                <span className="text-sm text-muted-foreground">
                  Reviewed on {new Date(userReview.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm">{userReview.comment}</p>
              <Button
                variant="outline" 
                size="sm"
                onClick={() => setIsWritingReview(true)}
              >
                Edit Review
              </Button>
            </div>
          ) : isWritingReview || !userReview ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-2">
                  Rate this song
                </label>
                <StarRating 
                  rating={rating}
                  onRate={setRating}
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">
                  What do you think about this song?
                </label>
                <Textarea
                  placeholder="Share your thoughts about the song's message, lyrics, spiritual impact, or how your congregation responds to it..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleSubmitReview}
                  disabled={rating === 0 || !comment.trim() || isSubmitting}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  {userReview ? "Update Review" : "Submit Review"}
                </Button>
                {isWritingReview && (
                  <Button variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <Button 
              onClick={() => setIsWritingReview(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Write a Review
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Recent Reviews */}
      {recentReviews.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Community Reviews</h3>
          <div className="space-y-4">
            {recentReviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                onMarkHelpful={onMarkHelpful || (() => {})}
                onReport={onReport || (() => {})}
              />
            ))}
          </div>
          {totalReviews > recentReviews.length && (
            <div className="text-center">
              <Button variant="outline">
                Load More Reviews ({totalReviews - recentReviews.length} remaining)
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {totalReviews === 0 && !userReview && !isWritingReview && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Reviews Yet</h3>
            <p className="text-muted-foreground mb-4 max-w-sm">
              Be the first to share your thoughts about this song's message and impact.
            </p>
            <Button 
              onClick={() => setIsWritingReview(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Write First Review
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
