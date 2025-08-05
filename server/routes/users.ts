import { Request, Response } from "express";
import { User, Song, Arrangement } from "../database/models";
import { z } from "zod";

// Validation schemas
const userParamsSchema = z.object({
  userId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID format"),
});

const songParamsSchema = z.object({
  songId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid song ID format"),
});

const arrangementParamsSchema = z.object({
  arrangementId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid arrangement ID format"),
});

const favoritesQuerySchema = z.object({
  type: z.enum(["songs", "arrangements", "both"]).optional().default("both"),
});

// GET /api/users/:userId/favorites - Get user's favorites (songs, arrangements, or both)
export const getFavorites = async (req: Request, res: Response) => {
  try {
    const { userId } = userParamsSchema.parse(req.params);
    const { type } = favoritesQuerySchema.parse(req.query);

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

    let songs: any[] = [];
    let arrangements: any[] = [];

    // Fetch song favorites
    if (type === "songs" || type === "both") {
      const populatedUser = await User.findById(userId).populate({
        path: "favoriteSongs",
        model: "Song",
        select: "_id title artist slug themes compositionYear ccli metadata.ratings.average metadata.views createdAt updatedAt",
      });
      
      if (populatedUser) {
        songs = populatedUser.favoriteSongs;
      }
    }

    // Fetch arrangement favorites
    if (type === "arrangements" || type === "both") {
      const populatedUser = await User.findById(userId).populate({
        path: "favoriteArrangements",
        model: "Arrangement",
        populate: {
          path: "songIds",
          select: "title artist",
        },
        select: "_id name key difficulty tags metadata.ratings.average metadata.views metadata.isMashup createdAt updatedAt",
      });
      
      if (populatedUser) {
        arrangements = populatedUser.favoriteArrangements;
      }
    }

    return res.json({
      success: true,
      data: {
        songs: type === "arrangements" ? undefined : songs,
        arrangements: type === "songs" ? undefined : arrangements,
      },
      meta: {
        userId: userId,
        type: type,
        totalSongs: songs.length,
        totalArrangements: arrangements.length,
      },
    });
  } catch (error) {
    console.error("Error fetching user favorites:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request parameters",
          details: error.errors,
        },
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch favorites",
      },
    });
  }
};

// POST /api/users/:userId/favorites/songs/:songId - Add song to favorites
export const addSongFavorite = async (req: Request, res: Response) => {
  try {
    const { userId } = userParamsSchema.parse(req.params);
    const { songId } = songParamsSchema.parse(req.params);

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

    // Check if song exists
    const song = await Song.findById(songId);
    if (!song) {
      return res.status(404).json({
        success: false,
        error: {
          code: "SONG_NOT_FOUND",
          message: "Song not found",
        },
      });
    }

    // Check if already favorited
    if (user.isFavoriteSong(songId)) {
      return res.status(409).json({
        success: false,
        error: {
          code: "ALREADY_FAVORITED",
          message: "Song is already in favorites",
        },
      });
    }

    // Add to favorites
    await user.addFavoriteSong(songId);

    return res.status(201).json({
      success: true,
      data: {
        userId: userId,
        songId: songId,
        message: "Song added to favorites",
      },
    });
  } catch (error) {
    console.error("Error adding song favorite:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request parameters",
          details: error.errors,
        },
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to add song to favorites",
      },
    });
  }
};

// DELETE /api/users/:userId/favorites/songs/:songId - Remove song from favorites
export const removeSongFavorite = async (req: Request, res: Response) => {
  try {
    const { userId } = userParamsSchema.parse(req.params);
    const { songId } = songParamsSchema.parse(req.params);

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

    // Check if song is in favorites
    if (!user.isFavoriteSong(songId)) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FAVORITED",
          message: "Song is not in favorites",
        },
      });
    }

    // Remove from favorites
    await user.removeFavoriteSong(songId);

    return res.json({
      success: true,
      data: {
        userId: userId,
        songId: songId,
        message: "Song removed from favorites",
      },
    });
  } catch (error) {
    console.error("Error removing song favorite:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request parameters",
          details: error.errors,
        },
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to remove song from favorites",
      },
    });
  }
};

// POST /api/users/:userId/favorites/arrangements/:arrangementId - Add arrangement to favorites
export const addArrangementFavorite = async (req: Request, res: Response) => {
  try {
    const { userId } = userParamsSchema.parse(req.params);
    const { arrangementId } = arrangementParamsSchema.parse(req.params);

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

    // Check if already favorited
    if (user.isFavoriteArrangement(arrangementId)) {
      return res.status(409).json({
        success: false,
        error: {
          code: "ALREADY_FAVORITED",
          message: "Arrangement is already in favorites",
        },
      });
    }

    // Add to favorites
    await user.addFavoriteArrangement(arrangementId);

    return res.status(201).json({
      success: true,
      data: {
        userId: userId,
        arrangementId: arrangementId,
        message: "Arrangement added to favorites",
      },
    });
  } catch (error) {
    console.error("Error adding arrangement favorite:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request parameters",
          details: error.errors,
        },
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to add arrangement to favorites",
      },
    });
  }
};

// DELETE /api/users/:userId/favorites/arrangements/:arrangementId - Remove arrangement from favorites
export const removeArrangementFavorite = async (req: Request, res: Response) => {
  try {
    const { userId } = userParamsSchema.parse(req.params);
    const { arrangementId } = arrangementParamsSchema.parse(req.params);

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

    // Check if arrangement is in favorites
    if (!user.isFavoriteArrangement(arrangementId)) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FAVORITED",
          message: "Arrangement is not in favorites",
        },
      });
    }

    // Remove from favorites
    await user.removeFavoriteArrangement(arrangementId);

    return res.json({
      success: true,
      data: {
        userId: userId,
        arrangementId: arrangementId,
        message: "Arrangement removed from favorites",
      },
    });
  } catch (error) {
    console.error("Error removing arrangement favorite:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request parameters",
          details: error.errors,
        },
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to remove arrangement from favorites",
      },
    });
  }
};

// Legacy endpoints for backward compatibility

// GET /api/users/:userId/favorites - Legacy endpoint (redirects to new endpoint)
export const getUserFavorites = async (req: Request, res: Response) => {
  req.query.type = "songs"; // Default to songs for backward compatibility
  return getFavorites(req, res);
};

// POST /api/users/:userId/favorites/:songId - Legacy endpoint
export const addFavorite = async (req: Request, res: Response) => {
  return addSongFavorite(req, res);
};

// DELETE /api/users/:userId/favorites/:songId - Legacy endpoint
export const removeFavorite = async (req: Request, res: Response) => {
  return removeSongFavorite(req, res);
};

// GET /api/users/:userId/favorites/check/:songId - Check if song is favorited
export const checkFavorite = async (req: Request, res: Response) => {
  try {
    const { userId } = userParamsSchema.parse(req.params);
    const { songId } = songParamsSchema.parse(req.params);

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

    const isFavorite = user.isFavoriteSong(songId);

    return res.json({
      success: true,
      data: {
        userId: userId,
        songId: songId,
        isFavorite: isFavorite,
      },
    });
  } catch (error) {
    console.error("Error checking favorite status:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request parameters",
          details: error.errors,
        },
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to check favorite status",
      },
    });
  }
};