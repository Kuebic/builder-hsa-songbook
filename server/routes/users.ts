import { Request, Response } from "express";
import {
  User,
  Song,
  Arrangement,
  Review,
  Verse,
  Setlist,
} from "../database/models";
import { MusicalKey } from "../database/models/User";
import { z } from "zod";

// Import privacy settings type
interface UserPrivacySettings {
  isPublic: boolean;
  showFavorites: boolean;
  showActivity: boolean;
  showContributions: boolean;
  showReviews: boolean;
  allowContact: boolean;
  showStats: boolean;
  showBio: boolean;
  showLocation: boolean;
  showWebsite: boolean;
}

// Validation schemas
const userParamsSchema = z.object({
  userId: z.string().min(1), // Accept any non-empty string to support both MongoDB ObjectIds and Clerk IDs
});

const songParamsSchema = z.object({
  songId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid song ID format"),
});

const arrangementParamsSchema = z.object({
  arrangementId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid arrangement ID format"),
});

const favoritesQuerySchema = z.object({
  type: z.enum(["songs", "arrangements", "both"]).optional().default("both"),
});

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  profile: z
    .object({
      bio: z.string().max(500).optional(),
      website: z.string().url().max(200).optional().or(z.literal("")),
      location: z.string().max(100).optional(),
    })
    .optional(),
  preferences: z
    .object({
      defaultKey: z.enum([
        "C", "C#", "Db", "D", "D#", "Eb", "E", "F", 
        "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B",
      ]).optional(),
      fontSize: z.number().min(12).max(32).optional(),
      theme: z.enum(["light", "dark", "stage"]).optional(),
    })
    .optional(),
});

const updatePrivacySchema = z.object({
  profilePrivacy: z.object({
    isPublic: z.boolean().optional(),
    showFavorites: z.boolean().optional(),
    showActivity: z.boolean().optional(),
    showContributions: z.boolean().optional(),
    showReviews: z.boolean().optional(),
    allowContact: z.boolean().optional(),
    showStats: z.boolean().optional(),
    showBio: z.boolean().optional(),
    showLocation: z.boolean().optional(),
    showWebsite: z.boolean().optional(),
  }),
});

// Helper function to find user by either MongoDB _id or Clerk ID
async function findUserByIdOrClerkId(userId: string) {
  // Check if it's a valid MongoDB ObjectId (24 hex characters)
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(userId);

  if (isObjectId) {
    // Try to find by MongoDB _id first
    const user = await User.findById(userId);
    if (user) {
      return user;
    }
  }

  // If not found or not an ObjectId, try to find by Clerk ID
  return await User.findByClerkId(userId);
}

