import { Request, Response } from "express";
import { Arrangement, Song } from "../database/models";
import { z } from "zod";
import { Types } from "mongoose";

// Validation schemas
const createArrangementSchema = z.object({
  name: z.string().min(1).max(200),
  songIds: z.array(z.string()).min(1), // Array of song ObjectIds
  chordData: z.string().min(1), // ChordPro format
  key: z.enum([
    "C",
    "C#",
    "Db",
    "D",
    "D#",
    "Eb",
    "E",
    "F",
    "F#",
    "Gb",
    "G",
    "G#",
    "Ab",
    "A",
    "A#",
    "Bb",
    "B",
  ]),
  tempo: z.number().min(40).max(200).optional(),
  timeSignature: z.string().default("4/4"),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).default("intermediate"),
  description: z.string().max(1000).optional(),
  tags: z.array(z.string().max(50)).default([]),
  createdBy: z.string(), // User ID
  isPublic: z.boolean().default(true),
  mashupSections: z
    .array(
      z.object({
        songId: z.string(),
        title: z.string().max(200),
        startBar: z.number().min(1).optional(),
        endBar: z.number().min(1).optional(),
      }),
    )
    .optional(),
});

const updateArrangementSchema = createArrangementSchema.partial();

/**
 * Validates if chord data is readable and not corrupted
 */
function isValidChordData(chordData: string): boolean {
  if (!chordData) {return true;} // Empty is valid
  
  // Check for base64-like patterns (corrupted data)
  const base64Pattern = /^[A-Za-z0-9+/]{20,}={0,2}$/;
  if (base64Pattern.test(chordData.replace(/\s/g, ""))) {
    return false;
  }
  
  // Check for excessive non-printable characters
  // eslint-disable-next-line no-control-regex
  const nonPrintableCount = (chordData.match(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\xFF]/g) || []).length;
  if (nonPrintableCount > chordData.length * 0.1) {
    return false;
  }
  
  // Check for binary/compressed data patterns
  if (chordData.startsWith("�") || chordData.includes("\x00")) {
    return false;
  }
  
  return true;
}

// Transform arrangement to client format
function transformArrangementToClientFormat(arrangement: any): any {
  if (!arrangement) {
    console.error("Received null arrangement");
    return null;
  }
  
  const doc = arrangement.toObject ? arrangement.toObject() : arrangement;
  
  if (!doc._id) {
    console.error("Arrangement missing _id", doc);
    return null;
  }
  
  return {
    _id: doc._id.toString(),
    name: doc.name || "Untitled Arrangement",
    songIds: (doc.songIds || []).map((id: any) => {
      if (!id) {return null;}
      return typeof id === "object" && id._id ? id._id.toString() : id.toString();
    }).filter(Boolean),
    createdBy: doc.createdBy ? (typeof doc.createdBy === "object" && doc.createdBy._id ? doc.createdBy._id.toString() : doc.createdBy.toString()) : null,
    chordData: (() => {
      const chordData = doc.chordData || "";
      if (!isValidChordData(chordData)) {
        console.warn(`Corrupted chord data detected for arrangement ${doc._id}, returning empty string`);
        return "";
      }
      return chordData;
    })(), // Sanitize corrupted data with logging
    key: doc.key || "C",
    tempo: doc.tempo,
    timeSignature: doc.timeSignature || "4/4",
    difficulty: doc.difficulty || "intermediate",
    description: doc.description,
    tags: doc.tags || [],
    metadata: doc.metadata || {
      isPublic: true,
      ratings: { average: 0, count: 0 },
      views: 0,
      isMashup: false,
    },
    documentSize: doc.documentSize || 0,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    // Add populated data if available
    songs: (doc.songIds || []).map((song: any) => {
      if (typeof song === "object" && song && song.title) {
        return {
          _id: song._id ? song._id.toString() : null,
          title: song.title,
          artist: song.artist,
        };
      }
      return null;
    }).filter(Boolean),
    createdByUser: doc.createdBy && typeof doc.createdBy === "object" && doc.createdBy.name ? {
      displayName: doc.createdBy.name || "Unknown User",
    } : null,
  };
}

