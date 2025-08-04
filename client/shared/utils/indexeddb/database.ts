import { openDB, DBSchema, IDBPDatabase } from "idb";

// Define the IndexedDB schema based on PRD specifications
interface HSASongbookDB extends DBSchema {
  songs: {
    key: string; // song ID
    value: {
      id: string;
      title: string;
      artist?: string;
      chordData: string; // ChordPro format
      musicalKey?: string; // Renamed from 'key' to avoid conflict with IndexedDB key
      tempo?: number;
      difficulty: "beginner" | "intermediate" | "advanced";
      themes: string[];
      metadata: {
        createdBy: string;
        isPublic: boolean;
        ratings: {
          average: number;
          count: number;
        };
        views: number;
      };
      lastAccessed: number; // Timestamp for LRU
      cachedAt: number; // When it was cached
    };
    indexes: {
      "by-title": string;
      "by-artist": string;
      "by-difficulty": "beginner" | "intermediate" | "advanced";
      "by-last-accessed": number;
    };
  };
  setlists: {
    key: string; // setlist ID
    value: {
      id: string;
      name: string;
      description?: string;
      createdBy: string;
      songs: Array<{
        songId: string;
        arrangementId: string;
        transposeBy: number;
        notes?: string;
        order: number;
      }>;
      tags: string[];
      metadata: {
        date?: string; // ISO string
        venue?: string;
        isPublic: boolean;
        shareToken?: string;
      };
      syncStatus: "synced" | "pending" | "conflict";
      lastModified: number;
      cachedAt: number;
    };
    indexes: {
      "by-created-by": string;
      "by-sync-status": "synced" | "pending" | "conflict";
      "by-last-modified": number;
    };
  };
  preferences: {
    key: string; // user ID
    value: {
      userId: string;
      theme: "light" | "dark" | "stage";
      fontSize: number;
      defaultKey?: string;
      notation: "english" | "german" | "latin";
      lastSync: number;
    };
  };
  syncQueue: {
    key: string; // operation ID
    value: {
      id: string;
      operation: "create" | "update" | "delete";
      entity: "song" | "setlist" | "preference";
      entityId: string;
      data: any;
      timestamp: number;
      retries: number;
      status: "pending" | "processing" | "failed";
    };
    indexes: {
      "by-status": "pending" | "processing" | "failed";
      "by-timestamp": number;
      "by-entity": "song" | "setlist" | "preference";
    };
  };
  storageStats: {
    key: "stats";
    value: {
      totalSize: number; // bytes
      songCount: number;
      setlistCount: number;
      lastCleanup: number;
      quotaUsage: number; // percentage
    };
  };
}

class IndexedDBManager {
  private db: IDBPDatabase<HSASongbookDB> | null = null;
  private dbName = "HSASongbookDB";
  private version = 1;

  async init(): Promise<void> {
    try {
      this.db = await openDB<HSASongbookDB>(this.dbName, this.version, {
        upgrade(db) {
          // Songs store
          if (!db.objectStoreNames.contains("songs")) {
            const songsStore = db.createObjectStore("songs", { keyPath: "id" });
            songsStore.createIndex("by-title", "title");
            songsStore.createIndex("by-artist", "artist");
            songsStore.createIndex("by-difficulty", "difficulty");
            songsStore.createIndex("by-last-accessed", "lastAccessed");
          }

          // Setlists store
          if (!db.objectStoreNames.contains("setlists")) {
            const setlistsStore = db.createObjectStore("setlists", { keyPath: "id" });
            setlistsStore.createIndex("by-created-by", "createdBy");
            setlistsStore.createIndex("by-sync-status", "syncStatus");
            setlistsStore.createIndex("by-last-modified", "lastModified");
          }

          // Preferences store
          if (!db.objectStoreNames.contains("preferences")) {
            db.createObjectStore("preferences", { keyPath: "userId" });
          }

          // Sync queue store
          if (!db.objectStoreNames.contains("syncQueue")) {
            const syncStore = db.createObjectStore("syncQueue", { keyPath: "id" });
            syncStore.createIndex("by-status", "status");
            syncStore.createIndex("by-timestamp", "timestamp");
            syncStore.createIndex("by-entity", "entity");
          }

          // Storage stats store
          if (!db.objectStoreNames.contains("storageStats")) {
            db.createObjectStore("storageStats", { keyPath: "key" });
          }
        },
      });

      console.log("✅ IndexedDB initialized successfully");
      await this.updateStorageStats();
    } catch (error) {
      console.error("❌ Failed to initialize IndexedDB:", error);
      throw error;
    }
  }