// GET /api/users/:userId/favorites - Get user's favorites (songs, arrangements, or both)
export const getFavorites = async (req: Request, res: Response) => {
  try {
    const { userId } = userParamsSchema.parse(req.params);
    const { type } = favoritesQuerySchema.parse(req.query);

    const user = await findUserByIdOrClerkId(userId);
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
      const populatedUser = await User.findById(user._id).populate({
        path: "favoriteSongs",
        model: "Song",
        select:
          "_id title artist slug themes compositionYear ccli metadata.ratings.average metadata.views createdAt updatedAt",
      });

      if (populatedUser) {
        songs = populatedUser.favoriteSongs as any[];
      }
    }

    // Fetch arrangement favorites
    if (type === "arrangements" || type === "both") {
      const populatedUser = await User.findById(user._id).populate({
        path: "favoriteArrangements",
        model: "Arrangement",
        populate: {
          path: "songIds",
          select: "title artist",
        },
        select:
          "_id name key difficulty tags metadata.ratings.average metadata.views metadata.isMashup createdAt updatedAt",
      });

      if (populatedUser) {
        arrangements = populatedUser.favoriteArrangements as any[];
      }
    }

    return res.json({
      success: true,
      data: {
        songs: type === "arrangements" ? undefined : songs,
        arrangements: type === "songs" ? undefined : arrangements,
      },
      meta: {
        userId: user._id.toString(),
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
    const user = await findUserByIdOrClerkId(userId);
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
    const user = await findUserByIdOrClerkId(userId);
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
    const user = await findUserByIdOrClerkId(userId);
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
export const removeArrangementFavorite = async (
  req: Request,
  res: Response,
) => {
  try {
    const { userId } = userParamsSchema.parse(req.params);
    const { arrangementId } = arrangementParamsSchema.parse(req.params);

    // Check if user exists
    const user = await findUserByIdOrClerkId(userId);
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

    const user = await findUserByIdOrClerkId(userId);
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

// Helper function to apply privacy filtering to user profile
function applyPrivacyFilter(
  user: any,
  isOwnProfile: boolean,
  requesterId?: string,
) {
  const isAdmin =
    requesterId && user.role && ["ADMIN", "MODERATOR"].includes(user.role);

  // If it's the user's own profile or admin viewing, return full data
  if (isOwnProfile || isAdmin) {
    return {
      _id: user._id,
      clerkId: user.clerkId,
      email: user.email,
      name: user.name,
      role: user.role,
      preferences: user.preferences || { fontSize: 16, theme: "light" },
      profile: user.profile || {},
      profilePrivacy: user.profilePrivacy,
      stats: user.stats || { songsCreated: 0, arrangementsCreated: 0, setlistsCreated: 0 },
      favoriteSongs: user.favoriteSongs,
      favoriteArrangements: user.favoriteArrangements,
      submittedVerses: user.submittedVerses,
      reviews: user.reviews,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  // For other users viewing this profile, apply privacy settings
  const privacy = user.profilePrivacy || {};

  // If profile is not public, return minimal information
  if (!privacy.isPublic) {
    return {
      _id: user._id,
      name: user.name,
      role: user.role,
      // Return empty profile and preferences objects for consistent structure
      profile: {},
      preferences: user.preferences || { fontSize: 16, theme: "light" },
      // Always show contributions for ministry value even if profile is private
      stats: privacy.showContributions
        ? {
            songsCreated: user.stats?.songsCreated || 0,
            arrangementsCreated: user.stats?.arrangementsCreated || 0,
            setlistsCreated: user.stats?.setlistsCreated || 0,
          }
        : { songsCreated: 0, arrangementsCreated: 0, setlistsCreated: 0 },
      isPublic: false,
      createdAt: user.createdAt,
    };
  }

  // Profile is public, apply granular privacy settings
  return {
    _id: user._id,
    name: user.name,
    role: user.role,
    profile: {
      bio: privacy.showBio ? user.profile?.bio : undefined,
      website: privacy.showWebsite ? user.profile?.website : undefined,
      location: privacy.showLocation ? user.profile?.location : undefined,
    },
    preferences: user.preferences || { fontSize: 16, theme: "light" },
    stats: privacy.showStats
      ? user.stats
      : { songsCreated: 0, arrangementsCreated: 0, setlistsCreated: 0 },
    email: privacy.allowContact ? user.email : undefined,
    favoriteSongs: privacy.showFavorites ? user.favoriteSongs : [],
    favoriteArrangements: privacy.showFavorites
      ? user.favoriteArrangements
      : [],
    submittedVerses: privacy.showActivity ? user.submittedVerses : [],
    reviews: privacy.showReviews ? user.reviews : [],
    isPublic: true,
    createdAt: user.createdAt,
  };
}

// GET /api/users/:userId/profile - Get user profile with privacy filtering
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const { userId } = userParamsSchema.parse(req.params);

    const user = await findUserByIdOrClerkId(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found",
        },
      });
    }

    // Check if this is the user's own profile
    // Get requester ID from auth context (assuming it's set by auth middleware)
    const requesterId = (req as any).userId || (req as any).user?.id;
    const isOwnProfile =
      requesterId === userId ||
      requesterId === user._id.toString() ||
      requesterId === user.clerkId;

    // Apply privacy filtering
    const profile = applyPrivacyFilter(user, isOwnProfile, requesterId);

    return res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);

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
        message: "Failed to fetch user profile",
      },
    });
  }
};

