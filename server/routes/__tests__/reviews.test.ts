import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response } from "express";
import {
  getReviews,
  createOrUpdateReview,
  markHelpful,
  reportReview,
  getReportedReviews,
  clearReport,
  deleteReview,
} from "../reviews";
import { Review, Arrangement, User } from "../../database/models";
import { Types } from "mongoose";

// Mock the models
vi.mock("../../database/models", () => {
  const MockReview = vi.fn();
  Object.assign(MockReview, {
    findByArrangement: vi.fn(),
    findUserReview: vi.fn(),
    getAverageRating: vi.fn(),
    findById: vi.fn(),
    findByIdAndDelete: vi.fn(),
    findReported: vi.fn(),
  });
  
  const MockArrangement = vi.fn();
  Object.assign(MockArrangement, {
    findById: vi.fn(),
  });
  
  const MockUser = vi.fn();
  Object.assign(MockUser, {
    findById: vi.fn(),
  });
  
  return {
    Review: MockReview,
    Arrangement: MockArrangement,
    User: MockUser,
    Types: { ObjectId: { isValid: vi.fn() } },
  };
});

// Mock console to avoid test noise
const mockConsole = {
  error: vi.fn(),
  log: vi.fn(),
  warn: vi.fn(),
};
vi.stubGlobal("console", mockConsole);

// Helper to create mock request and response objects
const createMockReqRes = (
  query: any = {},
  params: any = {},
  body: any = {},
  headers: any = {},
): { req: Partial<Request>; res: Partial<Response> } => {
  const req = {
    query,
    params,
    body,
    headers,
  };

  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };

  return { req, res };
};

