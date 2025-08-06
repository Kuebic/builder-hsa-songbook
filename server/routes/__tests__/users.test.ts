import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response } from "express";
import {
  getFavorites,
  addSongFavorite,
  removeSongFavorite,
  addArrangementFavorite,
  removeArrangementFavorite,
  getUserFavorites,
  addFavorite,
  removeFavorite,
  checkFavorite,
} from "../users";
import { User, Song, Arrangement } from "../../database/models";

// Mock the models
vi.mock("../../database/models", () => {
  const MockUser = vi.fn();
  Object.assign(MockUser, {
    findById: vi.fn(),
  });

  const MockSong = vi.fn();
  Object.assign(MockSong, {
    findById: vi.fn(),
  });

  const MockArrangement = vi.fn();
  Object.assign(MockArrangement, {
    findById: vi.fn(),
  });

  return {
    User: MockUser,
    Song: MockSong,
    Arrangement: MockArrangement,
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
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };

  return { req, res };
};

describe("Users API Routes - Dual Favorites", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/users/:userId/favorites", () => {
    it("should return both song and arrangement favorites by default", async () => {
      const { req, res } = createMockReqRes(
        {},
        { userId: "507f1f77bcf86cd799439011" },
      );

      const mockUserWithFavorites = {
        _id: "507f1f77bcf86cd799439011",
        favoriteSongs: [
          { _id: "song1", title: "Amazing Grace", artist: "John Newton" },
          { _id: "song2", title: "How Great Thou Art", artist: "Stuart Hine" },
        ],
        favoriteArrangements: [
          {
            _id: "arr1",
            name: "Acoustic Version",
            key: "G",
            songIds: [{ title: "Amazing Grace", artist: "John Newton" }],
          },
        ],
      };

      (User.findById as any)
        .mockReturnValueOnce({ _id: "507f1f77bcf86cd799439011" })
        .mockReturnValueOnce({
          populate: vi.fn().mockResolvedValue(mockUserWithFavorites),
        })
        .mockReturnValueOnce({
          populate: vi.fn().mockResolvedValue(mockUserWithFavorites),
        });

      await getFavorites(req as Request, res as Response);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          songs: mockUserWithFavorites.favoriteSongs,
          arrangements: mockUserWithFavorites.favoriteArrangements,
        },
        meta: {
          userId: "507f1f77bcf86cd799439011",
          type: "both",
          totalSongs: 2,
          totalArrangements: 1,
        },
      });
    });

    it("should return only song favorites when type=songs", async () => {
      const { req, res } = createMockReqRes(
        { type: "songs" },
        { userId: "507f1f77bcf86cd799439011" },
      );

      const mockUserWithSongs = {
        _id: "507f1f77bcf86cd799439011",
        favoriteSongs: [
          { _id: "song1", title: "Amazing Grace", artist: "John Newton" },
        ],
      };

      (User.findById as any)
        .mockReturnValueOnce({ _id: "507f1f77bcf86cd799439011" })
        .mockReturnValueOnce({
          populate: vi.fn().mockResolvedValue(mockUserWithSongs),
        });

      await getFavorites(req as Request, res as Response);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          songs: mockUserWithSongs.favoriteSongs,
          arrangements: undefined,
        },
        meta: {
          userId: "507f1f77bcf86cd799439011",
          type: "songs",
          totalSongs: 1,
          totalArrangements: 0,
        },
      });
    });

    it("should return only arrangement favorites when type=arrangements", async () => {
      const { req, res } = createMockReqRes(
        { type: "arrangements" },
        { userId: "507f1f77bcf86cd799439011" },
      );

      const mockUserWithArrangements = {
        _id: "507f1f77bcf86cd799439011",
        favoriteArrangements: [
          {
            _id: "arr1",
            name: "Acoustic Version",
            key: "G",
            metadata: { ratings: { average: 4.5 }, views: 100 },
          },
        ],
      };

      (User.findById as any)
        .mockReturnValueOnce({ _id: "507f1f77bcf86cd799439011" })
        .mockReturnValueOnce({
          populate: vi.fn().mockResolvedValue(mockUserWithArrangements),
        });

      await getFavorites(req as Request, res as Response);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          songs: undefined,
          arrangements: mockUserWithArrangements.favoriteArrangements,
        },
        meta: {
          userId: "507f1f77bcf86cd799439011",
          type: "arrangements",
          totalSongs: 0,
          totalArrangements: 1,
        },
      });
    });

    it("should return 404 if user not found", async () => {
      const { req, res } = createMockReqRes(
        {},
        { userId: "507f1f77bcf86cd799439011" },
      );

      (User.findById as any).mockResolvedValue(null);

      await getFavorites(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found",
        },
      });
    });
  });

  describe("POST /api/users/:userId/favorites/songs/:songId", () => {
    it("should add song to favorites", async () => {
      const { req, res } = createMockReqRes(
        {},
        {
          userId: "507f1f77bcf86cd799439011",
          songId: "507f1f77bcf86cd799439012",
        },
      );

      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        isFavoriteSong: vi.fn().mockReturnValue(false),
        addFavoriteSong: vi.fn().mockResolvedValue(true),
      };
      const mockSong = {
        _id: "507f1f77bcf86cd799439012",
        title: "Amazing Grace",
      };

      (User.findById as any).mockResolvedValue(mockUser);
      (Song.findById as any).mockResolvedValue(mockSong);

      await addSongFavorite(req as Request, res as Response);

      expect(mockUser.isFavoriteSong).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439012",
      );
      expect(mockUser.addFavoriteSong).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439012",
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          userId: "507f1f77bcf86cd799439011",
          songId: "507f1f77bcf86cd799439012",
          message: "Song added to favorites",
        },
      });
    });

    it("should return 409 if song already favorited", async () => {
      const { req, res } = createMockReqRes(
        {},
        {
          userId: "507f1f77bcf86cd799439011",
          songId: "507f1f77bcf86cd799439012",
        },
      );

      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        isFavoriteSong: vi.fn().mockReturnValue(true),
      };
      const mockSong = { _id: "507f1f77bcf86cd799439012" };

      (User.findById as any).mockResolvedValue(mockUser);
      (Song.findById as any).mockResolvedValue(mockSong);

      await addSongFavorite(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "ALREADY_FAVORITED",
          message: "Song is already in favorites",
        },
      });
    });

    it("should return 404 if song not found", async () => {
      const { req, res } = createMockReqRes(
        {},
        {
          userId: "507f1f77bcf86cd799439011",
          songId: "507f1f77bcf86cd799439012",
        },
      );

      const mockUser = { _id: "507f1f77bcf86cd799439011" };

      (User.findById as any).mockResolvedValue(mockUser);
      (Song.findById as any).mockResolvedValue(null);

      await addSongFavorite(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "SONG_NOT_FOUND",
          message: "Song not found",
        },
      });
    });
  });

  describe("DELETE /api/users/:userId/favorites/songs/:songId", () => {
    it("should remove song from favorites", async () => {
      const { req, res } = createMockReqRes(
        {},
        {
          userId: "507f1f77bcf86cd799439011",
          songId: "507f1f77bcf86cd799439012",
        },
      );

      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        isFavoriteSong: vi.fn().mockReturnValue(true),
        removeFavoriteSong: vi.fn().mockResolvedValue(true),
      };

      (User.findById as any).mockResolvedValue(mockUser);

      await removeSongFavorite(req as Request, res as Response);

      expect(mockUser.removeFavoriteSong).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439012",
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          userId: "507f1f77bcf86cd799439011",
          songId: "507f1f77bcf86cd799439012",
          message: "Song removed from favorites",
        },
      });
    });

    it("should return 404 if song not in favorites", async () => {
      const { req, res } = createMockReqRes(
        {},
        {
          userId: "507f1f77bcf86cd799439011",
          songId: "507f1f77bcf86cd799439012",
        },
      );

      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        isFavoriteSong: vi.fn().mockReturnValue(false),
      };

      (User.findById as any).mockResolvedValue(mockUser);

      await removeSongFavorite(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "NOT_FAVORITED",
          message: "Song is not in favorites",
        },
      });
    });
  });

  describe("POST /api/users/:userId/favorites/arrangements/:arrangementId", () => {
    it("should add arrangement to favorites", async () => {
      const { req, res } = createMockReqRes(
        {},
        {
          userId: "507f1f77bcf86cd799439011",
          arrangementId: "507f1f77bcf86cd799439013",
        },
      );

      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        isFavoriteArrangement: vi.fn().mockReturnValue(false),
        addFavoriteArrangement: vi.fn().mockResolvedValue(true),
      };
      const mockArrangement = {
        _id: "507f1f77bcf86cd799439013",
        name: "Acoustic Version",
      };

      (User.findById as any).mockResolvedValue(mockUser);
      (Arrangement.findById as any).mockResolvedValue(mockArrangement);

      await addArrangementFavorite(req as Request, res as Response);

      expect(mockUser.isFavoriteArrangement).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439013",
      );
      expect(mockUser.addFavoriteArrangement).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439013",
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          userId: "507f1f77bcf86cd799439011",
          arrangementId: "507f1f77bcf86cd799439013",
          message: "Arrangement added to favorites",
        },
      });
    });
  });

  describe("DELETE /api/users/:userId/favorites/arrangements/:arrangementId", () => {
    it("should remove arrangement from favorites", async () => {
      const { req, res } = createMockReqRes(
        {},
        {
          userId: "507f1f77bcf86cd799439011",
          arrangementId: "507f1f77bcf86cd799439013",
        },
      );

      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        isFavoriteArrangement: vi.fn().mockReturnValue(true),
        removeFavoriteArrangement: vi.fn().mockResolvedValue(true),
      };

      (User.findById as any).mockResolvedValue(mockUser);

      await removeArrangementFavorite(req as Request, res as Response);

      expect(mockUser.removeFavoriteArrangement).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439013",
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          userId: "507f1f77bcf86cd799439011",
          arrangementId: "507f1f77bcf86cd799439013",
          message: "Arrangement removed from favorites",
        },
      });
    });
  });

  describe("Legacy Endpoints", () => {
    it("GET /api/users/:userId/favorites should default to songs", async () => {
      const { req, res } = createMockReqRes(
        {},
        { userId: "507f1f77bcf86cd799439011" },
      );

      const mockUserWithSongs = {
        _id: "507f1f77bcf86cd799439011",
        favoriteSongs: [{ _id: "song1", title: "Test Song" }],
      };

      (User.findById as any)
        .mockReturnValueOnce({ _id: "507f1f77bcf86cd799439011" })
        .mockReturnValueOnce({
          populate: vi.fn().mockResolvedValue(mockUserWithSongs),
        });

      await getUserFavorites(req as Request, res as Response);

      expect(req.query!.type).toBe("songs");
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            songs: mockUserWithSongs.favoriteSongs,
            arrangements: undefined,
          },
        }),
      );
    });

    it("POST /api/users/:userId/favorites/:songId should add song favorite", async () => {
      const { req, res } = createMockReqRes(
        {},
        {
          userId: "507f1f77bcf86cd799439011",
          songId: "507f1f77bcf86cd799439012",
        },
      );

      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        isFavoriteSong: vi.fn().mockReturnValue(false),
        addFavoriteSong: vi.fn().mockResolvedValue(true),
      };
      const mockSong = { _id: "507f1f77bcf86cd799439012" };

      (User.findById as any).mockResolvedValue(mockUser);
      (Song.findById as any).mockResolvedValue(mockSong);

      await addFavorite(req as Request, res as Response);

      expect(mockUser.addFavoriteSong).toHaveBeenCalled();
    });

    it("DELETE /api/users/:userId/favorites/:songId should remove song favorite", async () => {
      const { req, res } = createMockReqRes(
        {},
        {
          userId: "507f1f77bcf86cd799439011",
          songId: "507f1f77bcf86cd799439012",
        },
      );

      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        isFavoriteSong: vi.fn().mockReturnValue(true),
        removeFavoriteSong: vi.fn().mockResolvedValue(true),
      };

      (User.findById as any).mockResolvedValue(mockUser);

      await removeFavorite(req as Request, res as Response);

      expect(mockUser.removeFavoriteSong).toHaveBeenCalled();
    });
  });

  describe("GET /api/users/:userId/favorites/check/:songId", () => {
    it("should check if song is favorited", async () => {
      const { req, res } = createMockReqRes(
        {},
        {
          userId: "507f1f77bcf86cd799439011",
          songId: "507f1f77bcf86cd799439012",
        },
      );

      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        isFavoriteSong: vi.fn().mockReturnValue(true),
      };

      (User.findById as any).mockResolvedValue(mockUser);

      await checkFavorite(req as Request, res as Response);

      expect(mockUser.isFavoriteSong).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439012",
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          userId: "507f1f77bcf86cd799439011",
          songId: "507f1f77bcf86cd799439012",
          isFavorite: true,
        },
      });
    });
  });
});
