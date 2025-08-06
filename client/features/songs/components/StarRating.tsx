import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StarRatingProps {
  rating: number;
  onRate?: (rating: number) => void;
  readOnly?: boolean;
  size?: "small" | "default" | "large";
}

/**
 * Reusable star rating component with hover effects and accessibility
 */
export const StarRating = ({
  rating,
  onRate,
  readOnly = false,
  size = "default",
}: StarRatingProps) => {
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

export default StarRating;
