import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Types
export interface Review {
  id: string;
  arrangementId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  rating: number;
  comment: string;
  helpfulCount: number;
  hasMarkedHelpful: boolean;
  reported: boolean;
  reportReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CurrentUserReview {
  id: string;
  rating: number;
  comment: string;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewsResponse {
  reviews: Review[];
  currentUserReview: CurrentUserReview | null;
  summary: {
    averageRating: number;
    totalReviews: number;
    arrangementName: string;
    songs: Array<{
      id: string;
      title: string;
      artist?: string;
    }>;
  };
}

export interface CreateOrUpdateReviewRequest {
  arrangementId: string;
  rating: number;
  comment: string;
  userId: string;
}

export interface MarkHelpfulRequest {
  reviewId: string;
  userId: string;
}

export interface ReportReviewRequest {
  reviewId: string;
  userId: string;
  reason?: string;
}

// API functions
const fetchReviewsByArrangement = async (
  arrangementId: string,
  userId?: string,
): Promise<ReviewsResponse> => {
  const params = userId ? `?userId=${userId}` : "";
  const response = await fetch(
    `${window.location.origin}/api/arrangements/${arrangementId}/reviews${params}`,
  );
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error?.message || "Failed to fetch reviews");
  }
  return data.data;
};

const createOrUpdateReview = async (
  data: CreateOrUpdateReviewRequest,
): Promise<Review> => {
  const response = await fetch(
    `${window.location.origin}/api/arrangements/${data.arrangementId}/reviews`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rating: data.rating,
        comment: data.comment,
        userId: data.userId,
      }),
    },
  );
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error?.message || "Failed to save review");
  }
  return result.data;
};

const markReviewHelpful = async (
  data: MarkHelpfulRequest,
): Promise<{
  reviewId: string;
  helpfulCount: number;
  hasMarkedHelpful: boolean;
}> => {
  const response = await fetch(
    `${window.location.origin}/api/reviews/${data.reviewId}/helpful`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: data.userId }),
    },
  );
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error?.message || "Failed to mark helpful");
  }
  return result.data;
};

const reportReview = async (
  data: ReportReviewRequest,
): Promise<{ message: string; reviewId: string }> => {
  const response = await fetch(
    `${window.location.origin}/api/reviews/${data.reviewId}/report`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: data.userId,
        reason: data.reason,
      }),
    },
  );
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error?.message || "Failed to report review");
  }
  return result.data;
};

// Hooks
export const useReviewsByArrangement = (
  arrangementId: string,
  userId?: string,
) => {
  return useQuery({
    queryKey: ["reviews", arrangementId, userId],
    queryFn: () => fetchReviewsByArrangement(arrangementId, userId),
    enabled: !!arrangementId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateOrUpdateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createOrUpdateReview,
    onSuccess: (_, variables) => {
      // Invalidate reviews for the arrangement to refetch
      queryClient.invalidateQueries({
        queryKey: ["reviews", variables.arrangementId],
      });
    },
  });
};

export const useMarkReviewHelpful = () => {
  return useMutation({
    mutationFn: markReviewHelpful,
    onSuccess: () => {
      // The component will handle refetching
    },
  });
};

export const useReportReview = () => {
  return useMutation({
    mutationFn: reportReview,
    onSuccess: () => {
      // The component will handle refetching
    },
  });
};