// PUT /api/users/:userId/profile - Update user profile
export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const { userId } = userParamsSchema.parse(req.params);
    const updates = updateProfileSchema.parse(req.body);

    const user = await findUserByIdOrClerkId(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found",
        },
      });
    }

    // Update user fields
    if (updates.name) {
      user.name = updates.name;
    }
    if (updates.profile) {
      if (updates.profile.bio !== undefined) {
        user.profile.bio = updates.profile.bio;
      }
      if (updates.profile.website !== undefined) {
        user.profile.website = updates.profile.website;
      }
      if (updates.profile.location !== undefined) {
        user.profile.location = updates.profile.location;
      }
    }
    if (updates.preferences) {
      if (updates.preferences.defaultKey !== undefined) {
        user.preferences.defaultKey = updates.preferences.defaultKey as MusicalKey;
      }
      if (updates.preferences.fontSize !== undefined) {
        user.preferences.fontSize = updates.preferences.fontSize;
      }
      if (updates.preferences.theme !== undefined) {
        user.preferences.theme = updates.preferences.theme;
      }
    }

    await user.save();

    return res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        profile: user.profile,
        preferences: user.preferences,
      },
    });
  } catch (error) {
    console.error("Error updating user profile:", error);

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
        message: "Failed to update user profile",
      },
    });
  }
};

// GET /api/users/:userId/contributions - Get user contributions
export const getUserContributions = async (req: Request, res: Response) => {
  try {
    const { userId } = userParamsSchema.parse(req.params);

    const user = await findUserByIdOrClerkId(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found",
        },
      });
    }

    // Fetch user's arrangements
    const arrangements = await Arrangement.find({ createdBy: user._id })
      .populate("songIds", "title artist")
      .select("_id name songIds createdAt metadata.ratings metadata.views")
      .sort("-createdAt")
      .limit(20);

    // Fetch user's verses
    const verses = await Verse.find({ userId: user._id })
      .populate("songId", "title artist")
      .select("_id songId verseNumber verseText upvotes createdAt")
      .sort("-createdAt")
      .limit(20);

    // Fetch user's reviews
    const reviews = await Review.find({ userId: user._id })
      .populate("arrangementId", "name")
      .select("_id arrangementId rating comment helpfulVotes createdAt")
      .sort("-createdAt")
      .limit(20);

    // Fetch user's public setlists
    const setlists = await Setlist.find({
      createdBy: user._id,
      "metadata.isPublic": true,
    })
      .select("_id name description songs metadata createdAt")
      .sort("-createdAt")
      .limit(20);

    return res.json({
      success: true,
      data: {
        arrangements,
        verses,
        reviews,
        setlists,
      },
    });
  } catch (error) {
    console.error("Error fetching user contributions:", error);

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
        message: "Failed to fetch user contributions",
      },
    });
  }
};

// GET /api/users/:userId/activity - Get user activity timeline
export const getUserActivity = async (req: Request, res: Response) => {
  try {
    const { userId } = userParamsSchema.parse(req.params);

    const user = await findUserByIdOrClerkId(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found",
        },
      });
    }

    interface ActivityItem {
      type: "song_created" | "arrangement_created" | "setlist_created" | "verse_submitted" | "review_posted";
      timestamp: Date;
      details: {
        id: string;
        title: string;
        subtitle?: string;
      };
    }

    const activities: ActivityItem[] = [];

    // Fetch recent songs created
    const songs = await Song.find({ "metadata.createdBy": user._id })
      .select("_id title artist slug createdAt")
      .sort("-createdAt")
      .limit(5);

    songs.forEach((song) => {
      activities.push({
        type: "song_created",
        timestamp: song.createdAt,
        details: {
          id: song.slug,
          title: song.title,
          subtitle: song.artist,
        },
      });
    });

    // Fetch recent arrangements
    const arrangements = await Arrangement.find({ createdBy: user._id })
      .populate("songIds", "title")
      .select("_id name songIds createdAt")
      .sort("-createdAt")
      .limit(5);

    arrangements.forEach((arr) => {
      const populatedSongIds = arr.songIds as any[];
      activities.push({
        type: "arrangement_created",
        timestamp: arr.createdAt,
        details: {
          id: arr._id.toString(),
          title: arr.name,
          subtitle: Array.isArray(populatedSongIds) 
            ? populatedSongIds.map((s: any) => s.title).join(", ") 
            : "",
        },
      });
    });

    // Fetch recent setlists
    const setlists = await Setlist.find({
      createdBy: user._id,
      "metadata.isPublic": true,
    })
      .select("_id name createdAt")
      .sort("-createdAt")
      .limit(5);

    setlists.forEach((setlist) => {
      activities.push({
        type: "setlist_created",
        timestamp: setlist.createdAt,
        details: {
          id: setlist._id.toString(),
          title: setlist.name,
        },
      });
    });

    // Fetch recent verses
    const verses = await Verse.find({ userId: user._id })
      .populate("songId", "title")
      .select("_id songId createdAt")
      .sort("-createdAt")
      .limit(5);

    verses.forEach((verse) => {
      const populatedSongId = verse.songId as any;
      activities.push({
        type: "verse_submitted",
        timestamp: verse.createdAt,
        details: {
          id: populatedSongId?._id?.toString() || verse._id.toString(),
          title: `Verse for ${populatedSongId?.title || "Unknown Song"}`,
        },
      });
    });

    // Fetch recent reviews
    const reviews = await Review.find({ userId: user._id })
      .populate("arrangementId", "name")
      .select("_id arrangementId createdAt")
      .sort("-createdAt")
      .limit(5);

    reviews.forEach((review) => {
      const populatedArrangementId = review.arrangementId as any;
      activities.push({
        type: "review_posted",
        timestamp: review.createdAt,
        details: {
          id: populatedArrangementId?._id?.toString() || review._id.toString(),
          title: `Review for ${populatedArrangementId?.name || "Unknown Arrangement"}`,
        },
      });
    });

    // Sort all activities by timestamp
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return res.json({
      success: true,
      data: activities.slice(0, 20), // Return top 20 most recent activities
    });
  } catch (error) {
    console.error("Error fetching user activity:", error);

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
        message: "Failed to fetch user activity",
      },
    });
  }
};