  private ensureDB(): IDBPDatabase<HSASongbookDB> {
    if (!this.db) {
      throw new Error("Database not initialized. Call init() first.");
    }
    return this.db;
  }

  // Song operations
  async cacheSong(song: HSASongbookDB["songs"]["value"]): Promise<void> {
    const db = this.ensureDB();
    const songWithTimestamp = {
      ...song,
      lastAccessed: Date.now(),
      cachedAt: Date.now(),
    };

    const tx = db.transaction("songs", "readwrite");
    await tx.store.put(songWithTimestamp);
    await tx.done;

    await this.updateStorageStats();
    await this.checkQuotaAndCleanup();
  }

  async getSong(id: string): Promise<HSASongbookDB["songs"]["value"] | undefined> {
    const db = this.ensureDB();
    const song = await db.get("songs", id);

    if (song) {
      // Update last accessed time for LRU
      song.lastAccessed = Date.now();
      const tx = db.transaction("songs", "readwrite");
      await tx.store.put(song);
      await tx.done;
    }

    return song;
  }

  async searchCachedSongs(query: string): Promise<HSASongbookDB["songs"]["value"][]> {
    const db = this.ensureDB();
    const allSongs = await db.getAll("songs");

    const lowerQuery = query.toLowerCase();
    return allSongs.filter(song => 
      song.title.toLowerCase().includes(lowerQuery) ||
      song.artist?.toLowerCase().includes(lowerQuery) ||
      song.themes.some(theme => theme.toLowerCase().includes(lowerQuery)),
    );
  }

  async getSongsByDifficulty(difficulty: "beginner" | "intermediate" | "advanced"): Promise<HSASongbookDB["songs"]["value"][]> {
    const db = this.ensureDB();
    return await db.getAllFromIndex("songs", "by-difficulty", difficulty);
  }

  // Setlist operations
  async cacheSetlist(setlist: HSASongbookDB["setlists"]["value"]): Promise<void> {
    const db = this.ensureDB();
    const setlistWithTimestamp = {
      ...setlist,
      cachedAt: Date.now(),
      lastModified: Date.now(),
      syncStatus: "synced" as const,
    };

    const tx = db.transaction("setlists", "readwrite");
    await tx.store.put(setlistWithTimestamp);
    await tx.done;

    await this.updateStorageStats();
  }

  async getSetlist(id: string): Promise<HSASongbookDB["setlists"]["value"] | undefined> {
    const db = this.ensureDB();
    return await db.get("setlists", id);
  }

  async getSetlistsByUser(userId: string): Promise<HSASongbookDB["setlists"]["value"][]> {
    const db = this.ensureDB();
    return await db.getAllFromIndex("setlists", "by-created-by", userId);
  }

  async updateSetlistSyncStatus(id: string, status: "synced" | "pending" | "conflict"): Promise<void> {
    const db = this.ensureDB();
    const setlist = await db.get("setlists", id);
    
    if (setlist) {
      setlist.syncStatus = status;
      setlist.lastModified = Date.now();
      
      const tx = db.transaction("setlists", "readwrite");
      await tx.store.put(setlist);
      await tx.done;
    }
  }

  // Sync queue operations
  async addToSyncQueue(operation: Omit<HSASongbookDB["syncQueue"]["value"], "id" | "timestamp" | "retries" | "status">): Promise<void> {
    const db = this.ensureDB();
    const queueItem: HSASongbookDB["syncQueue"]["value"] = {
      ...operation,
      id: `${operation.entity}-${operation.entityId}-${Date.now()}`,
      timestamp: Date.now(),
      retries: 0,
      status: "pending",
    };

    const tx = db.transaction("syncQueue", "readwrite");
    await tx.store.put(queueItem);
    await tx.done;
  }

  async getPendingSyncItems(): Promise<HSASongbookDB["syncQueue"]["value"][]> {
    const db = this.ensureDB();
    return await db.getAllFromIndex("syncQueue", "by-status", "pending");
  }

