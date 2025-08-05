import { Request, Response } from "express";
import { Review, Arrangement, User } from "../database/models";
import { z } from "zod";
import { Types } from "mongoose";

// Validation schemas
const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(10).max(2000),
});


const reportReviewSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

// Helper to check if user is admin/moderator
const canModerateReviews = (user: any): boolean => {
  return user && (user.role === "ADMIN" || user.role === "MODERATOR");
};

// GET /api/arrangements/:arrangementId/reviews - Get reviews for an arrangement
export const getReviews = async (req: Request, res: Response) => {
  try {
    const { arrangementId } = req.params;
    const { includeReported } = req.query;
    const userId = req.query.userId || req.headers["x-user-id"];

    // Validate arrangementId
    if (!Types.ObjectId.isValid(arrangementId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_ARRANGEMENT_ID",
          message: "Invalid arrangement ID format",
        },
      });
    }

    // Check if arrangement exists
    const arrangement = await Arrangement.findById(arrangementId)
      .populate("songIds", "title artist");
    
    if (!arrangement) {
      return res.status(404).json({
        success: false,
        error: {
          code: "ARRANGEMENT_NOT_FOUND",
          message: "Arrangement not found",
        },
      });
    }

    // Check permissions for including reported reviews
    let showReported = false;
    if (includeReported === "true" && userId) {
      const user = await User.findById(userId);
      showReported = canModerateReviews(user);
    }

    // Get reviews
    const reviews = await Review.findByArrangement(arrangementId, showReported);

    // Get average rating
    const { average, count } = await Review.getAverageRating(arrangementId);

    // Transform reviews for response
    const transformedReviews = reviews.map(review => ({
      id: review._id.toString(),
      arrangementId: review.arrangementId.toString(),
      user: {
        id: review.userId._id.toString(),
        name: (review.userId as any).name,
        email: (review.userId as any).email,
      },
      rating: review.rating,
      comment: review.comment,
      helpfulCount: review.helpful.length,
      hasMarkedHelpful: userId ? review.helpful.some(id => id.toString() === userId) : false,
      reported: review.reported,
      reportReason: review.reportReason,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    }));

    // Find current user's review if logged in
    let currentUserReview = null;
    if (userId && Types.ObjectId.isValid(userId as string)) {
      const userReview = await Review.findUserReview(arrangementId, userId as string);
      if (userReview) {
        currentUserReview = {
          id: userReview._id.toString(),
          rating: userReview.rating,
          comment: userReview.comment,
          helpfulCount: userReview.helpful.length,
          createdAt: userReview.createdAt,
          updatedAt: userReview.updatedAt,
        };
      }
    }

    res.json({
      success: true,
      data: {
        reviews: transformedReviews,
        currentUserReview,
        summary: {
          averageRating: average,
          totalReviews: count,
          arrangementName: arrangement.name,
          songs: (arrangement.songIds as any[]).map(song => ({
            id: song._id.toString(),
            title: song.title,
            artist: song.artist,
          })),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch reviews",
      },
    });
  }
};

