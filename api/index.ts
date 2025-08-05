import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createServer, initializeServer } from "../server";
import type { Application } from "express";

// Cache the Express app instance
let app: Application | undefined;

// Initialize the server once
async function getApp() {
  if (!app) {
    console.log("🚀 Initializing Vercel serverless function...");
    
    try {
      // Initialize database connection
      await initializeServer();
      
      // Create Express app
      app = await createServer();
      
      console.log("✅ Vercel function initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize Vercel function:", error);
      throw error;
    }
  }
  
  return app;
}

// Vercel serverless function handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Get or create the Express app
    const expressApp = await getApp();
    
    // Handle the request with Express
    expressApp(req, res);
  } catch (error) {
    console.error("❌ Vercel function error:", error);
    
    // Return error response
    res.status(503).json({
      success: false,
      error: {
        code: "SERVER_INIT_ERROR",
        message: "Server initialization failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
}