  async updateSyncItemStatus(id: string, status: "pending" | "processing" | "failed", incrementRetries = false): Promise<void> {
    const db = this.ensureDB();
    const item = await db.get("syncQueue", id);
    
    if (item) {
      item.status = status;
      if (incrementRetries) {
        item.retries += 1;
      }
      
      const tx = db.transaction("syncQueue", "readwrite");
      await tx.store.put(item);
      await tx.done;
    }
  }

  async removeSyncItem(id: string): Promise<void> {
    const db = this.ensureDB();
    const tx = db.transaction("syncQueue", "readwrite");
    await tx.store.delete(id);
    await tx.done;
  }

  // Storage management
  async updateStorageStats(): Promise<void> {
    const db = this.ensureDB();
    
    const [songs, setlists] = await Promise.all([
      db.getAll("songs"),
      db.getAll("setlists"),
    ]);

    // Estimate storage size (rough calculation)
    const totalSize = [...songs, ...setlists].reduce((size, item) => {
      return size + JSON.stringify(item).length * 2; // UTF-16 encoding
    }, 0);

    const stats: HSASongbookDB["storageStats"]["value"] = {
      totalSize,
      songCount: songs.length,
      setlistCount: setlists.length,
      lastCleanup: Date.now(),
      quotaUsage: 0, // Will be updated by checkQuotaAndCleanup
    };

    const tx = db.transaction("storageStats", "readwrite");
    await tx.store.put(stats, "stats");
    await tx.done;
  }

  async getStorageStats(): Promise<HSASongbookDB["storageStats"]["value"] | undefined> {
    const db = this.ensureDB();
    const result = await db.get("storageStats", "stats");
    return result;
  }

  async checkQuotaAndCleanup(): Promise<void> {
    if (!navigator.storage?.estimate) {
      console.warn("Storage quota API not available");
      return;
    }

    try {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const usagePercent = quota > 0 ? (used / quota) * 100 : 0;

      console.log(`📊 Storage usage: ${Math.round(used / 1024 / 1024)}MB / ${Math.round(quota / 1024 / 1024)}MB (${usagePercent.toFixed(1)}%)`);

      // Update storage stats
      const stats = await this.getStorageStats();
      if (stats) {
        stats.quotaUsage = usagePercent;
        const db = this.ensureDB();
        const tx = db.transaction("storageStats", "readwrite");
        await tx.store.put(stats, "stats");
        await tx.done;
      }

      // Trigger cleanup if usage is high
      if (usagePercent > 80) {
        console.warn("⚠️ Storage usage high, triggering cleanup");
        await this.cleanupOldEntries();
      }

    } catch (error) {
      console.error("❌ Error checking storage quota:", error);
    }
  }

  async cleanupOldEntries(): Promise<void> {
    const db = this.ensureDB();
    
    // Get songs sorted by last accessed (LRU)
    const songs = await db.getAllFromIndex("songs", "by-last-accessed");
    
    // Remove oldest 20% of songs if we have more than 50
    if (songs.length > 50) {
      const removeCount = Math.floor(songs.length * 0.2);
      const songsToRemove = songs.slice(0, removeCount);
      
      const tx = db.transaction("songs", "readwrite");
      for (const song of songsToRemove) {
        await tx.store.delete(song.id);
      }
      await tx.done;
      
      console.log(`🧹 Cleaned up ${removeCount} old songs`);
    }

    await this.updateStorageStats();
  }

  // Preferences operations
  async savePreferences(preferences: HSASongbookDB["preferences"]["value"]): Promise<void> {
    const db = this.ensureDB();
    const tx = db.transaction("preferences", "readwrite");
    await tx.store.put(preferences);
    await tx.done;
  }

  async getPreferences(userId: string): Promise<HSASongbookDB["preferences"]["value"] | undefined> {
    const db = this.ensureDB();
    return await db.get("preferences", userId);
  }

  // Utility methods
  async clearAllData(): Promise<void> {
    const db = this.ensureDB();
    const tx = db.transaction(["songs", "setlists", "syncQueue", "preferences", "storageStats"], "readwrite");
    
    await Promise.all([
      tx.objectStore("songs").clear(),
      tx.objectStore("setlists").clear(),
      tx.objectStore("syncQueue").clear(),
      tx.objectStore("preferences").clear(),
      tx.objectStore("storageStats").clear(),
    ]);
    
    await tx.done;
    console.log("🗑️ All IndexedDB data cleared");
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Export singleton instance
export const indexedDB = new IndexedDBManager();