// PUT /api/users/:userId/privacy - Update user privacy settings
export const updateUserPrivacy = async (req: Request, res: Response) => {
  try {
    const { userId } = userParamsSchema.parse(req.params);
    const updates = updatePrivacySchema.parse(req.body);

    // Check if this is the user's own profile (only allow users to update their own privacy)
    const requesterId = (req as any).userId || (req as any).user?.id;

    const user = await findUserByIdOrClerkId(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found",
        },
      });
    }

    const isOwnProfile =
      requesterId === userId ||
      requesterId === user._id.toString() ||
      requesterId === user.clerkId;
    const isAdmin =
      (req as any).user?.role &&
      ["ADMIN", "MODERATOR"].includes((req as any).user.role);

    if (!isOwnProfile && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "You can only update your own privacy settings",
        },
      });
    }

    // Apply privacy updates with cascade logic
    const privacyUpdates = updates.profilePrivacy;

    // Initialize profilePrivacy if it doesn't exist
    if (!user.profilePrivacy) {
      user.profilePrivacy = {
        isPublic: false,
        showFavorites: false,
        showActivity: false,
        showContributions: true,
        showReviews: false,
        allowContact: false,
        showStats: false,
        showBio: false,
        showLocation: false,
        showWebsite: false,
      };
    }

    // Apply updates
    Object.keys(privacyUpdates).forEach((key) => {
      const privacyKey = key as keyof UserPrivacySettings;
      if (privacyUpdates[privacyKey] !== undefined) {
        (user.profilePrivacy as any)[privacyKey] = privacyUpdates[privacyKey];
      }
    });

    // Implement cascade logic - if isPublic is false, disable dependent settings
    if (user.profilePrivacy.isPublic === false) {
      user.profilePrivacy.showFavorites = false;
      user.profilePrivacy.showActivity = false;
      user.profilePrivacy.showReviews = false;
      user.profilePrivacy.allowContact = false;
      user.profilePrivacy.showStats = false;
      user.profilePrivacy.showBio = false;
      user.profilePrivacy.showLocation = false;
      user.profilePrivacy.showWebsite = false;
      // Note: showContributions can remain true even if profile is private (ministry value)
    }

    await user.save();

    // Return updated privacy settings
    const responseData = {
      _id: user._id,
      profilePrivacy: user.profilePrivacy,
      updatedAt: user.updatedAt,
    };

    return res.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("Error updating user privacy:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid privacy settings",
          details: error.errors,
        },
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to update privacy settings",
      },
    });
  }
};