// POST /api/arrangements/:arrangementId/reviews - Create or update a review
export const createOrUpdateReview = async (req: Request, res: Response) => {
  try {
    const { arrangementId } = req.params;
    const userId = req.body.userId || req.headers["x-user-id"];

    // Validate user
    if (!userId || !Types.ObjectId.isValid(userId as string)) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "User authentication required",
        },
      });
    }

    // Validate arrangementId
    if (!Types.ObjectId.isValid(arrangementId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_ARRANGEMENT_ID",
          message: "Invalid arrangement ID format",
        },
      });
    }

    // Validate request body
    const validationResult = createReviewSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid review data",
          details: validationResult.error.errors,
        },
      });
    }

    const { rating, comment } = validationResult.data;

    // Check if arrangement exists
    const arrangement = await Arrangement.findById(arrangementId);
    if (!arrangement) {
      return res.status(404).json({
        success: false,
        error: {
          code: "ARRANGEMENT_NOT_FOUND",
          message: "Arrangement not found",
        },
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found",
        },
      });
    }

    // Check for existing review (one review per user per arrangement)
    let review = await Review.findUserReview(arrangementId, userId as string);

    if (review) {
      // Update existing review
      review.rating = rating;
      review.comment = comment;
      review.updatedAt = new Date();
      await review.save();
    } else {
      // Create new review
      review = new Review({
        arrangementId,
        userId,
        rating,
        comment,
      });
      await review.save();

      // Add to user's reviews
      await user.addReview(review._id);

      // Update arrangement review count
      arrangement.metadata.reviewCount += 1;
      await arrangement.save();
    }

    // Update arrangement average rating
    const { average, count } = await Review.getAverageRating(arrangementId);
    arrangement.metadata.ratings.average = average;
    arrangement.metadata.ratings.count = count;
    await arrangement.save();

    // Populate user for response
    await review.populate("userId", "name email");

    res.status(review.isNew ? 201 : 200).json({
      success: true,
      data: {
        id: review._id.toString(),
        arrangementId: review.arrangementId.toString(),
        user: {
          id: review.userId._id.toString(),
          name: (review.userId as any).name,
          email: (review.userId as any).email,
        },
        rating: review.rating,
        comment: review.comment,
        helpfulCount: review.helpful.length,
        hasMarkedHelpful: false,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error creating/updating review:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to save review",
      },
    });
  }
};

// POST /api/reviews/:id/helpful - Mark a review as helpful
export const markHelpful = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.body.userId || req.headers["x-user-id"];

    // Validate user
    if (!userId || !Types.ObjectId.isValid(userId as string)) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "User authentication required",
        },
      });
    }

    // Validate review ID
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_REVIEW_ID",
          message: "Invalid review ID format",
        },
      });
    }

    // Find review
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        error: {
          code: "REVIEW_NOT_FOUND",
          message: "Review not found",
        },
      });
    }

    // Don't allow users to mark their own reviews as helpful
    if (review.userId.toString() === userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: "CANNOT_MARK_OWN_REVIEW",
          message: "Cannot mark your own review as helpful",
        },
      });
    }

    // Toggle helpful status
    const userObjectId = new Types.ObjectId(userId as string);
    const hasMarkedHelpful = review.helpful.some(id => id.equals(userObjectId));

    if (hasMarkedHelpful) {
      await review.unmarkAsHelpful(userObjectId);
    } else {
      await review.markAsHelpful(userObjectId);
    }

    res.json({
      success: true,
      data: {
        reviewId: review._id.toString(),
        helpfulCount: review.getHelpfulCount(),
        hasMarkedHelpful: !hasMarkedHelpful,
      },
    });
  } catch (error) {
    console.error("Error marking review as helpful:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to update helpful status",
      },
    });
  }
};

// POST /api/reviews/:id/report - Report a review
export const reportReview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.body.userId || req.headers["x-user-id"];

    // Validate user
    if (!userId || !Types.ObjectId.isValid(userId as string)) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "User authentication required",
        },
      });
    }

    // Validate review ID
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_REVIEW_ID",
          message: "Invalid review ID format",
        },
      });
    }

    // Validate request body
    const validationResult = reportReviewSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid report data",
          details: validationResult.error.errors,
        },
      });
    }

    const { reason } = validationResult.data;

    // Find review
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        error: {
          code: "REVIEW_NOT_FOUND",
          message: "Review not found",
        },
      });
    }

    // Don't allow users to report their own reviews
    if (review.userId.toString() === userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: "CANNOT_REPORT_OWN_REVIEW",
          message: "Cannot report your own review",
        },
      });
    }

    // Report the review
    await review.report(reason);

    res.json({
      success: true,
      data: {
        message: "Review reported successfully",
        reviewId: review._id.toString(),
      },
    });
  } catch (error) {
    console.error("Error reporting review:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to report review",
      },
    });
  }
};

