import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";
import {
  batchSync,
  getSyncStatus,
  resolveConflicts,
} from "../sync";
import { Song, Setlist, Arrangement, User } from "../../database/models";

// Mock the models
vi.mock("../../database/models", () => ({
  Song: vi.fn().mockImplementation(() => ({
    save: vi.fn(),
  })),
  Setlist: vi.fn().mockImplementation(() => ({
    save: vi.fn(),
  })),
  Arrangement: vi.fn().mockImplementation(() => ({
    save: vi.fn(),
  })),
  User: vi.fn().mockImplementation(() => ({
    save: vi.fn(),
  })),
}));

// Add static methods to the constructors
Object.assign(Song, {
  findById: vi.fn(),
  findByIdAndDelete: vi.fn(),
  find: vi.fn(),
});

Object.assign(Setlist, {
  findById: vi.fn(),
  findByIdAndDelete: vi.fn(),
  find: vi.fn(),
});

Object.assign(Arrangement, {
  findById: vi.fn(),
  findByIdAndDelete: vi.fn(),
  find: vi.fn(),
});

Object.assign(User, {
  findById: vi.fn(),
  findByIdAndDelete: vi.fn(),
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

// Mock data
const mockSong = {
  _id: "song123",
  title: "Amazing Grace",
  artist: "John Newton",
  updatedAt: new Date("2024-01-15T10:00:00Z"),
  save: vi.fn(),
};

const mockSetlist = {
  _id: "setlist123",
  name: "Sunday Service",
  updatedAt: new Date("2024-01-15T10:00:00Z"),
  save: vi.fn(),
};

const mockArrangement = {
  _id: "arrangement123",
  name: "Piano Arrangement",
  updatedAt: new Date("2024-01-15T10:00:00Z"),
  save: vi.fn(),
};

const mockUser = {
  _id: "user123",
  name: "John Doe",
  email: "john@example.com",
  save: vi.fn(),
};

const validSyncOperation = {
  id: "op123",
  operation: "create" as const,
  entity: "song" as const,
  entityId: "song123",
  data: {
    title: "New Song",
    artist: "Test Artist",
    chordData: "Test content",
  },
  timestamp: Date.now(),
  clientId: "client123",
};

describe("Sync API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("batchSync", () => {
    it("processes valid sync operations successfully", async () => {
      const operations = [validSyncOperation];
      const { req, res } = createMockReqRes({}, {}, {
        operations,
        clientLastSync: Date.now() - 60000, // 1 minute ago
      });

      // Mock successful song creation
      const mockSongInstance = { ...mockSong, save: vi.fn().mockResolvedValue(mockSong) };
      (Song as any).mockImplementation(() => mockSongInstance);

      // Mock server changes query
      (Song.find as any).mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });
      (Setlist.find as any).mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });
      (Arrangement.find as any).mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });

      await batchSync(req as Request, res as Response);

      expect(Song).toHaveBeenCalledWith(validSyncOperation.data);
      expect(mockSongInstance.save).toHaveBeenCalled();
      
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          results: [
            {
              operationId: "op123",
              success: true,
              result: mockSongInstance,
            },
          ],
          conflicts: [],
          serverChanges: [],
          serverTimestamp: expect.any(Number),
        },
      });
    });

    it("processes song update operations with conflict detection", async () => {
      const updateOperation = {
        ...validSyncOperation,
        operation: "update" as const,
        data: {
          ...validSyncOperation.data,
          updatedAt: new Date("2024-01-15T09:00:00Z"), // Earlier than server
        },
      };

      const { req, res } = createMockReqRes({}, {}, {
        operations: [updateOperation],
      });

      // Mock existing song with later update time
      const existingSong = {
        ...mockSong,
        updatedAt: new Date("2024-01-15T10:00:00Z"), // Later than client
      };
      (Song.findById as any).mockResolvedValue(existingSong);

      // Mock server changes query
      (Song.find as any).mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });
      (Setlist.find as any).mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });
      (Arrangement.find as any).mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });

      await batchSync(req as Request, res as Response);

      expect(Song.findById).toHaveBeenCalledWith("song123");
      
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          results: [],
          conflicts: [
            {
              operationId: "op123",
              type: "conflict",
              serverData: existingSong,
              clientData: updateOperation.data,
              lastModified: new Date("2024-01-15T10:00:00Z").getTime(),
            },
          ],
          serverChanges: [],
          serverTimestamp: expect.any(Number),
        },
      });
    });

    it("processes song deletion successfully", async () => {
      const deleteOperation = {
        ...validSyncOperation,
        operation: "delete" as const,
      };

      const { req, res } = createMockReqRes({}, {}, {
        operations: [deleteOperation],
      });

      (Song.findByIdAndDelete as any).mockResolvedValue(mockSong);

      // Mock server changes query
      (Song.find as any).mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });
      (Setlist.find as any).mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });
      (Arrangement.find as any).mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });

      await batchSync(req as Request, res as Response);

      expect(Song.findByIdAndDelete).toHaveBeenCalledWith("song123");
      
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          results: [
            {
              operationId: "op123",
              success: true,
              result: { deleted: true },
            },
          ],
          conflicts: [],
          serverChanges: [],
          serverTimestamp: expect.any(Number),
        },
      });
    });

    it("processes setlist operations", async () => {
      const setlistOperation = {
        ...validSyncOperation,
        entity: "setlist" as const,
        entityId: "setlist123",
        data: {
          name: "New Setlist",
          description: "Test setlist",
        },
      };

      const { req, res } = createMockReqRes({}, {}, {
        operations: [setlistOperation],
      });

      const mockSetlistInstance = { ...mockSetlist, save: vi.fn().mockResolvedValue(mockSetlist) };
      (Setlist as any).mockImplementation(() => mockSetlistInstance);

      // Mock server changes query
      (Song.find as any).mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });
      (Setlist.find as any).mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });
      (Arrangement.find as any).mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });

      await batchSync(req as Request, res as Response);

      expect(Setlist).toHaveBeenCalledWith(setlistOperation.data);
      expect(mockSetlistInstance.save).toHaveBeenCalled();
    });

    it("processes arrangement operations", async () => {
      const arrangementOperation = {
        ...validSyncOperation,
        entity: "arrangement" as const,
        entityId: "arrangement123",
        data: {
          name: "New Arrangement",
          chordData: "Test chords",
        },
      };

      const { req, res } = createMockReqRes({}, {}, {
        operations: [arrangementOperation],
      });

      const mockArrangementInstance = { ...mockArrangement, save: vi.fn().mockResolvedValue(mockArrangement) };
      (Arrangement as any).mockImplementation(() => mockArrangementInstance);

      // Mock server changes query
      (Song.find as any).mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });
      (Setlist.find as any).mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });
      (Arrangement.find as any).mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });

      await batchSync(req as Request, res as Response);

      expect(Arrangement).toHaveBeenCalledWith(arrangementOperation.data);
      expect(mockArrangementInstance.save).toHaveBeenCalled();
    });

    it("processes user operations with upsert behavior", async () => {
      const userOperation = {
        ...validSyncOperation,
        entity: "user" as const,
        operation: "update" as const,
        entityId: "user123",
        data: {
          name: "John Doe",
          email: "john@example.com",
        },
      };

      const { req, res } = createMockReqRes({}, {}, {
        operations: [userOperation],
      });

      // Mock user not found (should create new user)
      (User.findById as any).mockResolvedValue(null);
      const mockUserInstance = { ...mockUser, save: vi.fn().mockResolvedValue(mockUser) };
      (User as any).mockImplementation(() => mockUserInstance);

      // Mock server changes query
      (Song.find as any).mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });
      (Setlist.find as any).mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });
      (Arrangement.find as any).mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });

      await batchSync(req as Request, res as Response);

      expect(User.findById).toHaveBeenCalledWith("user123");
      expect(User).toHaveBeenCalledWith({ _id: "user123", ...userOperation.data });
      expect(mockUserInstance.save).toHaveBeenCalled();
    });

    it("returns server changes since client last sync", async () => {
      const { req, res } = createMockReqRes({}, {}, {
        operations: [],
        clientLastSync: Date.now() - 60000, // 1 minute ago
      });

      // Mock server changes
      const recentSongs = [{ _id: "song1", title: "Recent Song" }];
      const recentSetlists = [{ _id: "setlist1", name: "Recent Setlist" }];

      (Song.find as any).mockReturnValue({ lean: vi.fn().mockResolvedValue(recentSongs) });
      (Setlist.find as any).mockReturnValue({ lean: vi.fn().mockResolvedValue(recentSetlists) });
      (Arrangement.find as any).mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });

      await batchSync(req as Request, res as Response);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          results: [],
          conflicts: [],
          serverChanges: [
            { entity: "song", data: { _id: "song1", title: "Recent Song" } },
            { entity: "setlist", data: { _id: "setlist1", name: "Recent Setlist" } },
          ],
          serverTimestamp: expect.any(Number),
        },
      });
    });

    it("handles validation errors", async () => {
      const invalidOperations = [
        {
          id: "op123",
          operation: "invalid-operation", // Invalid operation
          entity: "song",
          entityId: "song123",
          data: {},
          timestamp: Date.now(),
        },
      ];

      const { req, res } = createMockReqRes({}, {}, {
        operations: invalidOperations,
      });

      await batchSync(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid sync data",
          details: expect.any(Array),
        },
      });
    });

    it("limits batch size to prevent abuse", async () => {
      const manyOperations = Array.from({ length: 51 }, (_, i) => ({
        ...validSyncOperation,
        id: `op${i}`,
      }));

      const { req, res } = createMockReqRes({}, {}, {
        operations: manyOperations,
      });

      await batchSync(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid sync data",
          details: expect.any(Array),
        },
      });
    });

    it("handles individual operation failures gracefully", async () => {
      const operations = [
        validSyncOperation,
      ];

      const { req, res } = createMockReqRes({}, {}, {
        operations,
      });

      // Mock operation that throws an error during processing
      const mockSongInstance = { 
        ...mockSong, 
        save: vi.fn().mockRejectedValue(new Error("Save failed"))
      };
      (Song as any).mockImplementation(() => mockSongInstance);

      // Mock server changes query
      (Song.find as any).mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });
      (Setlist.find as any).mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });
      (Arrangement.find as any).mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });

      await batchSync(req as Request, res as Response);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          results: [
            {
              operationId: "op123",
              success: false,
              error: {
                code: "SYNC_FAILED",
                message: "Save failed",
              },
            },
          ],
          conflicts: [],
          serverChanges: [],
          serverTimestamp: expect.any(Number),
        },
      });
    });

  });

  describe("getSyncStatus", () => {
    it("returns status for valid operation IDs", async () => {
      const { req, res } = createMockReqRes({ operationIds: "op1,op2,op3" });

      await getSyncStatus(req as Request, res as Response);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          statuses: [
            {
              operationId: "op1",
              status: "processed",
              timestamp: expect.any(Number),
            },
            {
              operationId: "op2",
              status: "processed",
              timestamp: expect.any(Number),
            },
            {
              operationId: "op3",
              status: "processed",
              timestamp: expect.any(Number),
            },
          ],
        },
      });
    });

    it("returns error for missing operation IDs", async () => {
      const { req, res } = createMockReqRes({});

      await getSyncStatus(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "MISSING_OPERATION_IDS",
          message: "Operation IDs are required",
        },
      });
    });

    it("handles errors during status fetch", async () => {
      const { req, res } = createMockReqRes({ operationIds: "op1" });

      // Force an error by making the query property throw
      Object.defineProperty(req, 'query', {
        get() {
          throw new Error("System error");
        }
      });

      await getSyncStatus(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch sync status",
        },
      });
    });
  });

  describe("resolveConflicts", () => {
    it("resolves conflicts by choosing client version", async () => {
      const resolutions = [
        {
          operationId: "op123",
          choice: "client",
          entity: "song",
          entityId: "song123",
          data: {
            title: "Client Version",
            artist: "Client Artist",
          },
        },
      ];

      const { req, res } = createMockReqRes({}, {}, { resolutions });

      // Mock existing song update
      const existingSong = { ...mockSong };
      (Song.findById as any).mockResolvedValue(existingSong);

      await resolveConflicts(req as Request, res as Response);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          results: [
            {
              operationId: "op123",
              success: true,
              result: existingSong,
            },
          ],
        },
      });
    });

    it("resolves conflicts by keeping server version", async () => {
      const resolutions = [
        {
          operationId: "op123",
          choice: "server",
          entity: "song",
          entityId: "song123",
        },
      ];

      const { req, res } = createMockReqRes({}, {}, { resolutions });

      await resolveConflicts(req as Request, res as Response);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          results: [
            {
              operationId: "op123",
              success: true,
              result: { message: "Server version kept" },
            },
          ],
        },
      });
    });

    it("resolves conflicts by applying merged data", async () => {
      const resolutions = [
        {
          operationId: "op123",
          choice: "merge",
          entity: "song",
          entityId: "song123",
          data: {
            title: "Merged Title",
            artist: "Merged Artist",
          },
        },
      ];

      const { req, res } = createMockReqRes({}, {}, { resolutions });

      const existingSong = { ...mockSong };
      (Song.findById as any).mockResolvedValue(existingSong);

      await resolveConflicts(req as Request, res as Response);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          results: [
            {
              operationId: "op123",
              success: true,
              result: existingSong,
            },
          ],
        },
      });
    });

    it("handles invalid resolutions array", async () => {
      const { req, res } = createMockReqRes({}, {}, { resolutions: "not-an-array" });

      await resolveConflicts(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "INVALID_RESOLUTIONS",
          message: "Resolutions must be an array",
        },
      });
    });

    it("handles resolution failures gracefully", async () => {
      const resolutions = [
        {
          operationId: "op123",
          choice: "client",
          entity: "song",
          entityId: "song123",
          data: { title: "Test" },
        },
      ];

      const { req, res } = createMockReqRes({}, {}, { resolutions });

      (Song.findById as any).mockRejectedValue(new Error("Database error"));

      await resolveConflicts(req as Request, res as Response);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          results: [
            {
              operationId: "op123",
              success: false,
              error: {
                code: "RESOLUTION_FAILED",
                message: "Database error",
              },
            },
          ],
        },
      });
    });

    it("handles errors during conflict resolution", async () => {
      const { req, res } = createMockReqRes({}, {}, { resolutions: [] });

      // Force an error by making the request body throw during processing
      Object.defineProperty(req, 'body', {
        get() {
          throw new Error("System error");
        }
      });

      await resolveConflicts(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to resolve conflicts",
        },
      });
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("handles missing entity data during update", async () => {
      const updateOperation = {
        ...validSyncOperation,
        operation: "update" as const,
      };

      const { req, res } = createMockReqRes({}, {}, {
        operations: [updateOperation],
      });

      (Song.findById as any).mockResolvedValue(null);

      // Mock server changes query
      (Song.find as any).mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });
      (Setlist.find as any).mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });
      (Arrangement.find as any).mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });

      await batchSync(req as Request, res as Response);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          results: [
            {
              operationId: "op123",
              success: false,
              error: {
                code: "SYNC_FAILED",
                message: "Song not found",
              },
            },
          ],
          conflicts: [],
          serverChanges: [],
          serverTimestamp: expect.any(Number),
        },
      });
    });

    it("handles successful update without conflicts", async () => {
      const updateOperation = {
        ...validSyncOperation,
        operation: "update" as const,
        data: {
          ...validSyncOperation.data,
          updatedAt: new Date("2024-01-15T11:00:00Z"), // Later than server
        },
      };

      const { req, res } = createMockReqRes({}, {}, {
        operations: [updateOperation],
      });

      const existingSong = {
        ...mockSong,
        updatedAt: new Date("2024-01-15T10:00:00Z"), // Earlier than client
      };
      (Song.findById as any).mockResolvedValue(existingSong);

      // Mock server changes query
      (Song.find as any).mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });
      (Setlist.find as any).mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });
      (Arrangement.find as any).mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });

      await batchSync(req as Request, res as Response);

      expect(existingSong.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          results: [
            {
              operationId: "op123",
              success: true,
              result: existingSong,
            },
          ],
          conflicts: [],
          serverChanges: [],
          serverTimestamp: expect.any(Number),
        },
      });
    });

    it("handles empty operations array", async () => {
      const { req, res } = createMockReqRes({}, {}, {
        operations: [],
      });

      // Mock server changes query
      (Song.find as any).mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });
      (Setlist.find as any).mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });
      (Arrangement.find as any).mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });

      await batchSync(req as Request, res as Response);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          results: [],
          conflicts: [],
          serverChanges: [],
          serverTimestamp: expect.any(Number),
        },
      });
    });
  });
});