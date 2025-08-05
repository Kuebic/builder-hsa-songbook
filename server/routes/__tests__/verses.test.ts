import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response } from "express";
import {
  getVersesBySong,
  submitVerse,
  upvoteVerse,
  updateVerse,
  deleteVerse,
} from "../verses";
import { Verse, Song, User } from "../../database/models";

// Mock the models
vi.mock("../../database/models", () => {
  const MockVerse = vi.fn();
  Object.assign(MockVerse, {
    findBySong: vi.fn(),
    findById: vi.fn(),
    findByIdAndDelete: vi.fn(),
    findPending: vi.fn(),
  });
  
  const MockSong = vi.fn();
  Object.assign(MockSong, {
    findById: vi.fn(),
  });
  
  const MockUser = vi.fn();
  Object.assign(MockUser, {
    findById: vi.fn(),
  });
  
  return {
    Verse: MockVerse,
    Song: MockSong,
    User: MockUser,
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
): { req: Partial<Request>; res: Partial<Response> } => {
  const req = {
    query,
    params,
    body,
    headers: {},
  };

  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };

  return { req, res };
};

describe("Verses API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/songs/:songId/verses", () => {
    it("should return verses for a valid song", async () => {
      const { req, res } = createMockReqRes({}, { songId: "507f1f77bcf86cd799439011" });
      const mockSong = {
        _id: "507f1f77bcf86cd799439011",
        title: "Amazing Grace",
        artist: "John Newton",
      };
      const mockVerses = [
        {
          _id: "verse1",
          reference: "John 3:16",
          text: "For God so loved the world...",
          submittedBy: { _id: "user1", name: "Test User", email: "test@test.com" },
          upvotes: ["user2", "user3"],
          status: "approved",
          getUpvoteCount: vi.fn().mockReturnValue(2),
        },
      ];

      (Song.findById as any).mockResolvedValue(mockSong);
      (Verse.findBySong as any).mockResolvedValue(mockVerses);

      await getVersesBySong(req as Request, res as Response);

      expect(Song.findById).toHaveBeenCalledWith("507f1f77bcf86cd799439011");
      expect(Verse.findBySong).toHaveBeenCalledWith("507f1f77bcf86cd799439011");
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          verses: expect.arrayContaining([
            expect.objectContaining({
              id: "verse1",
              reference: "John 3:16",
              text: "For God so loved the world...",
              upvoteCount: 2,
              hasUpvoted: false,
            }),
          ]),
          songTitle: "Amazing Grace",
          songArtist: "John Newton",
        },
      });
    });

    it("should return 404 if song not found", async () => {
      const { req, res } = createMockReqRes({}, { songId: "507f1f77bcf86cd799439011" });

      (Song.findById as any).mockResolvedValue(null);

      await getVersesBySong(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "SONG_NOT_FOUND",
          message: "Song not found",
        },
      });
    });

    it("should include user upvote status when userId provided", async () => {
      const { req, res } = createMockReqRes(
        { userId: "user1" },
        { songId: "507f1f77bcf86cd799439011" },
      );
      const mockSong = { _id: "507f1f77bcf86cd799439011", title: "Test Song" };
      const mockVerses = [
        {
          _id: "verse1",
          reference: "John 3:16",
          text: "Test verse",
          submittedBy: { _id: "user2", name: "Other User", email: "other@test.com" },
          upvotes: ["user1"],
          status: "approved",
          getUpvoteCount: vi.fn().mockReturnValue(1),
        },
      ];

      (Song.findById as any).mockResolvedValue(mockSong);
      (Verse.findBySong as any).mockResolvedValue(mockVerses);

      await getVersesBySong(req as Request, res as Response);

      const response = (res.json as any).mock.calls[0][0];
      expect(response.data.verses[0].hasUpvoted).toBe(true);
    });
  });

  describe("POST /api/songs/:songId/verses", () => {
    it("should create a new verse for a valid song", async () => {
      const { req, res } = createMockReqRes(
        {},
        { songId: "507f1f77bcf86cd799439011" },
        {
          reference: "Psalm 23:1",
          text: "The Lord is my shepherd",
          userId: "user1",
        },
      );

      const mockSong = { _id: "507f1f77bcf86cd799439011", title: "Test Song" };
      const mockUser = { _id: "user1", name: "Test User", submittedVerses: [] };
      const mockVerse = {
        _id: "newVerse",
        songId: "507f1f77bcf86cd799439011",
        reference: "Psalm 23:1",
        text: "The Lord is my shepherd",
        submittedBy: "user1",
        upvotes: [],
        status: "pending",
        save: vi.fn().mockResolvedValue(true),
        populate: vi.fn().mockResolvedValue({
          _id: "newVerse",
          reference: "Psalm 23:1",
          text: "The Lord is my shepherd",
          submittedBy: { _id: "user1", name: "Test User", email: "test@test.com" },
          upvotes: [],
          status: "pending",
          getUpvoteCount: vi.fn().mockReturnValue(0),
        }),
      };

      (Song.findById as any).mockResolvedValue(mockSong);
      (User.findById as any).mockResolvedValue(mockUser);
      (Verse as any).mockImplementation(() => mockVerse);
      (mockUser as any).addSubmittedVerse = vi.fn();

      await submitVerse(req as Request, res as Response);

      expect(Song.findById).toHaveBeenCalledWith("507f1f77bcf86cd799439011");
      expect(User.findById).toHaveBeenCalledWith("user1");
      expect(mockVerse.save).toHaveBeenCalled();
      expect((mockUser as any).addSubmittedVerse).toHaveBeenCalledWith("newVerse");
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          id: "newVerse",
          reference: "Psalm 23:1",
          text: "The Lord is my shepherd",
          status: "pending",
          upvoteCount: 0,
        }),
      });
    });

    it("should validate required fields", async () => {
      const { req, res } = createMockReqRes(
        {},
        { songId: "507f1f77bcf86cd799439011" },
        { reference: "John 3:16" }, // Missing text and userId
      );

      await submitVerse(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid verse data",
          details: expect.any(Array),
        },
      });
    });
  });

  describe("POST /api/verses/:id/upvote", () => {
    it("should add upvote to verse", async () => {
      const { req, res } = createMockReqRes(
        {},
        { id: "verse1" },
        { userId: "user1" },
      );

      const mockVerse = {
        _id: "verse1",
        upvotes: [],
        status: "approved",
        addUpvote: vi.fn().mockResolvedValue(true),
        getUpvoteCount: vi.fn().mockReturnValue(1),
      };

      (Verse.findById as any).mockResolvedValue(mockVerse);

      await upvoteVerse(req as Request, res as Response);

      expect(Verse.findById).toHaveBeenCalledWith("verse1");
      expect(mockVerse.addUpvote).toHaveBeenCalledWith(expect.any(Object));
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          verseId: "verse1",
          upvoteCount: 1,
          hasUpvoted: true,
        },
      });
    });

    it("should remove upvote if already upvoted", async () => {
      const { req, res } = createMockReqRes(
        {},
        { id: "verse1" },
        { userId: "user1" },
      );

      const userId = { equals: vi.fn().mockReturnValue(true) };
      const mockVerse = {
        _id: "verse1",
        upvotes: [userId],
        status: "approved",
        removeUpvote: vi.fn().mockResolvedValue(true),
        getUpvoteCount: vi.fn().mockReturnValue(0),
      };

      (Verse.findById as any).mockResolvedValue(mockVerse);

      await upvoteVerse(req as Request, res as Response);

      expect(mockVerse.removeUpvote).toHaveBeenCalledWith(expect.any(Object));
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          verseId: "verse1",
          upvoteCount: 0,
          hasUpvoted: false,
        },
      });
    });
  });

  describe("PUT /api/verses/:id/status", () => {
    it("should approve verse with admin permissions", async () => {
      const { req, res } = createMockReqRes(
        {},
        { id: "verse1" },
        { status: "approved", userId: "admin1" },
      );

      const mockVerse = {
        _id: "verse1",
        approve: vi.fn().mockResolvedValue(true),
      };
      const mockUser = { _id: "admin1", role: "ADMIN" };

      (Verse.findById as any).mockResolvedValue(mockVerse);
      (User.findById as any).mockResolvedValue(mockUser);

      await updateVerse(req as Request, res as Response);

      expect(mockVerse.approve).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          message: "Verse approved successfully",
          verseId: "verse1",
        },
      });
    });

    it("should reject verse with reason", async () => {
      const { req, res } = createMockReqRes(
        {},
        { id: "verse1" },
        { 
          status: "rejected", 
          rejectionReason: "Inappropriate content",
          userId: "mod1", 
        },
      );

      const mockVerse = {
        _id: "verse1",
        reject: vi.fn().mockResolvedValue(true),
      };
      const mockUser = { _id: "mod1", role: "MODERATOR" };

      (Verse.findById as any).mockResolvedValue(mockVerse);
      (User.findById as any).mockResolvedValue(mockUser);

      await updateVerse(req as Request, res as Response);

      expect(mockVerse.reject).toHaveBeenCalledWith("Inappropriate content");
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          message: "Verse rejected successfully",
          verseId: "verse1",
        },
      });
    });

    it("should require admin/moderator permissions", async () => {
      const { req, res } = createMockReqRes(
        {},
        { id: "verse1" },
        { status: "approved", userId: "user1" },
      );

      const mockUser = { _id: "user1", role: "USER" };

      (User.findById as any).mockResolvedValue(mockUser);

      await updateVerse(req as Request, res as Response);

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

  describe("DELETE /api/verses/:id", () => {
    it("should delete verse as admin", async () => {
      const { req, res } = createMockReqRes(
        {},
        { id: "verse1" },
        { userId: "admin1" },
      );

      const mockVerse = {
        _id: "verse1",
        submittedBy: "user2",
      };
      const mockUser = { _id: "admin1", role: "ADMIN" };

      (Verse.findByIdAndDelete as any).mockResolvedValue(mockVerse);
      (User.findById as any).mockResolvedValue(mockUser);

      await deleteVerse(req as Request, res as Response);

      expect(Verse.findByIdAndDelete).toHaveBeenCalledWith("verse1");
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          message: "Verse deleted successfully",
          deletedVerseId: "verse1",
        },
      });
    });

    it("should delete own verse as regular user", async () => {
      const { req, res } = createMockReqRes(
        {},
        { id: "verse1" },
        { userId: "user1" },
      );

      const mockVerse = {
        _id: "verse1",
        submittedBy: "user1",
      };
      const mockUser = { _id: "user1", role: "USER" };

      (Verse.findById as any).mockResolvedValue(mockVerse);
      (Verse.findByIdAndDelete as any).mockResolvedValue(mockVerse);
      (User.findById as any).mockResolvedValue(mockUser);

      await deleteVerse(req as Request, res as Response);

      expect(Verse.findByIdAndDelete).toHaveBeenCalledWith("verse1");
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          message: "Verse deleted successfully",
          deletedVerseId: "verse1",
        },
      });
    });

    it("should prevent deleting other users verses", async () => {
      const { req, res } = createMockReqRes(
        {},
        { id: "verse1" },
        { userId: "user1" },
      );

      const mockVerse = {
        _id: "verse1",
        submittedBy: "user2",
      };
      const mockUser = { _id: "user1", role: "USER" };

      (Verse.findById as any).mockResolvedValue(mockVerse);
      (User.findById as any).mockResolvedValue(mockUser);

      await deleteVerse(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Cannot delete verses submitted by other users",
        },
      });
    });
  });

});