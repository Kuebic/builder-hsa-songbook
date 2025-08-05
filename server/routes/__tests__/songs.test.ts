import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";
import {
  getSongs,
  getSong,
  createSong,
  updateSong,
  deleteSong,
  rateSong,
  searchSongs,
} from "../songs";
import { Song } from "../../database/models";

// Mock the Song model
vi.mock("../../database/models", () => {
  const MockSong = vi.fn();
  Object.assign(MockSong, {
    find: vi.fn(),
    findById: vi.fn(),
    findByIdAndDelete: vi.fn(),
    countDocuments: vi.fn(),
    searchSongs: vi.fn(),
  });
  
  return {
    Song: MockSong,
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
  };

  const res = {
    json: vi.fn().mockReturnThis(),
    status: vi.fn().mockReturnThis(),
  };

  return { req, res } as { req: Partial<Request>; res: Partial<Response> };
};

// Mock song data
const mockSong = {
  _id: "60f7b1c3e4b0c72a1a123456",
  title: "Amazing Grace",
  artist: "John Newton",
  chordData: "{title: Amazing Grace}\n{artist: John Newton}\nAmazing grace...",
  key: "G",
  tempo: 85,
  timeSignature: "4/4",
  difficulty: "beginner",
  themes: ["grace", "salvation"],
  source: "traditional",
  lyrics: "Amazing grace, how sweet the sound...",
  metadata: {
    createdBy: "user123",
    isPublic: true,
    ratings: {
      average: 4.5,
      count: 10,
    },
    views: 150,
  },
  documentSize: 2048,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  updateViews: vi.fn(),
  addRating: vi.fn(),
  save: vi.fn(),
};

const mockSongs = [
  { ...mockSong },
  {
    ...mockSong,
    _id: "60f7b1c3e4b0c72a1a123457",
    title: "How Great Is Our God",
    artist: "Chris Tomlin",
    key: "A",
    difficulty: "intermediate",
  },
];

describe("Songs API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getSongs", () => {
    it("returns songs with default pagination", async () => {
      const { req, res } = createMockReqRes();

      // Mock mongoose chain methods
      const mockQuery = {
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockSongs),
      };

      (Song as any).find.mockReturnValue(mockQuery);
      (Song as any).countDocuments.mockResolvedValue(25);

      await getSongs(req as Request, res as Response);

      expect((Song as any).find).toHaveBeenCalledWith({ "metadata.isPublic": true });
      expect(mockQuery.limit).toHaveBeenCalledWith(20);
      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockSongs,
        meta: {
          total: 25,
          page: 1,
          limit: 20,
          compressed: true,
          cacheHit: false,
        },
      });
    });

    it("applies search filter correctly", async () => {
      const { req, res } = createMockReqRes({ search: "Amazing Grace" });

      const mockQuery = {
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([mockSong]),
      };

      (Song as any).find.mockReturnValue(mockQuery);
      (Song as any).countDocuments.mockResolvedValue(1);

      await getSongs(req as Request, res as Response);

      expect((Song as any).find).toHaveBeenCalledWith({
        "metadata.isPublic": true,
        $text: { $search: "Amazing Grace" },
      });
      expect(mockQuery.sort).toHaveBeenCalledWith({ score: { $meta: "textScore" } });
    });

    it("applies key filter correctly", async () => {
      const { req, res } = createMockReqRes({ key: "G" });

      const mockQuery = {
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([mockSong]),
      };

      (Song as any).find.mockReturnValue(mockQuery);
      (Song as any).countDocuments.mockResolvedValue(1);

      await getSongs(req as Request, res as Response);

      expect((Song as any).find).toHaveBeenCalledWith({
        "metadata.isPublic": true,
        key: "G",
      });
    });

    it("applies difficulty filter correctly", async () => {
      const { req, res } = createMockReqRes({ difficulty: "beginner" });

      const mockQuery = {
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([mockSong]),
      };

      (Song as any).find.mockReturnValue(mockQuery);
      (Song as any).countDocuments.mockResolvedValue(1);

      await getSongs(req as Request, res as Response);

      expect((Song as any).find).toHaveBeenCalledWith({
        "metadata.isPublic": true,
        difficulty: "beginner",
      });
    });

    it("applies themes filter correctly", async () => {
      const { req, res } = createMockReqRes({ themes: "grace,salvation" });

      const mockQuery = {
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([mockSong]),
      };

      (Song as any).find.mockReturnValue(mockQuery);
      (Song as any).countDocuments.mockResolvedValue(1);

      await getSongs(req as Request, res as Response);

      expect((Song as any).find).toHaveBeenCalledWith({
        "metadata.isPublic": true,
        themes: { $in: ["grace", "salvation"] },
      });
    });

    it("handles pagination correctly", async () => {
      const { req, res } = createMockReqRes({ limit: "10", offset: "20" });

      const mockQuery = {
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockSongs),
      };

      (Song as any).find.mockReturnValue(mockQuery);
      (Song as any).countDocuments.mockResolvedValue(25);

      await getSongs(req as Request, res as Response);

      expect(mockQuery.limit).toHaveBeenCalledWith(10);
      expect(mockQuery.skip).toHaveBeenCalledWith(20);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          meta: expect.objectContaining({
            page: 3, // (20 / 10) + 1
            limit: 10,
          }),
        }),
      );
    });

    it("handles validation errors", async () => {
      const { req, res } = createMockReqRes({ limit: "invalid" });

      await getSongs(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid query parameters",
          details: expect.any(Array),
        },
      });
    });

    it("handles database errors", async () => {
      const { req, res } = createMockReqRes();

      (Song as any).find.mockImplementation(() => {
        throw new Error("Database error");
      });

      await getSongs(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch songs",
        },
      });
    });
  });

  describe("getSong", () => {
    it("returns a public song successfully", async () => {
      const { req, res } = createMockReqRes({}, { id: "60f7b1c3e4b0c72a1a123456" });

      (Song as any).findById.mockResolvedValue(mockSong);

      await getSong(req as Request, res as Response);

      expect((Song as any).findById).toHaveBeenCalledWith("60f7b1c3e4b0c72a1a123456");
      expect(mockSong.updateViews).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockSong,
        meta: {
          compressed: true,
          cacheHit: false,
        },
      });
    });

    it("returns 404 for non-existent song", async () => {
      const { req, res } = createMockReqRes({}, { id: "nonexistent" });

      (Song as any).findById.mockResolvedValue(null);

      await getSong(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Song not found",
        },
      });
    });

    it("returns 403 for private song", async () => {
      const privateSong = { ...mockSong, metadata: { ...mockSong.metadata, isPublic: false } };
      const { req, res } = createMockReqRes({}, { id: "60f7b1c3e4b0c72a1a123456" });

      (Song as any).findById.mockResolvedValue(privateSong);

      await getSong(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Access denied to private song",
        },
      });
    });

    it("handles database errors", async () => {
      const { req, res } = createMockReqRes({}, { id: "60f7b1c3e4b0c72a1a123456" });

      (Song as any).findById.mockRejectedValue(new Error("Database error"));

      await getSong(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch song",
        },
      });
    });
  });

  describe("createSong", () => {
    const validSongData = {
      title: "New Song",
      artist: "Test Artist",
      chordData: "{title: New Song}\nTest chord data",
      key: "C",
      tempo: 120,
      difficulty: "intermediate",
      themes: ["test"],
      source: "test",
      createdBy: "user123",
      isPublic: true,
    };

    it("creates a song successfully", async () => {
      const { req, res } = createMockReqRes({}, {}, validSongData);

      const mockSongInstance = {
        ...mockSong,
        save: vi.fn().mockResolvedValue(mockSong),
      };

      // Mock the Song constructor to return our mock instance
      (Song as any).mockImplementation(() => mockSongInstance);

      await createSong(req as Request, res as Response);

      // Verify the Song constructor was called (song instance was created)
      expect((Song as any)).toHaveBeenCalled();
      expect(mockSongInstance.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockSongInstance,
        meta: {
          compressed: true,
        },
      });
    });

    it("handles validation errors", async () => {
      const invalidData = { title: "" }; // Missing required fields
      const { req, res } = createMockReqRes({}, {}, invalidData);

      await createSong(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid song data",
          details: expect.any(Array),
        },
      });
    });

    it("handles duplicate slug error", async () => {
      const { req, res } = createMockReqRes({}, {}, validSongData);

      const duplicateError = new Error("duplicate key error");
      const mockSongInstance = {
        save: vi.fn().mockRejectedValue(duplicateError),
      };

      (Song as any).mockImplementation(() => mockSongInstance);

      await createSong(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "DUPLICATE_SLUG",
          message: "Song with similar title already exists",
        },
      });
    });

    it("handles database errors", async () => {
      const { req, res } = createMockReqRes({}, {}, validSongData);

      const mockSongInstance = {
        save: vi.fn().mockRejectedValue(new Error("Database error")),
      };

      (Song as any).mockImplementation(() => mockSongInstance);

      await createSong(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to create song",
        },
      });
    });
  });

  describe("updateSong", () => {
    const updateData = {
      title: "Updated Song Title",
      artist: "Updated Artist",
      key: "D",
    };

    it("updates a song successfully", async () => {
      const { req, res } = createMockReqRes({}, { id: "60f7b1c3e4b0c72a1a123456" }, updateData);

      const mockSongInstance = { ...mockSong };
      (Song as any).findById.mockResolvedValue(mockSongInstance);

      await updateSong(req as Request, res as Response);

      expect((Song as any).findById).toHaveBeenCalledWith("60f7b1c3e4b0c72a1a123456");
      // Object.assign is used to update the song instance - verify the song was updated
      expect(mockSongInstance.title).toBe(updateData.title);
      expect(mockSongInstance.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockSongInstance,
        meta: {
          compressed: true,
        },
      });
    });

    it("returns 404 for non-existent song", async () => {
      const { req, res } = createMockReqRes({}, { id: "nonexistent" }, updateData);

      (Song as any).findById.mockResolvedValue(null);

      await updateSong(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Song not found",
        },
      });
    });

    it("handles validation errors", async () => {
      const invalidData = { tempo: 500 }; // Invalid tempo
      const { req, res } = createMockReqRes({}, { id: "60f7b1c3e4b0c72a1a123456" }, invalidData);

      await updateSong(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid update data",
          details: expect.any(Array),
        },
      });
    });

    it("handles database errors", async () => {
      const { req, res } = createMockReqRes({}, { id: "60f7b1c3e4b0c72a1a123456" }, updateData);

      (Song as any).findById.mockRejectedValue(new Error("Database error"));

      await updateSong(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to update song",
        },
      });
    });
  });

  describe("deleteSong", () => {
    it("deletes a song successfully", async () => {
      const { req, res } = createMockReqRes({}, { id: "60f7b1c3e4b0c72a1a123456" });

      (Song as any).findById.mockResolvedValue(mockSong);
      (Song as any).findByIdAndDelete.mockResolvedValue(mockSong);

      await deleteSong(req as Request, res as Response);

      expect((Song as any).findById).toHaveBeenCalledWith("60f7b1c3e4b0c72a1a123456");
      expect((Song as any).findByIdAndDelete).toHaveBeenCalledWith("60f7b1c3e4b0c72a1a123456");
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { id: "60f7b1c3e4b0c72a1a123456" },
      });
    });

    it("returns 404 for non-existent song", async () => {
      const { req, res } = createMockReqRes({}, { id: "nonexistent" });

      (Song as any).findById.mockResolvedValue(null);

      await deleteSong(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Song not found",
        },
      });
    });

    it("handles database errors", async () => {
      const { req, res } = createMockReqRes({}, { id: "60f7b1c3e4b0c72a1a123456" });

      (Song as any).findById.mockRejectedValue(new Error("Database error"));

      await deleteSong(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to delete song",
        },
      });
    });
  });

  describe("rateSong", () => {
    it("rates a song successfully", async () => {
      const { req, res } = createMockReqRes({}, { id: "60f7b1c3e4b0c72a1a123456" }, { rating: 5 });

      const mockSongInstance = {
        ...mockSong,
        addRating: vi.fn().mockResolvedValue(undefined),
      };
      (Song as any).findById.mockResolvedValue(mockSongInstance);

      await rateSong(req as Request, res as Response);

      expect((Song as any).findById).toHaveBeenCalledWith("60f7b1c3e4b0c72a1a123456");
      expect(mockSongInstance.addRating).toHaveBeenCalledWith(5);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          averageRating: mockSong.metadata.ratings.average,
          totalRatings: mockSong.metadata.ratings.count,
        },
      });
    });

    it("returns 400 for invalid rating", async () => {
      const { req, res } = createMockReqRes({}, { id: "60f7b1c3e4b0c72a1a123456" }, { rating: 6 });

      await rateSong(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "INVALID_RATING",
          message: "Rating must be between 1 and 5",
        },
      });
    });

    it("returns 404 for non-existent song", async () => {
      const { req, res } = createMockReqRes({}, { id: "nonexistent" }, { rating: 5 });

      (Song as any).findById.mockResolvedValue(null);

      await rateSong(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Song not found",
        },
      });
    });

    it("handles database errors", async () => {
      const { req, res } = createMockReqRes({}, { id: "60f7b1c3e4b0c72a1a123456" }, { rating: 5 });

      (Song as any).findById.mockRejectedValue(new Error("Database error"));

      await rateSong(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to rate song",
        },
      });
    });
  });

  describe("searchSongs", () => {
    it("searches songs successfully", async () => {
      const searchQuery = "Amazing Grace";
      const { req, res } = createMockReqRes({ q: searchQuery, limit: "10" });

      (Song as any).searchSongs.mockResolvedValue([mockSong]);

      await searchSongs(req as Request, res as Response);

      expect((Song as any).searchSongs).toHaveBeenCalledWith(searchQuery, 10);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [mockSong],
        meta: {
          query: searchQuery,
          total: 1,
          limit: 10,
          compressed: true,
        },
      });
    });

    it("returns 400 for missing query", async () => {
      const { req, res } = createMockReqRes();

      await searchSongs(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "MISSING_QUERY",
          message: "Search query is required",
        },
      });
    });

    it("limits search results correctly", async () => {
      const { req, res } = createMockReqRes({ q: "test", limit: "100" }); // Exceeds max

      (Song as any).searchSongs.mockResolvedValue([]);

      await searchSongs(req as Request, res as Response);

      expect((Song as any).searchSongs).toHaveBeenCalledWith("test", 50); // Max limit applied
    });

    it("handles database errors", async () => {
      const { req, res } = createMockReqRes({ q: "test" });

      (Song as any).searchSongs.mockRejectedValue(new Error("Database error"));

      await searchSongs(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Search failed",
        },
      });
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("handles malformed ObjectId in getSong", async () => {
      const { req, res } = createMockReqRes({}, { id: "invalid-id" });

      (Song as any).findById.mockRejectedValue(new Error("Cast to ObjectId failed"));

      await getSong(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(mockConsole.error).toHaveBeenCalledWith("Error fetching song:", expect.any(Error));
    });

    it("handles empty search query", async () => {
      const { req, res } = createMockReqRes({ q: "" });

      await searchSongs(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "MISSING_QUERY",
          message: "Search query is required",
        },
      });
    });

    it("handles missing rating in rateSong", async () => {
      const { req, res } = createMockReqRes({}, { id: "60f7b1c3e4b0c72a1a123456" }, {});

      await rateSong(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "INVALID_RATING",
          message: "Rating must be between 1 and 5",
        },
      });
    });

    it("handles isPublic flag update in updateSong", async () => {
      const updateData = { isPublic: false };
      const { req, res } = createMockReqRes({}, { id: "60f7b1c3e4b0c72a1a123456" }, updateData);

      const mockSongInstance = { ...mockSong };
      (Song as any).findById.mockResolvedValue(mockSongInstance);

      await updateSong(req as Request, res as Response);

      expect(mockSongInstance.metadata.isPublic).toBe(false);
    });
  });
});