// Get arrangements for a specific song
export async function getArrangementsBySong(req: Request, res: Response) {
  try {
    const { songId } = req.params;

    // Validate songId is a valid ObjectId
    if (!Types.ObjectId.isValid(songId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_ID",
          message: "Invalid song ID format",
        },
      });
    }

    // Check if song exists
    const songExists = await Song.exists({ _id: songId });
    if (!songExists) {
      return res.status(404).json({
        success: false,
        error: {
          code: "SONG_NOT_FOUND",
          message: "Song not found",
        },
      });
    }

    // Find all arrangements that include this song
    console.log(`🔍 Searching for arrangements for song ID: ${songId}`);
    const arrangements = await Arrangement.find({
      songIds: songId,
      "metadata.isPublic": true,
    })
      .populate("songIds", "title artist")
      .populate("createdBy", "name email")
      .sort({ "metadata.ratings.average": -1, "metadata.views": -1 })
      .lean();
    
    console.log(`📊 Found ${arrangements.length} arrangements for song ${songId}`);

    const transformedArrangements = arrangements
      .map((arrangement, index) => {
        try {
          return transformArrangementToClientFormat(arrangement);
        } catch (error) {
          console.error(`❌ Error transforming arrangement ${index}:`, error);
          console.error("Arrangement data:", JSON.stringify(arrangement, null, 2));
          return null;
        }
      })
      .filter(Boolean); // Filter out any null results
    
    console.log(`✅ Successfully transformed ${transformedArrangements.length} arrangements`);
    
    res.json({
      success: true,
      data: transformedArrangements,
      meta: {
        total: transformedArrangements.length,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching arrangements for song:", req.params.songId, error);
    
    // Log additional context for debugging
    if (error instanceof Error) {
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }
    
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch arrangements",
        ...(process.env.NODE_ENV === "development" && { 
          details: error instanceof Error ? error.message : String(error), 
        }),
      },
    });
  }
}

// Create new arrangement
export async function createArrangement(req: Request, res: Response) {
  try {
    console.log("📝 Creating arrangement with data:", JSON.stringify(req.body, null, 2));
    const arrangementData = createArrangementSchema.parse(req.body);
    console.log("✅ Validated arrangement data:", arrangementData);

    // Validate all songIds exist
    console.log("🔍 Validating song IDs:", arrangementData.songIds);
    const songIds = arrangementData.songIds.map((id) => new Types.ObjectId(id));
    const songsCount = await Song.countDocuments({
      _id: { $in: songIds },
    });
    console.log(`📊 Found ${songsCount} songs out of ${songIds.length} requested`);

    if (songsCount !== songIds.length) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_SONGS",
          message: "One or more songs not found",
        },
      });
    }

    // Create arrangement
    console.log("🔍 Creating arrangement with user ID:", arrangementData.createdBy);
    let createdByObjectId;
    try {
      createdByObjectId = new Types.ObjectId(arrangementData.createdBy);
      console.log("✅ Successfully created ObjectId from user ID");
    } catch (error) {
      console.error("❌ Failed to create ObjectId from user ID:", arrangementData.createdBy, error);
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_USER_ID",
          message: "Invalid user ID format",
        },
      });
    }
    
    const arrangement = new Arrangement({
      name: arrangementData.name,
      songIds: songIds,
      createdBy: createdByObjectId,
      chordData: arrangementData.chordData,
      key: arrangementData.key,
      tempo: arrangementData.tempo,
      timeSignature: arrangementData.timeSignature,
      difficulty: arrangementData.difficulty,
      description: arrangementData.description,
      tags: arrangementData.tags,
      metadata: {
        isMashup: songIds.length > 1,
        mashupSections: arrangementData.mashupSections,
        isPublic: arrangementData.isPublic !== undefined ? arrangementData.isPublic : true,
        ratings: {
          average: 0,
          count: 0,
        },
        views: 0,
      },
    });

    console.log("💾 Saving arrangement to database...");
    await arrangement.save();
    console.log("✅ Arrangement saved successfully with ID:", arrangement._id);

    // Reload the arrangement with populated fields
    console.log("🔄 Reloading arrangement with populated fields...");
    const savedArrangement = await Arrangement.findById(arrangement._id)
      .populate("songIds", "title artist")
      .populate("createdBy", "name email");

    res.status(201).json({
      success: true,
      data: transformArrangementToClientFormat(savedArrangement),
    });
  } catch (error) {
    console.error("Error creating arrangement:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid arrangement data",
          details: error.errors,
        },
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to create arrangement",
      },
    });
  }
}

