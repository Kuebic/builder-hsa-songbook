import { Request, Response } from "express";
import { Verse, Song, User } from "../database/models";
import { z } from "zod";
import { Types } from "mongoose";

// Validation schemas
const createVerseSchema = z.object({
  reference: z.string().trim().min(1).max(100),
  text: z.string().trim().min(1).max(1000),
});

const updateVerseSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  rejectionReason: z.string().max(500).optional(),
});

// Helper to check if user is admin/moderator
const canModerateVerses = (user: any): boolean => {
  return user && (user.role === "ADMIN" || user.role === "MODERATOR");
};

// GET /api/songs/:songId/verses - Get verses for a song
export const getVersesBySong = async (req: Request, res: Response) => {
  try {
    const { songId } = req.params;
    const { status } = req.query;

    // Validate songId
    if (!Types.ObjectId.isValid(songId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_SONG_ID",
          message: "Invalid song ID format",
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

    // Build query
    const query: any = { songId };
    
    // Non-moderators can only see approved verses
    const userId = req.query.userId || req.headers["x-user-id"];
    if (userId) {
      const user = await User.findById(userId);
      if (!canModerateVerses(user) && status !== "approved") {
        query.status = "approved";
      } else if (status && ["pending", "approved", "rejected"].includes(status as string)) {
        query.status = status;
      }
    } else {
      // No user context, only show approved
      query.status = "approved";
    }

    const verses = await Verse.find(query)
      .populate("submittedBy", "name email")
      .sort({ "upvotes.length": -1, createdAt: -1 });

    // Transform verses for response
    const transformedVerses = verses.map(verse => ({
      id: verse._id.toString(),
      songId: verse.songId.toString(),
      reference: verse.reference,
      text: verse.text,
      submittedBy: {
        id: verse.submittedBy._id.toString(),
        name: (verse.submittedBy as any).name,
        email: (verse.submittedBy as any).email,
      },
      upvoteCount: verse.upvotes.length,
      hasUpvoted: userId ? verse.upvotes.some(id => id.toString() === userId) : false,
      status: verse.status,
      rejectionReason: verse.rejectionReason,
      createdAt: verse.createdAt,
      updatedAt: verse.updatedAt,
    }));

    res.json({
      success: true,
      data: {
        verses: transformedVerses,
        songTitle: song.title,
        songArtist: song.artist,
      },
    });
  } catch (error) {
    console.error("Error fetching verses:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch verses",
      },
    });
  }
};

// POST /api/songs/:songId/verses - Submit a new verse
export const submitVerse = async (req: Request, res: Response) => {
  try {
    const { songId } = req.params;
    const userId = req.body.userId || req.headers["x-user-id"];

    // Validate user
    if (!userId || !Types.ObjectId.isValid(userId as string)) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "User authentication required",
        },
      });
    }

    // Validate songId
    if (!Types.ObjectId.isValid(songId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_SONG_ID",
          message: "Invalid song ID format",
        },
      });
    }

    // Validate request body
    const validationResult = createVerseSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid verse data",
          details: validationResult.error.errors,
        },
      });
    }

    const { reference, text } = validationResult.data;

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

    // Check for duplicate verse (same reference for same song)
    const existingVerse = await Verse.findOne({
      songId,
      reference,
      submittedBy: userId,
    });

    if (existingVerse) {
      return res.status(409).json({
        success: false,
        error: {
          code: "VERSE_ALREADY_EXISTS",
          message: "You have already submitted a verse with this reference for this song",
        },
      });
    }

    // Create new verse
    const verse = new Verse({
      songId,
      reference,
      text,
      submittedBy: userId,
      status: "pending",
    });

    await verse.save();

    // Add to user's submitted verses
    await user.addSubmittedVerse(verse._id);

    // Populate submittedBy for response
    await verse.populate("submittedBy", "name email");

    res.status(201).json({
      success: true,
      data: {
        id: verse._id.toString(),
        songId: verse.songId.toString(),
        reference: verse.reference,
        text: verse.text,
        submittedBy: {
          id: verse.submittedBy._id.toString(),
          name: (verse.submittedBy as any).name,
          email: (verse.submittedBy as any).email,
        },
        upvoteCount: 0,
        hasUpvoted: false,
        status: verse.status,
        createdAt: verse.createdAt,
        updatedAt: verse.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error submitting verse:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to submit verse",
      },
    });
  }
};

