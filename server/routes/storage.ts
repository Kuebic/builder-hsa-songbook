import { Request, Response } from "express";
import { database } from "../database/connection";
import { Song, Setlist, Arrangement, User } from "../database/models";

// Get database storage statistics
export async function getStorageStats(_req: Request, res: Response) {
  try {
    const stats = await database.getStorageStats();

    // Get additional collection stats
    const [songCount, setlistCount, arrangementCount, userCount] =
      await Promise.all([
        Song.countDocuments(),
        Setlist.countDocuments(),
        Arrangement.countDocuments(),
        User.countDocuments(),
      ]);

    // Get top 10 largest documents
    const largeSongs = await Song.find({})
      .sort({ documentSize: -1 })
      .limit(10)
      .select("title artist documentSize")
      .lean();

    const largeArrangements = await Arrangement.find({})
      .sort({ documentSize: -1 })
      .limit(10)
      .select("name documentSize")
      .lean();

    res.json({
      success: true,
      data: {
        database: stats,
        collections: {
          songs: songCount,
          setlists: setlistCount,
          arrangements: arrangementCount,
          users: userCount,
        },
        largest: {
          songs: largeSongs,
          arrangements: largeArrangements,
        },
        recommendations: generateRecommendations(stats),
      },
    });
  } catch (error) {
    console.error("Error fetching storage stats:", error);

    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch storage statistics",
      },
    });
  }
}

// Trigger cleanup of old/unused data
export async function triggerCleanup(req: Request, res: Response) {
  try {
    const { dryRun = false } = req.query;

    const cleanupResults = {
      duplicateSlugs: 0,
      unusedArrangements: 0,
      oldUnusedSongs: 0,
      emptySetlists: 0,
    };

    // Find duplicate slugs (shouldn't happen but just in case)
    const duplicateSlugs = await Song.aggregate([
      { $group: { _id: "$slug", count: { $sum: 1 }, ids: { $push: "$_id" } } },
      { $match: { count: { $gt: 1 } } },
    ]);

    cleanupResults.duplicateSlugs = duplicateSlugs.length;

    if (!dryRun && duplicateSlugs.length > 0) {
      // Keep the first one, delete the rest
      for (const duplicate of duplicateSlugs) {
        const idsToDelete = duplicate.ids.slice(1);
        await Song.deleteMany({ _id: { $in: idsToDelete } });
      }
    }

    // Find arrangements that haven't been used in 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const unusedArrangements = await Arrangement.find({
      $or: [
        { "stats.lastUsed": { $lt: sixMonthsAgo } },
        { "stats.lastUsed": null },
        { "stats.usageCount": 0 },
      ],
      isPublic: false, // Only cleanup private arrangements
    });

    cleanupResults.unusedArrangements = unusedArrangements.length;

    if (!dryRun && unusedArrangements.length > 0) {
      const unusedIds = unusedArrangements.map((arr) => arr._id);
      await Arrangement.deleteMany({ _id: { $in: unusedIds } });
    }

    // Find songs that haven't been viewed in 3 months and have low ratings
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const oldUnusedSongs = await Song.find({
      updatedAt: { $lt: threeMonthsAgo },
      "metadata.views": { $lt: 5 },
      "metadata.ratings.average": { $lt: 2.5 },
      "metadata.isPublic": false, // Only cleanup private songs
    });

    cleanupResults.oldUnusedSongs = oldUnusedSongs.length;

    if (!dryRun && oldUnusedSongs.length > 0) {
      const songIds = oldUnusedSongs.map((song) => song._id);
      await Song.deleteMany({ _id: { $in: songIds } });
    }

    // Find empty setlists
    const emptySetlists = await Setlist.find({
      songs: { $size: 0 },
      updatedAt: { $lt: threeMonthsAgo },
    });

    cleanupResults.emptySetlists = emptySetlists.length;

    if (!dryRun && emptySetlists.length > 0) {
      const setlistIds = emptySetlists.map((setlist) => setlist._id);
      await Setlist.deleteMany({ _id: { $in: setlistIds } });
    }

    res.json({
      success: true,
      data: {
        dryRun: !!dryRun,
        results: cleanupResults,
        message: dryRun
          ? "Cleanup analysis completed (no changes made)"
          : "Cleanup completed successfully",
      },
    });
  } catch (error) {
    console.error("Error during cleanup:", error);

    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Cleanup operation failed",
      },
    });
  }
}

