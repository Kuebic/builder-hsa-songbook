import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";
import {
  getStorageStats,
  triggerCleanup,
  getCompressionStats,
  healthCheck,
} from "../storage";
import { database } from "../../database/connection";
import { Song, Setlist, Arrangement, User } from "../../database/models";

// Mock the database connection
vi.mock("../../database/connection", () => ({
  database: {
    getStorageStats: vi.fn(),
    isConnectedToDatabase: vi.fn(),
  },
}));

// Mock the models
vi.mock("../../database/models", () => ({
  Song: {
    countDocuments: vi.fn(),
    find: vi.fn(),
    aggregate: vi.fn(),
    deleteMany: vi.fn(),
  },
  Setlist: {
    countDocuments: vi.fn(),
    find: vi.fn(),
    deleteMany: vi.fn(),
  },
  Arrangement: {
    countDocuments: vi.fn(),
    find: vi.fn(),
    deleteMany: vi.fn(),
  },
  User: {
    countDocuments: vi.fn(),
  },
}));

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
  body: any = {}
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

// Mock data
const mockStorageStats = {
  usage: 256,
  limit: 512,
  percentage: 50,
  dataSize: 200,
  indexSize: 50,
  collections: 5,
};

const mockSongs = [
  {
    _id: "song1",
    title: "Amazing Grace",
    artist: "John Newton",
    documentSize: 2048,
  },
  {
    _id: "song2",
    title: "How Great Is Our God",
    artist: "Chris Tomlin",
    documentSize: 1536,
  },
];

const mockArrangements = [
  {
    _id: "arr1",
    name: "Amazing Grace - Piano",
    documentSize: 3072,
  },
  {
    _id: "arr2",
    name: "Hymn Arrangement",
    documentSize: 2560,
  },
];

const mockSongDocuments = [
  {
    _id: "song1",
    chordData: "{title: Amazing Grace}\n{artist: John Newton}\nAmazing grace...",
    documentSize: 2048,
  },
  {
    _id: "song2",
    chordData: "{title: How Great}\n{artist: Chris Tomlin}\nHow great is our God...",
    documentSize: 1536,
  },
];

const mockArrangementDocuments = [
  {
    _id: "arr1",
    chordData: "{title: Piano Arrangement}\nChord progression...",
    documentSize: 3072,
  },
];