describe("Reviews API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (Types.ObjectId.isValid as any).mockReturnValue(true);
  });

  describe("GET /api/arrangements/:arrangementId/reviews", () => {
    it("should return reviews for a valid arrangement", async () => {
      const { req, res } = createMockReqRes(
        { userId: "user1" },
        { arrangementId: "507f1f77bcf86cd799439011" },
      );

      const mockArrangement = {
        _id: "507f1f77bcf86cd799439011",
        name: "Acoustic Version",
        songIds: [
          { _id: "song1", title: "Amazing Grace", artist: "John Newton" },
        ],
      };
      const mockReviews = [
        {
          _id: "review1",
          arrangementId: "507f1f77bcf86cd799439011",
          userId: { _id: "user2", name: "Test User", email: "test@test.com" },
          rating: 5,
          comment: "Excellent arrangement!",
          helpful: ["user3", "user4"],
          reported: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      const mockUserReview = {
        _id: "review2",
        rating: 4,
        comment: "Good arrangement",
        helpful: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (Arrangement.findById as any).mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockArrangement),
      });
      (Review.findByArrangement as any).mockResolvedValue(mockReviews);
      (Review.findUserReview as any).mockResolvedValue(mockUserReview);
      (Review.getAverageRating as any).mockResolvedValue({ average: 4.5, count: 10 });

      await getReviews(req as Request, res as Response);

      expect(Arrangement.findById).toHaveBeenCalledWith("507f1f77bcf86cd799439011");
      expect(Review.findByArrangement).toHaveBeenCalledWith("507f1f77bcf86cd799439011", false);
      expect(Review.findUserReview).toHaveBeenCalledWith("507f1f77bcf86cd799439011", "user1");
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          reviews: expect.arrayContaining([
            expect.objectContaining({
              id: "review1",
              rating: 5,
              comment: "Excellent arrangement!",
              helpfulCount: 2,
              hasMarkedHelpful: false,
            }),
          ]),
          currentUserReview: expect.objectContaining({
            id: "review2",
            rating: 4,
            comment: "Good arrangement",
          }),
          summary: {
            averageRating: 4.5,
            totalReviews: 10,
            arrangementName: "Acoustic Version",
            songs: expect.arrayContaining([
              expect.objectContaining({
                id: "song1",
                title: "Amazing Grace",
                artist: "John Newton",
              }),
            ]),
          },
        },
      });
    });

    it("should return 404 if arrangement not found", async () => {
      const { req, res } = createMockReqRes(
        {},
        { arrangementId: "507f1f77bcf86cd799439011" },
      );

      (Arrangement.findById as any).mockReturnValue({
        populate: vi.fn().mockResolvedValue(null),
      });

      await getReviews(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "ARRANGEMENT_NOT_FOUND",
          message: "Arrangement not found",
        },
      });
    });

    it("should include reported reviews for moderators", async () => {
      const { req, res } = createMockReqRes(
        { userId: "mod1", includeReported: "true" },
        { arrangementId: "507f1f77bcf86cd799439011" },
      );

      const mockArrangement = { _id: "507f1f77bcf86cd799439011", name: "Test" };
      const mockUser = { _id: "mod1", role: "MODERATOR" };

      (Arrangement.findById as any).mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockArrangement),
      });
      (User.findById as any).mockResolvedValue(mockUser);
      (Review.findByArrangement as any).mockResolvedValue([]);
      (Review.getAverageRating as any).mockResolvedValue({ average: 0, count: 0 });

      await getReviews(req as Request, res as Response);

      expect(Review.findByArrangement).toHaveBeenCalledWith("507f1f77bcf86cd799439011", true);
    });
  });

  describe("POST /api/arrangements/:arrangementId/reviews", () => {
    it("should create a new review", async () => {
      const { req, res } = createMockReqRes(
        {},
        { arrangementId: "507f1f77bcf86cd799439011" },
        {
          userId: "user1",
          rating: 5,
          comment: "This is an excellent arrangement for our worship team!",
        },
      );

      const mockArrangement = {
        _id: "507f1f77bcf86cd799439011",
        metadata: { reviewCount: 5, ratings: { average: 4, count: 5 } },
        save: vi.fn(),
      };
      const mockUser = {
        _id: "user1",
        addReview: vi.fn(),
      };
      const mockReview = {
        _id: "newReview",
        arrangementId: "507f1f77bcf86cd799439011",
        userId: "user1",
        rating: 5,
        comment: "This is an excellent arrangement for our worship team!",
        helpful: [],
        isNew: true,
        save: vi.fn().mockResolvedValue(true),
        populate: vi.fn().mockResolvedValue({
          _id: "newReview",
          arrangementId: "507f1f77bcf86cd799439011",
          userId: { _id: "user1", name: "Test User", email: "test@test.com" },
          rating: 5,
          comment: "This is an excellent arrangement for our worship team!",
          helpful: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      };

      (Arrangement.findById as any).mockResolvedValue(mockArrangement);
      (User.findById as any).mockResolvedValue(mockUser);
      (Review.findUserReview as any).mockResolvedValue(null);
      (Review as any).mockImplementation(() => mockReview);
      (Review.getAverageRating as any).mockResolvedValue({ average: 4.2, count: 6 });

      await createOrUpdateReview(req as Request, res as Response);

      expect(Arrangement.findById).toHaveBeenCalledWith("507f1f77bcf86cd799439011");
      expect(User.findById).toHaveBeenCalledWith("user1");
      expect(Review.findUserReview).toHaveBeenCalledWith("507f1f77bcf86cd799439011", "user1");
      expect(mockReview.save).toHaveBeenCalled();
      expect(mockUser.addReview).toHaveBeenCalledWith("newReview");
      expect(mockArrangement.metadata.reviewCount).toBe(6);
      expect(mockArrangement.metadata.ratings.average).toBe(4.2);
      expect(mockArrangement.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should update existing review", async () => {
      const { req, res } = createMockReqRes(
        {},
        { arrangementId: "507f1f77bcf86cd799439011" },
        {
          userId: "user1",
          rating: 4,
          comment: "Updated review - still good but found some issues",
        },
      );

      const mockArrangement = {
        _id: "507f1f77bcf86cd799439011",
        metadata: { reviewCount: 5, ratings: { average: 4, count: 5 } },
        save: vi.fn(),
      };
      const mockUser = { _id: "user1" };
      const mockReview = {
        _id: "existingReview",
        rating: 5,
        comment: "Old comment",
        save: vi.fn().mockResolvedValue(true),
        populate: vi.fn().mockResolvedValue({
          _id: "existingReview",
          userId: { _id: "user1", name: "Test User", email: "test@test.com" },
          rating: 4,
          comment: "Updated review - still good but found some issues",
          helpful: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      };

      (Arrangement.findById as any).mockResolvedValue(mockArrangement);
      (User.findById as any).mockResolvedValue(mockUser);
      (Review.findUserReview as any).mockResolvedValue(mockReview);
      (Review.getAverageRating as any).mockResolvedValue({ average: 3.8, count: 5 });

      await createOrUpdateReview(req as Request, res as Response);

      expect(mockReview.rating).toBe(4);
      expect(mockReview.comment).toBe("Updated review - still good but found some issues");
      expect(mockReview.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should validate review data", async () => {
      const { req, res } = createMockReqRes(
        {},
        { arrangementId: "507f1f77bcf86cd799439011" },
        {
          userId: "user1",
          rating: 6, // Invalid rating
          comment: "Too short", // Less than 10 characters
        },
      );

      await createOrUpdateReview(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid review data",
          details: expect.any(Array),
        },
      });
    });
  });

  describe("POST /api/reviews/:id/helpful", () => {
    it("should mark review as helpful", async () => {
      const { req, res } = createMockReqRes(
        {},
        { id: "review1" },
        { userId: "user1" },
      );

      const mockReview = {
        _id: "review1",
        userId: "user2",
        helpful: [],
        markAsHelpful: vi.fn().mockResolvedValue(true),
        getHelpfulCount: vi.fn().mockReturnValue(1),
      };

      (Review.findById as any).mockResolvedValue(mockReview);

      await markHelpful(req as Request, res as Response);

      expect(Review.findById).toHaveBeenCalledWith("review1");
      expect(mockReview.markAsHelpful).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          reviewId: "review1",
          helpfulCount: 1,
          hasMarkedHelpful: true,
        },
      });
    });

    it("should unmark helpful if already marked", async () => {
      const { req, res } = createMockReqRes(
        {},
        { id: "review1" },
        { userId: "user1" },
      );

      const userId = new Types.ObjectId("user1" as any);
      const mockReview = {
        _id: "review1",
        userId: "user2",
        helpful: [userId],
        unmarkAsHelpful: vi.fn().mockResolvedValue(true),
        getHelpfulCount: vi.fn().mockReturnValue(0),
      };

      (Review.findById as any).mockResolvedValue(mockReview);

      await markHelpful(req as Request, res as Response);

      expect(mockReview.unmarkAsHelpful).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          reviewId: "review1",
          helpfulCount: 0,
          hasMarkedHelpful: false,
        },
      });
    });

    it("should prevent marking own review as helpful", async () => {
      const { req, res } = createMockReqRes(
        {},
        { id: "review1" },
        { userId: "user1" },
      );

      const mockReview = {
        _id: "review1",
        userId: { toString: () => "user1" },
      };

      (Review.findById as any).mockResolvedValue(mockReview);

      await markHelpful(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "CANNOT_MARK_OWN_REVIEW",
          message: "Cannot mark your own review as helpful",
        },
      });
    });
  });

  describe("POST /api/reviews/:id/report", () => {
    it("should report a review with reason", async () => {
      const { req, res } = createMockReqRes(
        {},
        { id: "review1" },
        { userId: "user1", reason: "Inappropriate language" },
      );

      const mockReview = {
        _id: "review1",
        userId: { toString: () => "user2" },
        report: vi.fn().mockResolvedValue(true),
      };

      (Review.findById as any).mockResolvedValue(mockReview);

      await reportReview(req as Request, res as Response);

      expect(mockReview.report).toHaveBeenCalledWith("Inappropriate language");
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          message: "Review reported successfully",
          reviewId: "review1",
        },
      });
    });

    it("should prevent reporting own review", async () => {
      const { req, res } = createMockReqRes(
        {},
        { id: "review1" },
        { userId: "user1" },
      );

      const mockReview = {
        _id: "review1",
        userId: { toString: () => "user1" },
      };

      (Review.findById as any).mockResolvedValue(mockReview);

      await reportReview(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "CANNOT_REPORT_OWN_REVIEW",
          message: "Cannot report your own review",
        },
      });
    });
  });

  describe("GET /api/reviews/reported", () => {
    it("should return reported reviews for admin/moderator", async () => {
      const { req, res } = createMockReqRes({ userId: "admin1", limit: "20" });

      const mockUser = { _id: "admin1", role: "ADMIN" };
      const mockReviews = [
        {
          _id: "review1",
          arrangementId: { _id: "arr1", name: "Acoustic Version" },
          userId: { _id: "user1", name: "Test User", email: "test@test.com" },
          rating: 1,
          comment: "Bad review with inappropriate content",
          reportReason: "Inappropriate language",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (User.findById as any).mockResolvedValue(mockUser);
      (Review.findReported as any).mockResolvedValue(mockReviews);

      await getReportedReviews(req as Request, res as Response);

      expect(Review.findReported).toHaveBeenCalledWith(20);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          reviews: expect.arrayContaining([
            expect.objectContaining({
              id: "review1",
              arrangementName: "Acoustic Version",
              rating: 1,
              comment: "Bad review with inappropriate content",
              reportReason: "Inappropriate language",
            }),
          ]),
          total: 1,
        },
      });
    });

    it("should deny access for regular users", async () => {
      const { req, res } = createMockReqRes({ userId: "user1" });

      const mockUser = { _id: "user1", role: "USER" };

      (User.findById as any).mockResolvedValue(mockUser);

      await getReportedReviews(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Insufficient permissions",
        },
      });
    });
  });

  describe("PUT /api/reviews/:id/clear-report", () => {
    it("should clear report status for moderator", async () => {
      const { req, res } = createMockReqRes(
        {},
        { id: "review1" },
        { userId: "mod1" },
      );

      const mockUser = { _id: "mod1", role: "MODERATOR" };
      const mockReview = {
        _id: "review1",
        clearReport: vi.fn().mockResolvedValue(true),
      };

      (User.findById as any).mockResolvedValue(mockUser);
      (Review.findById as any).mockResolvedValue(mockReview);

      await clearReport(req as Request, res as Response);

      expect(mockReview.clearReport).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          message: "Report cleared successfully",
          reviewId: "review1",
        },
      });
    });
  });

  describe("DELETE /api/reviews/:id", () => {
    it("should delete review as admin", async () => {
      const { req, res } = createMockReqRes(
        {},
        { id: "review1" },
        { userId: "admin1" },
      );

      const mockUser = { _id: "admin1", role: "ADMIN" };
      const mockReview = {
        _id: "review1",
        userId: "user1",
        arrangementId: "arr1",
      };
      const mockReviewer = {
        _id: "user1",
        reviews: ["review1", "review2"],
        save: vi.fn(),
      };
      const mockArrangement = {
        _id: "arr1",
        metadata: { reviewCount: 5, ratings: { average: 4, count: 5 } },
        save: vi.fn(),
      };

      (User.findById as any)
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockReviewer);
      (Review.findByIdAndDelete as any).mockResolvedValue(mockReview);
      (Arrangement.findById as any).mockResolvedValue(mockArrangement);
      (Review.getAverageRating as any).mockResolvedValue({ average: 4.2, count: 4 });

      await deleteReview(req as Request, res as Response);

      expect(Review.findByIdAndDelete).toHaveBeenCalledWith("review1");
      expect(mockReviewer.reviews).toEqual(["review2"]);
      expect(mockReviewer.save).toHaveBeenCalled();
      expect(mockArrangement.metadata.reviewCount).toBe(4);
      expect(mockArrangement.metadata.ratings.average).toBe(4.2);
      expect(mockArrangement.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          message: "Review deleted successfully",
          deletedReviewId: "review1",
        },
      });
    });

    it("should require admin permissions", async () => {
      const { req, res } = createMockReqRes(
        {},
        { id: "review1" },
        { userId: "mod1" },
      );

      const mockUser = { _id: "mod1", role: "MODERATOR" };

      (User.findById as any).mockResolvedValue(mockUser);

      await deleteReview(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Admin permissions required",
        },
      });
    });
  });
});