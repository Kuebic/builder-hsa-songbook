import { Request, Response } from "express";
import { Setlist } from "../database/models";
import { z } from "zod";
import { Types } from "mongoose";

// Validation schemas
const setlistItemSchema = z.object({
  songId: z.string().min(1).transform(id => new Types.ObjectId(id)),
  arrangementId: z.string().optional().transform(id => id ? new Types.ObjectId(id) : undefined),
  transpose: z.number().min(-11).max(11).default(0),
  notes: z.string().max(500).optional(),
  order: z.number().min(0),
});

const createSetlistSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  createdBy: z.string().min(1),
  songs: z.array(setlistItemSchema).default([]),
  tags: z.array(z.string().max(50)).default([]),
  isPublic: z.boolean().default(false),
});

const updateSetlistSchema = createSetlistSchema.partial();

const querySchema = z.object({
  search: z.string().optional(),
  createdBy: z.string().optional(),
  tags: z.string().optional(), // Comma-separated
  isPublic: z.string().transform(v => v === "true").optional(),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(50)).default("20"),
  offset: z.string().transform(Number).pipe(z.number().min(0)).default("0"),
});

// Get all setlists with optional filtering
export async function getSetlists(req: Request, res: Response) {
  try {
    const query = querySchema.parse(req.query);
    
    // Build MongoDB query
    const filter: any = {};
    
    if (query.isPublic !== undefined) {
      filter["metadata.isPublic"] = query.isPublic;
    }
    
    if (query.createdBy) {
      filter.createdBy = query.createdBy;
    }
    
    if (query.search) {
      filter.$text = { $search: query.search };
    }
    
    if (query.tags) {
      const tagArray = query.tags.split(",").map(t => t.trim());
      filter.tags = { $in: tagArray };
    }

    // Execute query with pagination and population
    const [setlists, total] = await Promise.all([
      Setlist.find(filter)
        .populate({
          path: "songs.arrangementId",
          populate: {
            path: "songIds",
            select: "title artist key tempo difficulty",
          },
        })
        .sort(query.search ? { score: { $meta: "textScore" } } : { createdAt: -1 })
        .limit(query.limit)
        .skip(query.offset)
        .lean(),
      Setlist.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: setlists,
      meta: {
        total,
        page: Math.floor(query.offset / query.limit) + 1,
        limit: query.limit,
      },
    });

  } catch (error) {
    console.error("Error fetching setlists:", error);
    
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
        message: "Failed to fetch setlists",
      },
    });
  }
}

// Get single setlist by ID
export async function getSetlist(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    const setlist = await Setlist.findById(id)
      .populate({
        path: "songs.arrangementId",
        populate: {
          path: "songIds",
          select: "title artist key tempo difficulty chordData",
        },
      });
    
    if (!setlist) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Setlist not found",
        },
      });
    }

    // Check if setlist is public or user has access
    if (!setlist.metadata.isPublic) {
      // TODO: Add user authorization check
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Access denied to private setlist",
        },
      });
    }

    res.json({
      success: true,
      data: setlist,
    });

  } catch (error) {
    console.error("Error fetching setlist:", error);
    
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch setlist",
      },
    });
  }
}

// Get setlist by share token
export async function getSetlistByToken(req: Request, res: Response) {
  try {
    const { token } = req.params;
    
    const setlist = await Setlist.findByShareToken(token);
    
    if (!setlist) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Setlist not found or share token invalid",
        },
      });
    }

    res.json({
      success: true,
      data: setlist,
    });

  } catch (error) {
    console.error("Error fetching setlist by token:", error);
    
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch setlist",
      },
    });
  }
}

// Create new setlist
export async function createSetlist(req: Request, res: Response) {
  try {
    const setlistData = createSetlistSchema.parse(req.body);
    
    const setlist = new Setlist({
      name: setlistData.name,
      description: setlistData.description,
      createdBy: setlistData.createdBy,
      songs: setlistData.songs,
      tags: setlistData.tags,
      metadata: {
        isPublic: setlistData.isPublic,
      },
    });

    await setlist.save();

    // Populate the saved setlist for response
    await setlist.populate({
      path: "songs.arrangementId",
      populate: {
        path: "songIds",
        select: "title artist",
      },
    });

    res.status(201).json({
      success: true,
      data: setlist,
    });

  } catch (error) {
    console.error("Error creating setlist:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid setlist data",
          details: error.errors,
        },
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to create setlist",
      },
    });
  }
}

