import mongoose from "mongoose";

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private isConnected = false;

  private constructor() {}

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      console.log("Database already connected");
      return;
    }

    try {
      const mongoUri = process.env.MONGODB_URI;
      
      if (!mongoUri) {
        throw new Error("MONGODB_URI environment variable is not defined");
      }

      // Configure mongoose for optimal Atlas free tier usage
      mongoose.set("bufferCommands", false);

      await mongoose.connect(mongoUri, {
        // Connection optimization for free tier
        maxPoolSize: 5, // Limit connection pool for free tier
        serverSelectionTimeoutMS: 3000, // Faster failures for fallback
        socketTimeoutMS: 5000, // Shorter socket timeout
        connectTimeoutMS: 3000, // Faster connection timeout
        bufferCommands: false, // Disable mongoose buffering
        
        // Compression settings - let MongoDB handle this
        compressors: ["zstd", "zlib", "snappy"],
        zlibCompressionLevel: 6,
      });

      this.isConnected = true;
      console.log("✅ Connected to MongoDB Atlas");
      
      // Monitor database size and connection
      this.setupMonitoring();
      
    } catch (error) {
      console.error("❌ MongoDB connection error:", error);
      this.isConnected = false;
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log("📴 Disconnected from MongoDB");
    } catch (error) {
      console.error("❌ Error disconnecting from MongoDB:", error);
      throw error;
    }
  }

  public isConnectedToDatabase(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  private setupMonitoring(): void {
    // Monitor connection events
    mongoose.connection.on("error", (error) => {
      console.error("❌ MongoDB connection error:", error);
      this.isConnected = false;
    });

    mongoose.connection.on("disconnected", () => {
      console.log("📴 MongoDB disconnected");
      this.isConnected = false;
    });

    mongoose.connection.on("reconnected", () => {
      console.log("🔄 MongoDB reconnected");
      this.isConnected = true;
    });

    // Set up periodic storage monitoring (every 30 minutes)
    setInterval(async () => {
      try {
        await this.checkStorageUsage();
      } catch (error) {
        console.error("❌ Error checking storage usage:", error);
      }
    }, 30 * 60 * 1000); // 30 minutes
  }

  private async checkStorageUsage(): Promise<void> {
    try {
      const db = mongoose.connection.db;
      if (!db) return;

      const stats = await db.stats();
      const usageBytes = stats.dataSize + stats.indexSize;
      const usageMB = Math.round(usageBytes / (1024 * 1024));
      const usagePercent = Math.round((usageMB / 512) * 100); // 512MB free tier limit

      console.log(`📊 Database usage: ${usageMB}MB / 512MB (${usagePercent}%)`);

      // Alert when approaching limit
      if (usagePercent >= 80) {
        console.warn(`⚠️  Database usage at ${usagePercent}% - consider cleanup`);
      }

      if (usagePercent >= 95) {
        console.error(`🚨 Database usage critical at ${usagePercent}% - immediate cleanup required`);
      }

    } catch (error) {
      console.error("❌ Error checking database stats:", error);
    }
  }

  public async getStorageStats(): Promise<{
    usage: number;
    limit: number;
    percentage: number;
    dataSize: number;
    indexSize: number;
  }> {
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Database not connected");
    }

    const stats = await db.stats();
    const usageBytes = stats.dataSize + stats.indexSize;
    const usageMB = Math.round(usageBytes / (1024 * 1024));
    const limitMB = 512; // Atlas free tier limit
    const percentage = Math.round((usageMB / limitMB) * 100);

    return {
      usage: usageMB,
      limit: limitMB,
      percentage,
      dataSize: Math.round(stats.dataSize / (1024 * 1024)),
      indexSize: Math.round(stats.indexSize / (1024 * 1024)),
    };
  }
}

// Export singleton instance
export const database = DatabaseConnection.getInstance();
