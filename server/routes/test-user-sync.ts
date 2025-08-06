import { Request, Response } from "express";
import { User } from "../database/models";

// POST /api/users/sync - Sync Clerk user with database
export const syncUser = async (req: Request, res: Response) => {
  try {
    const { clerkId, email, name } = req.body;

    if (!clerkId || !email) {
      return res.status(400).json({
        success: false,
        error: {
          code: "MISSING_FIELDS",
          message: "clerkId and email are required",
        },
      });
    }

    // Check if user already exists with this Clerk ID
    let user = await User.findByClerkId(clerkId);

    if (!user) {
      // Check if user exists with this email (migration case)
      user = await User.findByEmail(email);

      if (user) {
        // Update existing user with Clerk ID
        user.clerkId = clerkId;
        await user.save();
      } else {
        // Create new user
        user = await User.create({
          clerkId,
          email,
          name: name || email.split("@")[0],
          role: "USER",
          preferences: {
            fontSize: 16,
            theme: "light",
          },
          profile: {},
          favoriteSongs: [],
          favoriteArrangements: [],
          submittedVerses: [],
          reviews: [],
          stats: {
            songsCreated: 0,
            arrangementsCreated: 0,
            setlistsCreated: 0,
          },
          isActive: true,
        });
      }
    }

    return res.json({
      success: true,
      data: {
        _id: user._id.toString(),
        clerkId: user.clerkId,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error syncing user:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to sync user",
      },
    });
  }
};