// Update setlist
export async function updateSetlist(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updateData = updateSetlistSchema.parse(req.body);
    
    const setlist = await Setlist.findById(id);
    
    if (!setlist) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Setlist not found",
        },
      });
    }

    // TODO: Add authorization check - only owner can update
    
    // Update basic fields
    if (updateData.name) {setlist.name = updateData.name;}
    if (updateData.description !== undefined) {setlist.description = updateData.description;}
    if (updateData.tags) {setlist.tags = updateData.tags;}
    if (updateData.songs) {
      setlist.songs = updateData.songs.map(song => ({
        songId: song.songId!,
        arrangementId: song.arrangementId,
        transpose: song.transpose ?? 0,
        notes: song.notes,
        order: song.order!,
      }));
    }
    
    // Update metadata (removed date and venue as they're not in the schema)
    if (updateData.isPublic !== undefined) {setlist.metadata.isPublic = updateData.isPublic;}

    await setlist.save();

    // Populate for response
    await setlist.populate({
      path: "songs.arrangementId",
      populate: {
        path: "songIds",
        select: "title artist",
      },
    });

    res.json({
      success: true,
      data: setlist,
    });

  } catch (error) {
    console.error("Error updating setlist:", error);
    
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
        message: "Failed to update setlist",
      },
    });
  }
}

// Delete setlist
export async function deleteSetlist(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    const setlist = await Setlist.findById(id);
    
    if (!setlist) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Setlist not found",
        },
      });
    }

    // TODO: Add authorization check - only owner can delete
    
    await Setlist.findByIdAndDelete(id);

    res.json({
      success: true,
      data: { id },
    });

  } catch (error) {
    console.error("Error deleting setlist:", error);
    
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to delete setlist",
      },
    });
  }
}

// Add song to setlist
export async function addSongToSetlist(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { arrangementId, transposeBy = 0, notes } = req.body;
    
    if (!arrangementId) {
      return res.status(400).json({
        success: false,
        error: {
          code: "MISSING_ARRANGEMENT",
          message: "Arrangement ID is required",
        },
      });
    }

    const setlist = await Setlist.findById(id);
    
    if (!setlist) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Setlist not found",
        },
      });
    }

    // TODO: Add authorization check
    
    await setlist.addSong(arrangementId, transposeBy, notes);

    res.json({
      success: true,
      data: setlist,
    });

  } catch (error) {
    console.error("Error adding song to setlist:", error);
    
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to add song to setlist",
      },
    });
  }
}

// Remove song from setlist
export async function removeSongFromSetlist(req: Request, res: Response) {
  try {
    const { id, arrangementId } = req.params;
    
    const setlist = await Setlist.findById(id);
    
    if (!setlist) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Setlist not found",
        },
      });
    }

    // TODO: Add authorization check
    
    await setlist.removeSong(arrangementId);

    res.json({
      success: true,
      data: setlist,
    });

  } catch (error) {
    console.error("Error removing song from setlist:", error);
    
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to remove song from setlist",
      },
    });
  }
}

// Reorder songs in setlist
export async function reorderSetlistSongs(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { songOrder } = req.body;
    
    if (!Array.isArray(songOrder)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_ORDER",
          message: "Song order must be an array of arrangement IDs",
        },
      });
    }

    const setlist = await Setlist.findById(id);
    
    if (!setlist) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Setlist not found",
        },
      });
    }

    // TODO: Add authorization check
    
    await setlist.reorderSongs(songOrder);

    res.json({
      success: true,
      data: setlist,
    });

  } catch (error) {
    console.error("Error reordering setlist songs:", error);
    
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to reorder songs",
      },
    });
  }
}