// Get compression statistics
export async function getCompressionStats(_req: Request, res: Response) {
  try {
    // Sample some documents to estimate compression ratio
    const sampleSongs = await Song.find({})
      .limit(100)
      .select("chordData documentSize")
      .lean();

    const sampleArrangements = await Arrangement.find({})
      .limit(50)
      .select("chordData documentSize")
      .lean();

    // Estimate compression ratios (this is approximate)
    let totalCompressed = 0;
    let totalOriginal = 0;

    for (const song of sampleSongs) {
      // @ts-ignore - Old schema compatibility
      if (song.chordData && song.documentSize) {
        // @ts-ignore - Old schema compatibility
        const originalSize = song.chordData.length * 2; // UTF-16 encoding
        totalOriginal += originalSize;
        totalCompressed += song.documentSize;
      }
    }

    for (const arrangement of sampleArrangements) {
      if (arrangement.chordData && arrangement.documentSize) {
        const originalSize = arrangement.chordData.length * 2;
        totalOriginal += originalSize;
        totalCompressed += arrangement.documentSize;
      }
    }

    const compressionRatio =
      totalOriginal > 0
        ? ((totalOriginal - totalCompressed) / totalOriginal) * 100
        : 0;

    res.json({
      success: true,
      data: {
        sampleSize: sampleSongs.length + sampleArrangements.length,
        estimatedCompressionRatio: Math.round(compressionRatio * 100) / 100,
        originalSizeEstimate:
          Math.round((totalOriginal / 1024 / 1024) * 100) / 100, // MB
        compressedSizeEstimate:
          Math.round((totalCompressed / 1024 / 1024) * 100) / 100, // MB
        spacesSaved:
          Math.round(((totalOriginal - totalCompressed) / 1024 / 1024) * 100) /
          100, // MB
      },
    });
  } catch (error) {
    console.error("Error fetching compression stats:", error);

    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch compression statistics",
      },
    });
  }
}

// Health check endpoint with storage monitoring
export async function healthCheck(_req: Request, res: Response) {
  try {
    const isConnected = database.isConnectedToDatabase();

    if (!isConnected) {
      return res.status(503).json({
        success: false,
        status: "unhealthy",
        error: {
          code: "DATABASE_DISCONNECTED",
          message: "Database connection lost",
        },
      });
    }

    const stats = await database.getStorageStats();
    const isHealthy = stats.percentage < 90; // Consider unhealthy if > 90% usage

    res.status(isHealthy ? 200 : 503).json({
      success: true,
      status: isHealthy ? "healthy" : "degraded",
      data: {
        database: {
          connected: true,
          usage: `${stats.usage}MB / ${stats.limit}MB`,
          percentage: `${stats.percentage}%`,
        },
        warnings: stats.percentage > 80 ? ["High storage usage"] : [],
      },
    });
  } catch (error) {
    console.error("Health check error:", error);

    res.status(503).json({
      success: false,
      status: "error",
      error: {
        code: "HEALTH_CHECK_FAILED",
        message: "Health check failed",
      },
    });
  }
}

// Helper function to generate storage recommendations
function generateRecommendations(stats: any): string[] {
  const recommendations: string[] = [];

  if (stats.percentage > 90) {
    recommendations.push(
      "CRITICAL: Database storage usage above 90%. Immediate cleanup required.",
    );
  } else if (stats.percentage > 80) {
    recommendations.push(
      "WARNING: Database storage usage above 80%. Consider cleanup.",
    );
  }

  if (stats.percentage > 70) {
    recommendations.push(
      "Consider increasing compression levels or archiving old data.",
    );
  }

  if (stats.dataSize > stats.indexSize * 10) {
    recommendations.push(
      "Index size is relatively small. Storage usage is mainly data.",
    );
  } else if (stats.indexSize > stats.dataSize * 0.3) {
    recommendations.push("Index size is large. Consider optimizing indexes.");
  }

  return recommendations;
}
