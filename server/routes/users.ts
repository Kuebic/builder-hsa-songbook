import { Request, Response } from "express";
import { User, Song } from "../database/models";
import { z } from "zod";

// Validation schemas
const userParamsSchema = z.object({
  userId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID format"),
});

const songParamsSchema = z.object({
  songId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid song ID format"),
});

const combinedParamsSchema = userParamsSchema.merge(songParamsSchema);

// GET /api/users/:userId/favorites - Get user's favorite songs
export const getUserFavorites = async (req: Request, res: Response) => {
  try {
    const { userId } = userParamsSchema.parse(req.params);

    const user = await User.findById(userId).populate({
      path: 'favorites',
      model: 'Song',
      select: '_id title artist key difficulty themes metadata.ratings.average metadata.views createdAt updatedAt'
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    return res.json({
      success: true,
      data: user.favorites,
      meta: {
        total: user.favorites.length,
        userId: userId
      }
    });
  } catch (error) {
    console.error("Error fetching user favorites:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Invalid request parameters",
        details: error.errors
      });
    }

    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

// POST /api/users/:userId/favorites/:songId - Add song to favorites
export const addFavorite = async (req: Request, res: Response) => {
  try {
    const { userId, songId } = combinedParamsSchema.parse(req.params);

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    // Check if song exists
    const song = await Song.findById(songId);
    if (!song) {
      return res.status(404).json({
        success: false,
        error: "Song not found"
      });
    }

    // Check if already favorited
    if (user.isFavoriteSong(songId)) {
      return res.status(409).json({
        success: false,
        error: "Song is already in favorites"
      });
    }

    // Add to favorites
    await user.addFavorite(songId);

    return res.status(201).json({
      success: true,
      data: {
        userId: userId,
        songId: songId,
        message: "Song added to favorites"
      }
    });
  } catch (error) {
    console.error("Error adding favorite:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Invalid request parameters",
        details: error.errors
      });
    }

    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

// DELETE /api/users/:userId/favorites/:songId - Remove song from favorites
export const removeFavorite = async (req: Request, res: Response) => {
  try {
    const { userId, songId } = combinedParamsSchema.parse(req.params);

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    // Check if song is in favorites
    if (!user.isFavoriteSong(songId)) {
      return res.status(404).json({
        success: false,
        error: "Song is not in favorites"
      });
    }

    // Remove from favorites
    await user.removeFavorite(songId);

    return res.json({
      success: true,
      data: {
        userId: userId,
        songId: songId,
        message: "Song removed from favorites"
      }
    });
  } catch (error) {
    console.error("Error removing favorite:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Invalid request parameters",
        details: error.errors
      });
    }

    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

// GET /api/users/:userId/favorites/check/:songId - Check if song is favorited
export const checkFavorite = async (req: Request, res: Response) => {
  try {
    const { userId, songId } = combinedParamsSchema.parse(req.params);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    const isFavorite = user.isFavoriteSong(songId);

    return res.json({
      success: true,
      data: {
        userId: userId,
        songId: songId,
        isFavorite: isFavorite
      }
    });
  } catch (error) {
    console.error("Error checking favorite status:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Invalid request parameters",
        details: error.errors
      });
    }

    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};