import "dotenv/config";
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
  app.get("/api/songs/:id", songsRoutes.getSong);
  app.put("/api/songs/:id", songsRoutes.updateSong);
  app.delete("/api/songs/:id", songsRoutes.deleteSong);
  app.post("/api/songs/:id/rate", songsRoutes.rateSong);

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

  // Users API
  app.get("/api/users/:userId/favorites", usersRoutes.getUserFavorites);
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
  try {
    await database.connect();
    console.log("🚀 Database initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize database:", error);
    process.exit(1);
  }
}