describe("Storage API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getStorageStats", () => {
    it("returns storage statistics successfully", async () => {
      const { req, res } = createMockReqRes();

      // Mock database stats
      (database.getStorageStats as any).mockResolvedValue(mockStorageStats);

      // Mock collection counts
      (Song.countDocuments as any).mockResolvedValue(150);
      (Setlist.countDocuments as any).mockResolvedValue(25);
      (Arrangement.countDocuments as any).mockResolvedValue(75);
      (User.countDocuments as any).mockResolvedValue(10);

      // Mock largest documents queries
      const mockSongQuery = {
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockSongs),
      };

      const mockArrangementQuery = {
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockArrangements),
      };

      (Song.find as any).mockReturnValue(mockSongQuery);
      (Arrangement.find as any).mockReturnValue(mockArrangementQuery);

      await getStorageStats(req as Request, res as Response);

      expect(database.getStorageStats).toHaveBeenCalled();
      expect(Song.countDocuments).toHaveBeenCalled();
      expect(Setlist.countDocuments).toHaveBeenCalled();
      expect(Arrangement.countDocuments).toHaveBeenCalled();
      expect(User.countDocuments).toHaveBeenCalled();

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          database: mockStorageStats,
          collections: {
            songs: 150,
            setlists: 25,
            arrangements: 75,
            users: 10,
          },
          largest: {
            songs: mockSongs,
            arrangements: mockArrangements,
          },
          recommendations: expect.any(Array),
        },
      });
    });

    it("generates proper recommendations for high usage", async () => {
      const { req, res } = createMockReqRes();

      const highUsageStats = { ...mockStorageStats, percentage: 95 };
      (database.getStorageStats as any).mockResolvedValue(highUsageStats);

      // Mock other calls
      (Song.countDocuments as any).mockResolvedValue(150);
      (Setlist.countDocuments as any).mockResolvedValue(25);
      (Arrangement.countDocuments as any).mockResolvedValue(75);
      (User.countDocuments as any).mockResolvedValue(10);

      const mockQuery = {
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([]),
      };

      (Song.find as any).mockReturnValue(mockQuery);
      (Arrangement.find as any).mockReturnValue(mockQuery);

      await getStorageStats(req as Request, res as Response);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            recommendations: expect.arrayContaining([
              expect.stringContaining("CRITICAL"),
            ]),
          }),
        })
      );
    });

    it("handles database errors", async () => {
      const { req, res } = createMockReqRes();

      (database.getStorageStats as any).mockRejectedValue(new Error("Database error"));

      await getStorageStats(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch storage statistics",
        },
      });
    });
  });

  describe("triggerCleanup", () => {
    it("performs dry run cleanup analysis", async () => {
      const { req, res } = createMockReqRes({ dryRun: "true" });

      // Mock duplicate slugs aggregate
      (Song.aggregate as any).mockResolvedValue([
        { _id: "duplicate-slug", count: 2, ids: ["id1", "id2"] },
      ]);

      // Mock unused arrangements
      (Arrangement.find as any).mockResolvedValue([
        { _id: "unused1" },
        { _id: "unused2" },
      ]);

      // Mock old unused songs
      (Song.find as any).mockResolvedValue([
        { _id: "old1" },
      ]);

      // Mock empty setlists
      (Setlist.find as any).mockResolvedValue([
        { _id: "empty1" },
      ]);

      await triggerCleanup(req as Request, res as Response);

      expect(Song.aggregate).toHaveBeenCalled();
      expect(Arrangement.find).toHaveBeenCalled();
      expect(Song.find).toHaveBeenCalled();
      expect(Setlist.find).toHaveBeenCalled();

      // Should not perform actual deletions in dry run
      expect(Song.deleteMany).not.toHaveBeenCalled();
      expect(Arrangement.deleteMany).not.toHaveBeenCalled();
      expect(Setlist.deleteMany).not.toHaveBeenCalled();

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          dryRun: true,
          results: {
            duplicateSlugs: 1,
            unusedArrangements: 2,
            oldUnusedSongs: 1,
            emptySetlists: 1,
          },
          message: "Cleanup analysis completed (no changes made)",
        },
      });
    });

    it("performs actual cleanup when not dry run", async () => {
      const { req, res } = createMockReqRes({}); // No dryRun query param means false

      // Mock duplicate slugs
      (Song.aggregate as any).mockResolvedValue([
        { _id: "duplicate-slug", count: 2, ids: ["id1", "id2"] },
      ]);

      // Mock unused arrangements
      const unusedArrangements = [{ _id: "unused1" }, { _id: "unused2" }];
      (Arrangement.find as any).mockResolvedValue(unusedArrangements);

      // Mock old unused songs
      const oldSongs = [{ _id: "old1" }];
      (Song.find as any).mockResolvedValue(oldSongs);

      // Mock empty setlists
      const emptySetlists = [{ _id: "empty1" }];
      (Setlist.find as any).mockResolvedValue(emptySetlists);

      // Mock delete operations
      (Song.deleteMany as any).mockResolvedValue({ deletedCount: 1 });
      (Arrangement.deleteMany as any).mockResolvedValue({ deletedCount: 2 });
      (Setlist.deleteMany as any).mockResolvedValue({ deletedCount: 1 });

      await triggerCleanup(req as Request, res as Response);

      // Should perform actual deletions - called twice for Song (duplicates and old songs)
      expect(Song.deleteMany).toHaveBeenCalledTimes(2);
      expect(Song.deleteMany).toHaveBeenNthCalledWith(1, { _id: { $in: ["id2"] } });
      expect(Song.deleteMany).toHaveBeenNthCalledWith(2, { _id: { $in: ["old1"] } });
      expect(Arrangement.deleteMany).toHaveBeenCalledWith({ _id: { $in: ["unused1", "unused2"] } });
      expect(Setlist.deleteMany).toHaveBeenCalledWith({ _id: { $in: ["empty1"] } });

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          dryRun: false,
          results: {
            duplicateSlugs: 1,
            unusedArrangements: 2,
            oldUnusedSongs: 1,
            emptySetlists: 1,
          },
          message: "Cleanup completed successfully",
        },
      });
    });

    it("handles cleanup errors", async () => {
      const { req, res } = createMockReqRes();

      (Song.aggregate as any).mockRejectedValue(new Error("Database error"));

      await triggerCleanup(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Cleanup operation failed",
        },
      });
    });
  });

  describe("getCompressionStats", () => {
    it("calculates compression statistics successfully", async () => {
      const { req, res } = createMockReqRes();

      // Mock song query
      const mockSongQuery = {
        limit: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockSongDocuments),
      };

      // Mock arrangement query
      const mockArrangementQuery = {
        limit: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockArrangementDocuments),
      };

      (Song.find as any).mockReturnValue(mockSongQuery);
      (Arrangement.find as any).mockReturnValue(mockArrangementQuery);

      await getCompressionStats(req as Request, res as Response);

      expect(Song.find).toHaveBeenCalledWith({});
      expect(mockSongQuery.limit).toHaveBeenCalledWith(100);
      expect(mockSongQuery.select).toHaveBeenCalledWith("chordData documentSize");

      expect(Arrangement.find).toHaveBeenCalledWith({});
      expect(mockArrangementQuery.limit).toHaveBeenCalledWith(50);
      expect(mockArrangementQuery.select).toHaveBeenCalledWith("chordData documentSize");

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          sampleSize: 3, // 2 songs + 1 arrangement
          estimatedCompressionRatio: expect.any(Number),
          originalSizeEstimate: expect.any(Number),
          compressedSizeEstimate: expect.any(Number),
          spacesSaved: expect.any(Number),
        },
      });
    });

    it("handles empty sample data", async () => {
      const { req, res } = createMockReqRes();

      const mockQuery = {
        limit: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([]),
      };

      (Song.find as any).mockReturnValue(mockQuery);
      (Arrangement.find as any).mockReturnValue(mockQuery);

      await getCompressionStats(req as Request, res as Response);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          sampleSize: 0,
          estimatedCompressionRatio: 0,
          originalSizeEstimate: 0,
          compressedSizeEstimate: 0,
          spacesSaved: 0,
        },
      });
    });

    it("handles database errors", async () => {
      const { req, res } = createMockReqRes();

      (Song.find as any).mockImplementation(() => {
        throw new Error("Database error");
      });

      await getCompressionStats(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch compression statistics",
        },
      });
    });
  });

  describe("healthCheck", () => {
    it("returns healthy status when database is connected and usage is low", async () => {
      const { req, res } = createMockReqRes();

      (database.isConnectedToDatabase as any).mockReturnValue(true);
      (database.getStorageStats as any).mockResolvedValue({
        ...mockStorageStats,
        percentage: 50,
      });

      await healthCheck(req as Request, res as Response);

      expect(database.isConnectedToDatabase).toHaveBeenCalled();
      expect(database.getStorageStats).toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        status: "healthy",
        data: {
          database: {
            connected: true,
            usage: "256MB / 512MB",
            percentage: "50%",
          },
          warnings: [],
        },
      });
    });

    it("returns degraded status when storage usage is high", async () => {
      const { req, res } = createMockReqRes();

      (database.isConnectedToDatabase as any).mockReturnValue(true);
      (database.getStorageStats as any).mockResolvedValue({
        ...mockStorageStats,
        percentage: 95,
      });

      await healthCheck(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        status: "degraded",
        data: {
          database: {
            connected: true,
            usage: "256MB / 512MB",
            percentage: "95%",
          },
          warnings: ["High storage usage"], // 95% > 80% so warning is included
        },
      });
    });

    it("returns warnings when storage usage is above 80%", async () => {
      const { req, res } = createMockReqRes();

      (database.isConnectedToDatabase as any).mockReturnValue(true);
      (database.getStorageStats as any).mockResolvedValue({
        ...mockStorageStats,
        percentage: 85,
      });

      await healthCheck(req as Request, res as Response);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        status: "healthy",
        data: {
          database: {
            connected: true,
            usage: "256MB / 512MB",
            percentage: "85%",
          },
          warnings: ["High storage usage"],
        },
      });
    });

    it("returns unhealthy status when database is disconnected", async () => {
      const { req, res } = createMockReqRes();

      (database.isConnectedToDatabase as any).mockReturnValue(false);

      await healthCheck(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        status: "unhealthy",
        error: {
          code: "DATABASE_DISCONNECTED",
          message: "Database connection lost",
        },
      });
    });

    it("handles health check errors", async () => {
      const { req, res } = createMockReqRes();

      (database.isConnectedToDatabase as any).mockImplementation(() => {
        throw new Error("Connection check failed");
      });

      await healthCheck(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        status: "error",
        error: {
          code: "HEALTH_CHECK_FAILED",
          message: "Health check failed",
        },
      });
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("handles cleanup with no items to clean", async () => {
      const { req, res } = createMockReqRes({}); // No dryRun param defaults to false

      (Song.aggregate as any).mockResolvedValue([]);
      (Arrangement.find as any).mockResolvedValue([]);
      (Song.find as any).mockResolvedValue([]);
      (Setlist.find as any).mockResolvedValue([]);

      await triggerCleanup(req as Request, res as Response);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          dryRun: false,
          results: {
            duplicateSlugs: 0,
            unusedArrangements: 0,
            oldUnusedSongs: 0,
            emptySetlists: 0,
          },
          message: "Cleanup completed successfully",
        },
      });
    });

    it("handles compression stats with missing data fields", async () => {
      const { req, res } = createMockReqRes();

      const incompleteData = [
        { _id: "song1", chordData: null, documentSize: 1024 },
        { _id: "song2", chordData: "test", documentSize: null },
      ];

      const mockQuery = {
        limit: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(incompleteData),
      };

      (Song.find as any).mockReturnValue(mockQuery);
      (Arrangement.find as any).mockReturnValue(mockQuery);

      await getCompressionStats(req as Request, res as Response);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          sampleSize: 4, // 2 songs + 2 arrangements
          estimatedCompressionRatio: 0, // No valid data to calculate
          originalSizeEstimate: 0,
          compressedSizeEstimate: 0,
          spacesSaved: 0,
        },
      });
    });

    it("handles storage stats query failures gracefully", async () => {
      const { req, res } = createMockReqRes();

      (database.getStorageStats as any).mockResolvedValue(mockStorageStats);
      (Song.countDocuments as any).mockResolvedValue(150);
      (Setlist.countDocuments as any).mockRejectedValue(new Error("Count failed"));

      await getStorageStats(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(mockConsole.error).toHaveBeenCalledWith("Error fetching storage stats:", expect.any(Error));
    });
  });
});