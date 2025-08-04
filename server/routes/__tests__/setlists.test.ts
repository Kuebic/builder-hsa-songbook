import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";
import {
  getSetlists,
  getSetlist,
  getSetlistByToken,
  createSetlist,
  updateSetlist,
  deleteSetlist,
  addSongToSetlist,
  removeSongFromSetlist,
  reorderSetlistSongs,
} from "../setlists";
import { Setlist } from "../../database/models";

// Mock the Setlist model
vi.mock("../../database/models", () => {
  const MockSetlist = vi.fn();
  Object.assign(MockSetlist, {
    find: vi.fn(),
    findById: vi.fn(),
    findByIdAndDelete: vi.fn(),
    countDocuments: vi.fn(),
    findByShareToken: vi.fn(),
  });
  
  return {
    Setlist: MockSetlist,
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

// Mock setlist data
const mockSetlist = {
  _id: "60f7b1c3e4b0c72a1a654321",
  name: "Sunday Morning Worship",
  description: "Songs for Sunday morning service",
  createdBy: "user123",
  songs: [
    {
      arrangementId: "arr1",
      transposeBy: 0,
      notes: "Start quietly",
      order: 1,
    },
    {
      arrangementId: "arr2",
      transposeBy: 2,
      notes: "Full band",
      order: 2,
    },
  ],
  tags: ["worship", "sunday"],
  metadata: {
    date: "2024-01-28T10:00:00.000Z",
    venue: "Main Sanctuary",
    isPublic: true,
  },
  createdAt: "2024-01-20T00:00:00.000Z",
  updatedAt: "2024-01-20T00:00:00.000Z",
  populate: vi.fn().mockReturnThis(),
  save: vi.fn(),
  addSong: vi.fn(),
  removeSong: vi.fn(),
  reorderSongs: vi.fn(),
};

const mockSetlists = [
  { ...mockSetlist },
  {
    ...mockSetlist,
    _id: "60f7b1c3e4b0c72a1a654322",
    name: "Evening Service",
    metadata: { ...mockSetlist.metadata, isPublic: false },
  },
];

describe("Setlists API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getSetlists", () => {
    it("returns setlists with default pagination", async () => {
      const { req, res } = createMockReqRes();

      // Mock mongoose chain methods
      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockSetlists),
      };

      (Setlist as any).find.mockReturnValue(mockQuery);
      (Setlist as any).countDocuments.mockResolvedValue(10);

      await getSetlists(req as Request, res as Response);

      expect((Setlist as any).find).toHaveBeenCalledWith({});
      expect(mockQuery.limit).toHaveBeenCalledWith(20);
      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockSetlists,
        meta: {
          total: 10,
          page: 1,
          limit: 20,
        },
      });
    });

    it("applies search filter correctly", async () => {
      const { req, res } = createMockReqRes({ search: "Sunday" });

      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([mockSetlist]),
      };

      (Setlist as any).find.mockReturnValue(mockQuery);
      (Setlist as any).countDocuments.mockResolvedValue(1);

      await getSetlists(req as Request, res as Response);

      expect((Setlist as any).find).toHaveBeenCalledWith({
        $text: { $search: "Sunday" },
      });
      expect(mockQuery.sort).toHaveBeenCalledWith({ score: { $meta: "textScore" } });
    });

    it("applies createdBy filter correctly", async () => {
      const { req, res } = createMockReqRes({ createdBy: "user123" });

      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([mockSetlist]),
      };

      (Setlist as any).find.mockReturnValue(mockQuery);
      (Setlist as any).countDocuments.mockResolvedValue(1);

      await getSetlists(req as Request, res as Response);

      expect((Setlist as any).find).toHaveBeenCalledWith({
        createdBy: "user123",
      });
    });

    it("applies tags filter correctly", async () => {
      const { req, res } = createMockReqRes({ tags: "worship,sunday" });

      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([mockSetlist]),
      };

      (Setlist as any).find.mockReturnValue(mockQuery);
      (Setlist as any).countDocuments.mockResolvedValue(1);

      await getSetlists(req as Request, res as Response);

      expect((Setlist as any).find).toHaveBeenCalledWith({
        tags: { $in: ["worship", "sunday"] },
      });
    });

    it("applies isPublic filter correctly", async () => {
      const { req, res } = createMockReqRes({ isPublic: "true" });

      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([mockSetlist]),
      };

      (Setlist as any).find.mockReturnValue(mockQuery);
      (Setlist as any).countDocuments.mockResolvedValue(1);

      await getSetlists(req as Request, res as Response);

      expect((Setlist as any).find).toHaveBeenCalledWith({
        "metadata.isPublic": true,
      });
    });

    it("handles validation errors", async () => {
      const { req, res } = createMockReqRes({ limit: "invalid" });

      await getSetlists(req as Request, res as Response);

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

      (Setlist as any).find.mockImplementation(() => {
        throw new Error("Database error");
      });

      await getSetlists(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch setlists",
        },
      });
    });
  });

  describe("getSetlist", () => {
    it("returns a public setlist successfully", async () => {
      const { req, res } = createMockReqRes({}, { id: "60f7b1c3e4b0c72a1a654321" });

      const mockSetlistWithPopulate = {
        ...mockSetlist,
        populate: vi.fn().mockResolvedValue(mockSetlist),
      };

      (Setlist as any).findById.mockReturnValue(mockSetlistWithPopulate);

      await getSetlist(req as Request, res as Response);

      expect((Setlist as any).findById).toHaveBeenCalledWith("60f7b1c3e4b0c72a1a654321");
      expect(mockSetlistWithPopulate.populate).toHaveBeenCalledWith({
        path: "songs.arrangementId",
        populate: {
          path: "songIds",
          select: "title artist key tempo difficulty chordData",
        },
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockSetlist,
      });
    });

    it("returns 404 for non-existent setlist", async () => {
      const { req, res } = createMockReqRes({}, { id: "nonexistent" });

      (Setlist as any).findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(null),
      });

      await getSetlist(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Setlist not found",
        },
      });
    });

    it("returns 403 for private setlist", async () => {
      const privateSetlist = {
        ...mockSetlist,
        metadata: { ...mockSetlist.metadata, isPublic: false },
      };
      const { req, res } = createMockReqRes({}, { id: "60f7b1c3e4b0c72a1a654321" });

      (Setlist as any).findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(privateSetlist),
      });

      await getSetlist(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Access denied to private setlist",
        },
      });
    });

    it("handles database errors", async () => {
      const { req, res } = createMockReqRes({}, { id: "60f7b1c3e4b0c72a1a654321" });

      (Setlist as any).findById.mockRejectedValue(new Error("Database error"));

      await getSetlist(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch setlist",
        },
      });
    });
  });

  describe("getSetlistByToken", () => {
    it("returns setlist by valid share token", async () => {
      const { req, res } = createMockReqRes({}, { token: "valid-token" });

      (Setlist as any).findByShareToken.mockResolvedValue(mockSetlist);

      await getSetlistByToken(req as Request, res as Response);

      expect((Setlist as any).findByShareToken).toHaveBeenCalledWith("valid-token");
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockSetlist,
      });
    });

    it("returns 404 for invalid share token", async () => {
      const { req, res } = createMockReqRes({}, { token: "invalid-token" });

      (Setlist as any).findByShareToken.mockResolvedValue(null);

      await getSetlistByToken(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Setlist not found or share token invalid",
        },
      });
    });

    it("handles database errors", async () => {
      const { req, res } = createMockReqRes({}, { token: "valid-token" });

      (Setlist as any).findByShareToken.mockRejectedValue(new Error("Database error"));

      await getSetlistByToken(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch setlist",
        },
      });
    });
  });

  describe("createSetlist", () => {
    const validSetlistData = {
      name: "New Setlist",
      description: "Test setlist",
      createdBy: "user123",
      songs: [
        {
          songId: "60f7b1c3e4b0c72a1a123455", // Valid ObjectId string format
          arrangementId: "60f7b1c3e4b0c72a1a123456", // Valid ObjectId string format
          transpose: 0,
          notes: "Test notes",
          order: 1,
        },
      ],
      tags: ["test"],
      isPublic: true,
    };

    it("creates a setlist successfully", async () => {
      const { req, res } = createMockReqRes({}, {}, validSetlistData);

      const mockSetlistInstance = {
        ...mockSetlist,
        save: vi.fn().mockResolvedValue(mockSetlist), // Return the instance for chaining
        populate: vi.fn().mockResolvedValue(mockSetlist), // Return the instance for chaining
      };

      // Mock the Setlist constructor to return our mock instance
      (Setlist as any).mockImplementation(() => mockSetlistInstance);

      await createSetlist(req as Request, res as Response);

      // Verify the setlist instance methods were called
      expect(mockSetlistInstance.save).toHaveBeenCalled();
      expect(mockSetlistInstance.populate).toHaveBeenCalledWith({
        path: "songs.arrangementId",
        populate: {
          path: "songIds",
          select: "title artist",
        },
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockSetlistInstance,
      });
    });

    it("handles validation errors", async () => {
      const invalidData = { name: "" }; // Missing required fields
      const { req, res } = createMockReqRes({}, {}, invalidData);

      await createSetlist(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid setlist data",
          details: expect.any(Array),
        },
      });
    });

    it("handles database errors", async () => {
      const { req, res } = createMockReqRes({}, {}, validSetlistData);

      const mockSetlistInstance = {
        save: vi.fn().mockRejectedValue(new Error("Database error")),
        populate: vi.fn(), // Include populate method to avoid errors
      };

      (Setlist as any).mockImplementation(() => mockSetlistInstance);

      await createSetlist(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to create setlist",
        },
      });
    });
  });

  describe("updateSetlist", () => {
    const updateData = {
      name: "Updated Setlist",
      description: "Updated description",
      tags: ["updated"],
    };

    it("updates a setlist successfully", async () => {
      const { req, res } = createMockReqRes({}, { id: "60f7b1c3e4b0c72a1a654321" }, updateData);

      const mockSetlistInstance = { ...mockSetlist };
      (Setlist as any).findById.mockResolvedValue(mockSetlistInstance);

      await updateSetlist(req as Request, res as Response);

      expect((Setlist as any).findById).toHaveBeenCalledWith("60f7b1c3e4b0c72a1a654321");
      // Object.assign is used to update the setlist instance - verify the setlist was updated
      expect(mockSetlistInstance.name).toBe(updateData.name);
      expect(mockSetlistInstance.description).toBe(updateData.description);
      expect(mockSetlistInstance.tags).toEqual(updateData.tags);
      expect(mockSetlistInstance.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockSetlistInstance,
      });
    });

    it("returns 404 for non-existent setlist", async () => {
      const { req, res } = createMockReqRes({}, { id: "nonexistent" }, updateData);

      (Setlist as any).findById.mockResolvedValue(null);

      await updateSetlist(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Setlist not found",
        },
      });
    });

    it("handles validation errors", async () => {
      const invalidData = { songs: [{ order: "invalid" }] }; // Invalid order type
      const { req, res } = createMockReqRes({}, { id: "60f7b1c3e4b0c72a1a654321" }, invalidData);

      await updateSetlist(req as Request, res as Response);

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
      const { req, res } = createMockReqRes({}, { id: "60f7b1c3e4b0c72a1a654321" }, updateData);

      (Setlist as any).findById.mockRejectedValue(new Error("Database error"));

      await updateSetlist(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to update setlist",
        },
      });
    });
  });

  describe("deleteSetlist", () => {
    it("deletes a setlist successfully", async () => {
      const { req, res } = createMockReqRes({}, { id: "60f7b1c3e4b0c72a1a654321" });

      (Setlist as any).findById.mockResolvedValue(mockSetlist);
      (Setlist as any).findByIdAndDelete.mockResolvedValue(mockSetlist);

      await deleteSetlist(req as Request, res as Response);

      expect((Setlist as any).findById).toHaveBeenCalledWith("60f7b1c3e4b0c72a1a654321");
      expect((Setlist as any).findByIdAndDelete).toHaveBeenCalledWith("60f7b1c3e4b0c72a1a654321");
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { id: "60f7b1c3e4b0c72a1a654321" },
      });
    });

    it("returns 404 for non-existent setlist", async () => {
      const { req, res } = createMockReqRes({}, { id: "nonexistent" });

      (Setlist as any).findById.mockResolvedValue(null);

      await deleteSetlist(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Setlist not found",
        },
      });
    });

    it("handles database errors", async () => {
      const { req, res } = createMockReqRes({}, { id: "60f7b1c3e4b0c72a1a654321" });

      (Setlist as any).findById.mockRejectedValue(new Error("Database error"));

      await deleteSetlist(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to delete setlist",
        },
      });
    });
  });

  describe("addSongToSetlist", () => {
    it("adds a song to setlist successfully", async () => {
      const { req, res } = createMockReqRes(
        {},
        { id: "60f7b1c3e4b0c72a1a654321" },
        { arrangementId: "arr123", transposeBy: 2, notes: "Test notes" }
      );

      const mockSetlistInstance = { ...mockSetlist };
      (Setlist as any).findById.mockResolvedValue(mockSetlistInstance);

      await addSongToSetlist(req as Request, res as Response);

      expect((Setlist as any).findById).toHaveBeenCalledWith("60f7b1c3e4b0c72a1a654321");
      expect(mockSetlistInstance.addSong).toHaveBeenCalledWith("arr123", 2, "Test notes");
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockSetlist,
      });
    });

    it("returns 400 for missing arrangement ID", async () => {
      const { req, res } = createMockReqRes(
        {},
        { id: "60f7b1c3e4b0c72a1a654321" },
        { transposeBy: 2 }
      );

      await addSongToSetlist(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "MISSING_ARRANGEMENT",
          message: "Arrangement ID is required",
        },
      });
    });

    it("returns 404 for non-existent setlist", async () => {
      const { req, res } = createMockReqRes(
        {},
        { id: "nonexistent" },
        { arrangementId: "arr123" }
      );

      (Setlist as any).findById.mockResolvedValue(null);

      await addSongToSetlist(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Setlist not found",
        },
      });
    });

    it("handles database errors", async () => {
      const { req, res } = createMockReqRes(
        {},
        { id: "60f7b1c3e4b0c72a1a654321" },
        { arrangementId: "arr123" }
      );

      (Setlist as any).findById.mockRejectedValue(new Error("Database error"));

      await addSongToSetlist(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to add song to setlist",
        },
      });
    });
  });

  describe("removeSongFromSetlist", () => {
    it("removes a song from setlist successfully", async () => {
      const { req, res } = createMockReqRes(
        {},
        { id: "60f7b1c3e4b0c72a1a654321", arrangementId: "arr123" }
      );

      const mockSetlistInstance = { ...mockSetlist };
      (Setlist as any).findById.mockResolvedValue(mockSetlistInstance);

      await removeSongFromSetlist(req as Request, res as Response);

      expect((Setlist as any).findById).toHaveBeenCalledWith("60f7b1c3e4b0c72a1a654321");
      expect(mockSetlistInstance.removeSong).toHaveBeenCalledWith("arr123");
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockSetlist,
      });
    });

    it("returns 404 for non-existent setlist", async () => {
      const { req, res } = createMockReqRes(
        {},
        { id: "nonexistent", arrangementId: "arr123" }
      );

      (Setlist as any).findById.mockResolvedValue(null);

      await removeSongFromSetlist(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Setlist not found",
        },
      });
    });

    it("handles database errors", async () => {
      const { req, res } = createMockReqRes(
        {},
        { id: "60f7b1c3e4b0c72a1a654321", arrangementId: "arr123" }
      );

      (Setlist as any).findById.mockRejectedValue(new Error("Database error"));

      await removeSongFromSetlist(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to remove song from setlist",
        },
      });
    });
  });

  describe("reorderSetlistSongs", () => {
    it("reorders songs in setlist successfully", async () => {
      const { req, res } = createMockReqRes(
        {},
        { id: "60f7b1c3e4b0c72a1a654321" },
        { songOrder: ["arr2", "arr1", "arr3"] }
      );

      const mockSetlistInstance = { ...mockSetlist };
      (Setlist as any).findById.mockResolvedValue(mockSetlistInstance);

      await reorderSetlistSongs(req as Request, res as Response);

      expect((Setlist as any).findById).toHaveBeenCalledWith("60f7b1c3e4b0c72a1a654321");
      expect(mockSetlistInstance.reorderSongs).toHaveBeenCalledWith(["arr2", "arr1", "arr3"]);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockSetlist,
      });
    });

    it("returns 400 for invalid song order", async () => {
      const { req, res } = createMockReqRes(
        {},
        { id: "60f7b1c3e4b0c72a1a654321" },
        { songOrder: "not-an-array" }
      );

      await reorderSetlistSongs(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "INVALID_ORDER",
          message: "Song order must be an array of arrangement IDs",
        },
      });
    });

    it("returns 404 for non-existent setlist", async () => {
      const { req, res } = createMockReqRes(
        {},
        { id: "nonexistent" },
        { songOrder: ["arr1", "arr2"] }
      );

      (Setlist as any).findById.mockResolvedValue(null);

      await reorderSetlistSongs(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Setlist not found",
        },
      });
    });

    it("handles database errors", async () => {
      const { req, res } = createMockReqRes(
        {},
        { id: "60f7b1c3e4b0c72a1a654321" },
        { songOrder: ["arr1", "arr2"] }
      );

      (Setlist as any).findById.mockRejectedValue(new Error("Database error"));

      await reorderSetlistSongs(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to reorder songs",
        },
      });
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("handles malformed ObjectId in getSetlist", async () => {
      const { req, res } = createMockReqRes({}, { id: "invalid-id" });

      (Setlist as any).findById.mockRejectedValue(new Error("Cast to ObjectId failed"));

      await getSetlist(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(mockConsole.error).toHaveBeenCalledWith("Error fetching setlist:", expect.any(Error));
    });

    it("handles complex filter combinations", async () => {
      const { req, res } = createMockReqRes({
        search: "worship",
        createdBy: "user123",
        tags: "sunday,evening",
        isPublic: "true",
        limit: "10",
        offset: "5",
      });

      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([mockSetlist]),
      };

      (Setlist as any).find.mockReturnValue(mockQuery);
      (Setlist as any).countDocuments.mockResolvedValue(1);

      await getSetlists(req as Request, res as Response);

      expect((Setlist as any).find).toHaveBeenCalledWith({
        $text: { $search: "worship" },
        createdBy: "user123",
        tags: { $in: ["sunday", "evening"] },
        "metadata.isPublic": true,
      });
      expect(mockQuery.limit).toHaveBeenCalledWith(10);
      expect(mockQuery.skip).toHaveBeenCalledWith(5);
    });

    it("handles setlist updates with metadata", async () => {
      const updateData = {
        name: "Updated Setlist Name",
        isPublic: false,
      };
      const { req, res } = createMockReqRes({}, { id: "60f7b1c3e4b0c72a1a654321" }, updateData);

      // Create a mutable mock setlist instance
      const mockSetlistInstance = {
        ...mockSetlist,
        name: mockSetlist.name,
        metadata: { ...mockSetlist.metadata },
        save: vi.fn().mockResolvedValue(undefined),
        populate: vi.fn().mockResolvedValue(mockSetlist),
      };

      (Setlist as any).findById.mockResolvedValue(mockSetlistInstance);

      await updateSetlist(req as Request, res as Response);

      // Verify the setlist properties were updated
      expect(mockSetlistInstance.name).toBe("Updated Setlist Name");
      expect(mockSetlistInstance.metadata.isPublic).toBe(false);
      expect(mockSetlistInstance.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockSetlistInstance,
      });
    });
  });
});