// Admin endpoints for review moderation

// GET /api/reviews/reported - Get all reported reviews (admin/moderator only)
export const getReportedReviews = async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId || req.headers["x-user-id"];
    const { limit = "50" } = req.query;

    // Validate user
    if (!userId || !Types.ObjectId.isValid(userId as string)) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "User authentication required",
        },
      });
    }

    // Check permissions
    const user = await User.findById(userId);
    if (!canModerateReviews(user)) {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Insufficient permissions",
        },
      });
    }

    // Get reported reviews
    const reviews = await Review.findReported(parseInt(limit as string));

    // Transform for response
    const transformedReviews = reviews.map(review => ({
      id: review._id.toString(),
      arrangementId: review.arrangementId._id.toString(),
      arrangementName: (review.arrangementId as any).name,
      user: {
        id: review.userId._id.toString(),
        name: (review.userId as any).name,
        email: (review.userId as any).email,
      },
      rating: review.rating,
      comment: review.comment,
      reportReason: review.reportReason,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    }));

    res.json({
      success: true,
      data: {
        reviews: transformedReviews,
        total: transformedReviews.length,
      },
    });
  } catch (error) {
    console.error("Error fetching reported reviews:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch reported reviews",
      },
    });
  }
};

// PUT /api/reviews/:id/clear-report - Clear report status (admin/moderator only)
export const clearReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.body.userId || req.headers["x-user-id"];

    // Validate user
    if (!userId || !Types.ObjectId.isValid(userId as string)) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "User authentication required",
        },
      });
    }

    // Check permissions
    const user = await User.findById(userId);
    if (!canModerateReviews(user)) {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Insufficient permissions",
        },
      });
    }

    // Validate review ID
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_REVIEW_ID",
          message: "Invalid review ID format",
        },
      });
    }

    // Find and update review
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        error: {
          code: "REVIEW_NOT_FOUND",
          message: "Review not found",
        },
      });
    }

    await review.clearReport();

    res.json({
      success: true,
      data: {
        message: "Report cleared successfully",
        reviewId: review._id.toString(),
      },
    });
  } catch (error) {
    console.error("Error clearing report:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to clear report",
      },
    });
  }
};

// DELETE /api/reviews/:id - Delete review (admin only)
export const deleteReview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.body.userId || req.headers["x-user-id"];

    // Validate user
    if (!userId || !Types.ObjectId.isValid(userId as string)) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "User authentication required",
        },
      });
    }

    // Check permissions (admin only)
    const user = await User.findById(userId);
    if (!user || user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Admin permissions required",
        },
      });
    }

    // Validate review ID
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_REVIEW_ID",
          message: "Invalid review ID format",
        },
      });
    }

    // Find and delete review
    const review = await Review.findByIdAndDelete(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        error: {
          code: "REVIEW_NOT_FOUND",
          message: "Review not found",
        },
      });
    }

    // Remove from user's reviews
    const reviewer = await User.findById(review.userId);
    if (reviewer) {
      reviewer.reviews = reviewer.reviews.filter(
        reviewId => !reviewId.equals(review._id),
      );
      await reviewer.save();
    }

    // Update arrangement review count and average
    const arrangement = await Arrangement.findById(review.arrangementId);
    if (arrangement) {
      arrangement.metadata.reviewCount = Math.max(0, arrangement.metadata.reviewCount - 1);
      
      // Recalculate average rating
      const { average, count } = await Review.getAverageRating(review.arrangementId.toString());
      arrangement.metadata.ratings.average = average;
      arrangement.metadata.ratings.count = count;
      await arrangement.save();
    }

    res.json({
      success: true,
      data: {
        message: "Review deleted successfully",
        deletedReviewId: id,
      },
    });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to delete review",
      },
    });
  }
};