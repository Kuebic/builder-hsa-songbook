import { Request, Response } from "express";
import { Song } from "../database/models";
import { z } from "zod";

// Validation schemas
const createSongSchema = z.object({
  title: z.string().min(1).max(200),
  artist: z.string().max(100).optional(),
  chordData: z.string().min(1), // ChordPro format
  key: z.enum([
    "C", "C#", "Db", "D", "D#", "Eb", "E", "F", 
    "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B"
  ]).optional(),
  tempo: z.number().min(40).max(200).optional(),
  timeSignature: z.string().optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).default("intermediate"),
  themes: z.array(z.string().max(50)).default([]),
  source: z.string().max(100),
  lyrics: z.string().max(10000).optional(),
  notes: z.string().max(2000).optional(),
  createdBy: z.string().min(1),
  isPublic: z.boolean().default(true),
});

const updateSongSchema = createSongSchema.partial();

const querySchema = z.object({
  search: z.string().optional(),
  key: z.string().optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  themes: z.string().optional(), // Comma-separated
  limit: z.string().transform(Number).pipe(z.number().min(1).max(50)).default("20"),
  offset: z.string().transform(Number).pipe(z.number().min(0)).default("0"),
  isPublic: z.string().transform(v => v === "true").default("true"),
});

// Get all songs with optional filtering
export async function getSongs(req: Request, res: Response) {
  try {
    const query = querySchema.parse(req.query);
    
    // Build MongoDB query
    const filter: any = { "metadata.isPublic": query.isPublic };
    
    if (query.search) {
      filter.$text = { $search: query.search };
    }
    
    if (query.key) {
      filter.key = query.key;
    }
    
    if (query.difficulty) {
      filter.difficulty = query.difficulty;
    }
    
    if (query.themes) {
      const themeArray = query.themes.split(",").map(t => t.trim());
      filter.themes = { $in: themeArray };
    }

    // Execute query with pagination
    const [songs, total] = await Promise.all([
      Song.find(filter)
        .sort(query.search ? { score: { $meta: "textScore" } } : { createdAt: -1 })
        .limit(query.limit)
        .skip(query.offset)
        .lean(),
      Song.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: songs,
      meta: {
        total,
        page: Math.floor(query.offset / query.limit) + 1,
        limit: query.limit,
        compressed: true,
        cacheHit: false,
      },
    });

  } catch (error) {
    console.error("Error fetching songs:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid query parameters",
          details: error.errors,
        },
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch songs",
      },
    });
  }
}

// Get single song by ID
export async function getSong(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    const song = await Song.findById(id);
    
    if (!song) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Song not found",
        },
      });
    }

    // Check if song is public or user has access
    if (!song.metadata.isPublic) {
      // TODO: Add user authorization check
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Access denied to private song",
        },
      });
    }

    // Update view count
    await song.updateViews();

    res.json({
      success: true,
      data: song,
      meta: {
        compressed: true,
        cacheHit: false,
      },
    });

  } catch (error) {
    console.error("Error fetching song:", error);
    
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch song",
      },
    });
  }
}

// Create new song
export async function createSong(req: Request, res: Response) {
  try {
    const songData = createSongSchema.parse(req.body);
    
    const song = new Song({
      ...songData,
      metadata: {
        createdBy: songData.createdBy,
        isPublic: songData.isPublic,
        ratings: {
          average: 0,
          count: 0,
        },
        views: 0,
      },
      documentSize: 0, // Will be calculated in pre-save middleware
    });

    await song.save();

    res.status(201).json({
      success: true,
      data: song,
      meta: {
        compressed: true,
      },
    });

  } catch (error) {
    console.error("Error creating song:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid song data",
          details: error.errors,
        },
      });
    }

    // Handle duplicate slug error
    if (error instanceof Error && error.message.includes("duplicate key")) {
      return res.status(409).json({
        success: false,
        error: {
          code: "DUPLICATE_SLUG",
          message: "Song with similar title already exists",
        },
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to create song",
      },
    });
  }
}

// Update song
export async function updateSong(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updateData = updateSongSchema.parse(req.body);
    
    const song = await Song.findById(id);
    
    if (!song) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Song not found",
        },
      });
    }

    // TODO: Add authorization check - only owner or admin can update
    
    // Update fields
    Object.assign(song, updateData);
    
    if (updateData.isPublic !== undefined) {
      song.metadata.isPublic = updateData.isPublic;
    }

    await song.save();

    res.json({
      success: true,
      data: song,
      meta: {
        compressed: true,
      },
    });

  } catch (error) {
    console.error("Error updating song:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid update data",
          details: error.errors,
        },
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to update song",
      },
    });
  }
}

// Delete song
export async function deleteSong(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    const song = await Song.findById(id);
    
    if (!song) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Song not found",
        },
      });
    }

    // TODO: Add authorization check - only owner or admin can delete
    
    await Song.findByIdAndDelete(id);

    res.json({
      success: true,
      data: { id },
    });

  } catch (error) {
    console.error("Error deleting song:", error);
    
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to delete song",
      },
    });
  }
}

// Rate a song
export async function rateSong(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { rating } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_RATING",
          message: "Rating must be between 1 and 5",
        },
      });
    }

    const song = await Song.findById(id);
    
    if (!song) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Song not found",
        },
      });
    }

    // TODO: Check if user already rated this song
    
    await song.addRating(rating);

    res.json({
      success: true,
      data: {
        averageRating: song.metadata.ratings.average,
        totalRatings: song.metadata.ratings.count,
      },
    });

  } catch (error) {
    console.error("Error rating song:", error);
    
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to rate song",
      },
    });
  }
}

// Search songs (dedicated endpoint for better search features)
export async function searchSongs(req: Request, res: Response) {
  try {
    const { q: query, limit = 20 } = req.query;
    
    if (!query || typeof query !== "string") {
      return res.status(400).json({
        success: false,
        error: {
          code: "MISSING_QUERY",
          message: "Search query is required",
        },
      });
    }

    const searchLimit = Math.min(Number(limit), 50);
    
    const songs = await Song.searchSongs(query, searchLimit);

    res.json({
      success: true,
      data: songs,
      meta: {
        query,
        total: songs.length,
        limit: searchLimit,
        compressed: true,
      },
    });

  } catch (error) {
    console.error("Error searching songs:", error);
    
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Search failed",
      },
    });
  }
}

// Get songs statistics for dashboard
export async function getSongsStats(req: Request, res: Response) {
  try {
    const [totalSongs, recentSongs] = await Promise.all([
      Song.countDocuments({ "metadata.isPublic": true }),
      Song.countDocuments({
        "metadata.isPublic": true,
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
      })
    ]);

    res.json({
      success: true,
      data: {
        totalSongs,
        totalSetlists: 0, // TODO: Implement when setlists are connected
        recentlyAdded: recentSongs,
        topContributors: 0, // TODO: Implement user counting
      },
    });

  } catch (error) {
    console.error("Error fetching songs stats:", error);

    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch statistics",
      },
    });
  }
}