// Update arrangement
export async function updateArrangement(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updateData = updateArrangementSchema.parse(req.body);

    const arrangement = await Arrangement.findById(id);

    if (!arrangement) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Arrangement not found",
        },
      });
    }

    // TODO: Add authorization check - only owner or admin can update

    // Update fields
    if (updateData.name !== undefined) {arrangement.name = updateData.name;}
    if (updateData.chordData !== undefined) {
      arrangement.chordData = updateData.chordData;
    }
    if (updateData.key !== undefined) {arrangement.key = updateData.key;}
    if (updateData.tempo !== undefined) {arrangement.tempo = updateData.tempo;}
    if (updateData.timeSignature !== undefined) {arrangement.timeSignature = updateData.timeSignature;}
    if (updateData.difficulty !== undefined) {arrangement.difficulty = updateData.difficulty;}
    if (updateData.description !== undefined) {arrangement.description = updateData.description;}
    if (updateData.tags !== undefined) {arrangement.tags = updateData.tags;}
    if (updateData.isPublic !== undefined) {
      (arrangement as any).isPublic = updateData.isPublic;
      arrangement.metadata.isPublic = updateData.isPublic;
    }

    // Handle mashup sections update
    if (updateData.mashupSections !== undefined) {
      arrangement.metadata.mashupSections = updateData.mashupSections.map((section) => ({
        songId: new Types.ObjectId(section.songId),
        title: section.title,
        startBar: section.startBar,
        endBar: section.endBar,
      }));
    }

    // Update songIds if provided
    if (updateData.songIds !== undefined) {
      const songIds = updateData.songIds.map((id) => new Types.ObjectId(id));
      const songsCount = await Song.countDocuments({
        _id: { $in: songIds },
      });

      if (songsCount !== songIds.length) {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_SONGS",
            message: "One or more songs not found",
          },
        });
      }

      arrangement.songIds = songIds;
      arrangement.metadata.isMashup = songIds.length > 1;
    }

    await arrangement.save();

    // Reload the arrangement to trigger decompression middleware
    const updatedArrangement = await Arrangement.findById(arrangement._id)
      .populate("songIds", "title artist")
      .populate("createdBy", "name email");


    res.json({
      success: true,
      data: transformArrangementToClientFormat(updatedArrangement),
    });
  } catch (error) {
    console.error("Error updating arrangement:", error);

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
        message: "Failed to update arrangement",
      },
    });
  }
}

// Delete arrangement
export async function deleteArrangement(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const arrangement = await Arrangement.findById(id);

    if (!arrangement) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Arrangement not found",
        },
      });
    }

    // TODO: Add authorization check - only owner or admin can delete
    // TODO: Check if arrangement is used in any setlists before deleting

    await Arrangement.findByIdAndDelete(id);

    res.json({
      success: true,
      data: { id },
    });
  } catch (error) {
    console.error("Error deleting arrangement:", error);

    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to delete arrangement",
      },
    });
  }
}

// Rate an arrangement
export async function rateArrangement(req: Request, res: Response) {
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

    const arrangement = await Arrangement.findById(id);

    if (!arrangement) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Arrangement not found",
        },
      });
    }

    // TODO: Check if user already rated this arrangement

    await arrangement.addRating(rating);

    res.json({
      success: true,
      data: {
        averageRating: arrangement.metadata.ratings.average,
        totalRatings: arrangement.metadata.ratings.count,
      },
    });
  } catch (error) {
    console.error("Error rating arrangement:", error);

    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to rate arrangement",
      },
    });
  }
}