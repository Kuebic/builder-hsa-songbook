import { Request, Response } from "express";
import { Song } from "../database/models";
import { z } from "zod";

// Helper function to extract basic chords from ChordPro data
function extractBasicChords(chordData: string): string[] {
  if (!chordData) {
    return [];
  }
  
  const chordRegex = /\[([A-G][#b]?[^/\]]*)\]/g;
  const matches = chordData.match(chordRegex);
  
  if (!matches) {
    return [];
  }
  
  const chords = matches
    .map(match => match.slice(1, -1)) // Remove brackets
    .filter((chord, index, array) => array.indexOf(chord) === index) // Remove duplicates
    .slice(0, 5); // Take first 5 unique chords
    
  return chords;
}

// Helper function to transform MongoDB song to client format
function transformSongToClientFormat(song: any) {
  try {
    // Extract arrangement data if available
    const arrangement = song.defaultArrangement || song.arrangements?.[0];
    
    // Extract basic chords from arrangement if available
    let basicChords: string[] = [];
    if (arrangement?.chordData) {
      basicChords = extractBasicChords(arrangement.chordData);
    }
  
  return {
    id: song._id.toString(),
    title: song.title,
    artist: song.artist || "",
    slug: song.slug,
    compositionYear: song.compositionYear,
    ccli: song.ccli,
    themes: song.themes || [],
    source: song.source,
    lyrics: song.lyrics,
    notes: song.notes,
    viewCount: song.metadata?.views || 0,
    avgRating: song.metadata?.ratings?.average || 0,
    ratingCount: song.metadata?.ratings?.count || 0,
    defaultArrangementId: song.defaultArrangement?.toString() || arrangement?._id?.toString(),
    createdBy: song.metadata?.createdBy?.toString(),
    lastModifiedBy: song.metadata?.lastModifiedBy?.toString(),
    isPublic: song.metadata?.isPublic ?? true,
    createdAt: song.createdAt,
    updatedAt: song.updatedAt,
    // Add missing ClientSong fields
    key: arrangement?.key,
    tempo: arrangement?.tempo,
    difficulty: arrangement?.difficulty || "intermediate",
    basicChords,
    lastUsed: undefined, // Client-side only field
    isFavorite: false, // Client-side only field
  };
  } catch (error) {
    console.error("Error in transformSongToClientFormat:", error);
    console.error("Song data:", JSON.stringify(song, null, 2));
    throw error;
  }
}

// Validation schemas
const createSongSchema = z.object({
  title: z.string().min(1).max(200),
  artist: z.string().max(100).optional(),
  compositionYear: z.number().min(1000).max(new Date().getFullYear() + 1).optional(),
  ccli: z.string().regex(/^\d+$/, "CCLI must be numeric").optional(),
  themes: z.array(z.string().max(50)).default([]),
  source: z.string().max(100).optional(),
  lyrics: z.string().max(10000).optional(),
  notes: z.string().max(2000).optional(),
  createdBy: z.string().min(1),
  isPublic: z.boolean().default(true),
});

const updateSongSchema = createSongSchema.partial();

const querySchema = z.object({
  search: z.string().optional(),
  theme: z.string().optional(),
  compositionYear: z.string().transform(Number).pipe(z.number()).optional(),
  limit: z
    .string()
    .transform(Number)
    .pipe(z.number().min(1).max(50))
    .default("20"),
  offset: z.string().transform(Number).pipe(z.number().min(0)).default("0"),
  isPublic: z
    .string()
    .transform((v) => v === "true")
    .default("true"),
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

    if (query.theme) {
      filter.themes = query.theme;
    }

    if (query.compositionYear) {
      filter.compositionYear = query.compositionYear;
    }

    // Execute query with pagination
    const [songs, total] = await Promise.all([
      Song.find(filter)
        .populate({
          path: "defaultArrangement",
          select: "key tempo difficulty chordData",
        })
        .sort(
          query.search ? { score: { $meta: "textScore" } } : { createdAt: -1 },
        )
        .limit(query.limit)
        .skip(query.offset)
        .lean(),
      Song.countDocuments(filter),
    ]);

    // Transform songs to client format
    const transformedSongs = songs.map(transformSongToClientFormat);

    res.json({
      success: true,
      data: transformedSongs,
      meta: {
        total,
        page: Math.floor(query.offset / query.limit) + 1,
        limit: query.limit,
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

    const song = await Song.findById(id)
      .populate({
        path: "defaultArrangement",
        select: "key tempo difficulty chordData",
      });

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

    // Transform song to client format
    const transformedSong = transformSongToClientFormat(song);

    res.json({
      success: true,
      data: transformedSong,
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

// Get single song by slug
export async function getSongBySlug(req: Request, res: Response) {
  try {
    // Check database connection first
    const { database } = await import("../database/connection");
    if (!database.isConnectedToDatabase()) {
      return res.status(503).json({
        success: false,
        error: {
          code: "DATABASE_UNAVAILABLE",
          message: "Database connection is not available",
          details: "The server is currently unable to connect to the database. Please try again later."
        },
      });
    }

    const { slug } = req.params;

    // Validate slug parameter
    const slugSchema = z.string().min(1);
    const validatedSlug = slugSchema.parse(slug);

    // Query song by slug
    const song = await Song.findOne({ slug: validatedSlug })
      .populate({
        path: "defaultArrangement",
        select: "key tempo difficulty chordData",
      })
      .lean();

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
    await Song.findByIdAndUpdate(song._id, { $inc: { "metadata.views": 1 } });

    // Transform song to client format
    const transformedSong = transformSongToClientFormat(song);

    res.json({
      success: true,
      data: transformedSong,
    });
  } catch (error) {
    console.error("Error fetching song by slug:", error);
    console.error("Stack trace:", error instanceof Error ? error.stack : "No stack trace available");
    
    // Provide more specific error messages
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
    
    // Check for MongoDB connection errors
    if (error instanceof Error) {
      if (error.message.includes("buffering timed out") || 
          error.message.includes("ECONNREFUSED") ||
          error.message.includes("connect ETIMEDOUT")) {
        return res.status(503).json({
          success: false,
          error: {
            code: "DATABASE_ERROR",
            message: "Database connection error",
            details: "Unable to connect to the database. Please check server logs.",
          },
        });
      }
    }

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
      title: songData.title,
      artist: songData.artist,
      compositionYear: songData.compositionYear,
      ccli: songData.ccli,
      themes: songData.themes,
      source: songData.source,
      lyrics: songData.lyrics,
      notes: songData.notes,
      metadata: {
        createdBy: songData.createdBy,
        lastModifiedBy: songData.createdBy,
        isPublic: songData.isPublic,
        ratings: {
          average: 0,
          count: 0,
        },
        views: 0,
      },
      documentSize: 0, // Will be calculated in post-save middleware
    });

    await song.save();

    // Transform to client format
    const transformedSong = transformSongToClientFormat(song);

    res.status(201).json({
      success: true,
      data: transformedSong,
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
    if (updateData.title !== undefined) {song.title = updateData.title;}
    if (updateData.artist !== undefined) {song.artist = updateData.artist;}
    if (updateData.compositionYear !== undefined) {song.compositionYear = updateData.compositionYear;}
    if (updateData.ccli !== undefined) {song.ccli = updateData.ccli;}
    if (updateData.themes !== undefined) {song.themes = updateData.themes;}
    if (updateData.source !== undefined) {song.source = updateData.source;}
    if (updateData.lyrics !== undefined) {song.lyrics = updateData.lyrics;}
    if (updateData.notes !== undefined) {song.notes = updateData.notes;}

    if (updateData.isPublic !== undefined) {
      song.metadata.isPublic = updateData.isPublic;
    }

    // Update lastModifiedBy
    if (updateData.createdBy) {
      song.metadata.lastModifiedBy = updateData.createdBy as any;
    }

    await song.save();

    // Transform to client format
    const transformedSong = transformSongToClientFormat(song);

    res.json({
      success: true,
      data: transformedSong,
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
    // TODO: Check if song has arrangements before deleting

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

    // Transform songs to client format
    const transformedSongs = songs.map(transformSongToClientFormat);

    res.json({
      success: true,
      data: transformedSongs,
      meta: {
        query,
        total: transformedSongs.length,
        limit: searchLimit,
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
export async function getSongsStats(_req: Request, res: Response) {
  try {
    const [totalSongs, recentSongs] = await Promise.all([
      Song.countDocuments({ "metadata.isPublic": true }),
      Song.countDocuments({
        "metadata.isPublic": true,
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
      }),
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

// Get song by CCLI number
export async function getSongByCCLI(req: Request, res: Response) {
  try {
    const { ccli } = req.params;

    const song = await Song.findByCCLI(ccli);

    if (!song) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Song not found",
        },
      });
    }

    // Transform song to client format
    const transformedSong = transformSongToClientFormat(song);

    res.json({
      success: true,
      data: transformedSong,
    });
  } catch (error) {
    console.error("Error fetching song by CCLI:", error);

    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch song",
      },
    });
  }
}