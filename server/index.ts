import "./env"; // Load environment variables first
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { database } from "./database/connection";

export async function createServer() {
  const app = express();

  // Initialize database connection
  await initializeServer();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Import API route handlers
  const songsRoutes = await import("./routes/songs");
  const setlistsRoutes = await import("./routes/setlists");
  const storageRoutes = await import("./routes/storage");
  const syncRoutes = await import("./routes/sync");
  const usersRoutes = await import("./routes/users");
  const arrangementsRoutes = await import("./routes/arrangements");
  const versesRoutes = await import("./routes/verses");
  const reviewsRoutes = await import("./routes/reviews");
  const categoriesRoutes = await import("./routes/categories");

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Songs API
  app.get("/api/songs", songsRoutes.getSongs);
  app.post("/api/songs", songsRoutes.createSong);
  app.get("/api/songs/search", songsRoutes.searchSongs);
  app.get("/api/songs/stats", songsRoutes.getSongsStats);
  app.get("/api/songs/slug/:slug", songsRoutes.getSongBySlug);
  app.get("/api/songs/ccli/:ccli", songsRoutes.getSongByCCLI);
  app.get("/api/songs/:id", songsRoutes.getSong);
  app.put("/api/songs/:id", songsRoutes.updateSong);
  app.delete("/api/songs/:id", songsRoutes.deleteSong);
  app.post("/api/songs/:id/rate", songsRoutes.rateSong);

  // Categories API
  app.get("/api/categories/stats", categoriesRoutes.getCategoryStats);
  app.get("/api/categories/:categoryId/songs", categoriesRoutes.getCategorySongs);

  // Arrangements API
  app.get("/api/songs/:songId/arrangements", arrangementsRoutes.getArrangementsBySong);
  app.post("/api/arrangements", arrangementsRoutes.createArrangement);
  app.put("/api/arrangements/:id", arrangementsRoutes.updateArrangement);
  app.delete("/api/arrangements/:id", arrangementsRoutes.deleteArrangement);
  app.post("/api/arrangements/:id/rate", arrangementsRoutes.rateArrangement);

  // Verses API
  app.get("/api/songs/:songId/verses", versesRoutes.getVersesBySong);
  app.post("/api/songs/:songId/verses", versesRoutes.submitVerse);
  app.post("/api/verses/:id/upvote", versesRoutes.upvoteVerse);
  app.put("/api/verses/:id", versesRoutes.updateVerse);
  app.delete("/api/verses/:id", versesRoutes.deleteVerse);

  // Reviews API
  app.get("/api/arrangements/:arrangementId/reviews", reviewsRoutes.getReviews);
  app.post("/api/arrangements/:arrangementId/reviews", reviewsRoutes.createOrUpdateReview);
  app.post("/api/reviews/:id/helpful", reviewsRoutes.markHelpful);
  app.post("/api/reviews/:id/report", reviewsRoutes.reportReview);
  app.get("/api/reviews/reported", reviewsRoutes.getReportedReviews);
  app.put("/api/reviews/:id/clear-report", reviewsRoutes.clearReport);
  app.delete("/api/reviews/:id", reviewsRoutes.deleteReview);

  // Setlists API
  app.get("/api/setlists", setlistsRoutes.getSetlists);
  app.post("/api/setlists", setlistsRoutes.createSetlist);
  app.get("/api/setlists/:id", setlistsRoutes.getSetlist);
  app.put("/api/setlists/:id", setlistsRoutes.updateSetlist);
  app.delete("/api/setlists/:id", setlistsRoutes.deleteSetlist);
  app.get("/api/setlists/share/:token", setlistsRoutes.getSetlistByToken);
  app.post("/api/setlists/:id/songs", setlistsRoutes.addSongToSetlist);
  app.delete("/api/setlists/:id/songs/:arrangementId", setlistsRoutes.removeSongFromSetlist);
  app.put("/api/setlists/:id/reorder", setlistsRoutes.reorderSetlistSongs);

  // Storage monitoring API
  app.get("/api/storage/stats", storageRoutes.getStorageStats);
  app.post("/api/storage/cleanup", storageRoutes.triggerCleanup);
  app.get("/api/storage/compression", storageRoutes.getCompressionStats);

  // Sync API
  app.post("/api/sync/batch", syncRoutes.batchSync);
  app.get("/api/sync/status", syncRoutes.getSyncStatus);
  app.post("/api/sync/resolve", syncRoutes.resolveConflicts);

  // User sync endpoint for development/testing
  const userSyncRoutes = await import("./routes/test-user-sync");
  app.post("/api/users/sync", userSyncRoutes.syncUser);
  
  // Users API - Enhanced favorites with dual support
  app.get("/api/users/:userId/favorites", usersRoutes.getFavorites); // New endpoint with type parameter
  app.post("/api/users/:userId/favorites/songs/:songId", usersRoutes.addSongFavorite);
  app.delete("/api/users/:userId/favorites/songs/:songId", usersRoutes.removeSongFavorite);
  app.post("/api/users/:userId/favorites/arrangements/:arrangementId", usersRoutes.addArrangementFavorite);
  app.delete("/api/users/:userId/favorites/arrangements/:arrangementId", usersRoutes.removeArrangementFavorite);
  
  // Legacy favorites endpoints for backward compatibility
  app.post("/api/users/:userId/favorites/:songId", usersRoutes.addFavorite);
  app.delete("/api/users/:userId/favorites/:songId", usersRoutes.removeFavorite);
  app.get("/api/users/:userId/favorites/check/:songId", usersRoutes.checkFavorite);

  // Database status endpoint
  app.get("/api/health", async (_req, res) => {
    try {
      const isConnected = database.isConnectedToDatabase();
      if (isConnected) {
        const stats = await database.getStorageStats();
        res.json({
          status: "healthy",
          database: {
            connected: true,
            storage: stats,
          },
        });
      } else {
        res.status(503).json({
          status: "unhealthy",
          database: {
            connected: false,
          },
        });
      }
    } catch (error) {
      res.status(503).json({
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  return app;
}

// Initialize database connection
export async function initializeServer() {
  console.log("🚀 Starting server initialization...");
  
  try {
    // Check if MongoDB URI is available
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI environment variable is not set");
    }
    
    // Log connection attempt (with masked URI)
    const maskedUri = process.env.MONGODB_URI.replace(
      /mongodb(?:\+srv)?:\/\/([^:]+):([^@]+)@/,
      "mongodb://*****:*****@",
    );
    console.log(`🔌 Attempting to connect to MongoDB: ${maskedUri}`);
    
    await database.connect();
    console.log("✅ Database connection established");
    
    // Get connection info for debugging
    const connInfo = database.getConnectionInfo();
    console.log(`📊 Database info: ${connInfo.name || "default"} on ${connInfo.host}:${connInfo.port}`);

    // Check if we need to run migrations
    await runInitialMigration();
    
    console.log("✅ Server initialization complete");

  } catch (error) {
    console.error("❌ Failed to initialize server:", error);
    
    // Provide specific error messages based on error type
    if (error instanceof Error) {
      if (error.message.includes("ECONNREFUSED")) {
        console.error("💡 Connection refused - is MongoDB running?");
        console.error("   For local MongoDB: ensure mongod is running");
        console.error("   For MongoDB Atlas: check your connection string and IP whitelist");
      } else if (error.message.includes("authentication failed")) {
        console.error("💡 Authentication failed - check your MongoDB credentials");
        console.error("   Ensure username and password in MONGODB_URI are correct");
      } else if (error.message.includes("ETIMEDOUT")) {
        console.error("💡 Connection timeout - check network and firewall settings");
        console.error("   For MongoDB Atlas: ensure your IP is whitelisted");
      } else if (error.message.includes("MONGODB_URI")) {
        console.error("💡 Environment configuration issue");
        console.error("   Create a .env file in your project root with:");
        console.error("   MONGODB_URI=your_mongodb_connection_string");
      }
    }

    // For development, allow continuing without database but with warnings
    if (process.env.NODE_ENV === "development") {
      console.warn("\n⚠️  WARNING: Continuing in development mode without database");
      console.warn("⚠️  API endpoints will return errors");
      console.warn("⚠️  Fix the database connection to restore full functionality\n");
      return;
    }

    // In production, exit if database fails
    throw error;
  }
}

async function runInitialMigration() {
  try {
    const { Song } = await import("./database/models");
    const songCount = await Song.countDocuments();

    if (songCount === 0) {
      console.log("📦 Database is empty, running initial migration...");
      const { migrateMockData } = await import("./migrations/migrate-mock-data");
      const result = await migrateMockData();
      console.log("✅ Initial migration completed:", result);
    } else {
      console.log(`📊 Database already has ${songCount} songs`);
    }
  } catch (error) {
    console.warn("⚠️  Could not run migration:", error instanceof Error ? error.message : error);
    console.log("💡 The app will continue with an empty database");
  }
}