// POST /api/verses/:id/upvote - Upvote/remove upvote for a verse
export const upvoteVerse = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.body.userId || req.headers["x-user-id"];

    // Validate user
    if (!userId || !Types.ObjectId.isValid(userId as string)) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "User authentication required",
        },
      });
    }

    // Validate verse ID
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_VERSE_ID",
          message: "Invalid verse ID format",
        },
      });
    }

    // Find verse
    const verse = await Verse.findById(id);
    if (!verse) {
      return res.status(404).json({
        success: false,
        error: {
          code: "VERSE_NOT_FOUND",
          message: "Verse not found",
        },
      });
    }

    // Only allow upvoting approved verses
    if (verse.status !== "approved") {
      return res.status(403).json({
        success: false,
        error: {
          code: "VERSE_NOT_APPROVED",
          message: "Can only upvote approved verses",
        },
      });
    }

    // Toggle upvote
    const userObjectId = new Types.ObjectId(userId as string);
    const hasUpvoted = verse.upvotes.some(id => id.equals(userObjectId));

    if (hasUpvoted) {
      await verse.removeUpvote(userObjectId);
    } else {
      await verse.addUpvote(userObjectId);
    }

    res.json({
      success: true,
      data: {
        verseId: verse._id.toString(),
        upvoteCount: verse.getUpvoteCount(),
        hasUpvoted: !hasUpvoted,
      },
    });
  } catch (error) {
    console.error("Error upvoting verse:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to update upvote",
      },
    });
  }
};

// PUT /api/verses/:id - Update verse (admin/moderator only)
export const updateVerse = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.body.userId || req.headers["x-user-id"];

    // Validate user
    if (!userId || !Types.ObjectId.isValid(userId as string)) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "User authentication required",
        },
      });
    }

    // Check user permissions
    const user = await User.findById(userId);
    if (!canModerateVerses(user)) {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Insufficient permissions",
        },
      });
    }

    // Validate verse ID
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_VERSE_ID",
          message: "Invalid verse ID format",
        },
      });
    }

    // Validate request body
    const validationResult = updateVerseSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid update data",
          details: validationResult.error.errors,
        },
      });
    }

    const { status, rejectionReason } = validationResult.data;

    // Find and update verse
    const verse = await Verse.findById(id);
    if (!verse) {
      return res.status(404).json({
        success: false,
        error: {
          code: "VERSE_NOT_FOUND",
          message: "Verse not found",
        },
      });
    }

    // Update based on status
    if (status === "approved") {
      await verse.approve();
    } else if (status === "rejected") {
      await verse.reject(rejectionReason);
    }

    // Populate for response
    await verse.populate("submittedBy", "name email");

    res.json({
      success: true,
      data: {
        id: verse._id.toString(),
        songId: verse.songId.toString(),
        reference: verse.reference,
        text: verse.text,
        submittedBy: {
          id: verse.submittedBy._id.toString(),
          name: (verse.submittedBy as any).name,
          email: (verse.submittedBy as any).email,
        },
        upvoteCount: verse.getUpvoteCount(),
        status: verse.status,
        rejectionReason: verse.rejectionReason,
        createdAt: verse.createdAt,
        updatedAt: verse.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error updating verse:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to update verse",
      },
    });
  }
};

// DELETE /api/verses/:id - Delete verse (admin only)
export const deleteVerse = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.body.userId || req.headers["x-user-id"];

    // Validate user
    if (!userId || !Types.ObjectId.isValid(userId as string)) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "User authentication required",
        },
      });
    }

    // Check user permissions (admin only)
    const user = await User.findById(userId);
    if (!user || user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Admin permissions required",
        },
      });
    }

    // Validate verse ID
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_VERSE_ID",
          message: "Invalid verse ID format",
        },
      });
    }

    // Find and delete verse
    const verse = await Verse.findByIdAndDelete(id);
    if (!verse) {
      return res.status(404).json({
        success: false,
        error: {
          code: "VERSE_NOT_FOUND",
          message: "Verse not found",
        },
      });
    }

    // Remove from user's submitted verses
    const submitter = await User.findById(verse.submittedBy);
    if (submitter) {
      submitter.submittedVerses = submitter.submittedVerses.filter(
        verseId => !verseId.equals(verse._id),
      );
      await submitter.save();
    }

    res.json({
      success: true,
      data: {
        message: "Verse deleted successfully",
        deletedVerseId: id,
      },
    });
  } catch (error) {
    console.error("Error deleting verse:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to delete verse",
      },
    });
  }
};