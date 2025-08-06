import { useEffect, useState, useCallback } from "react";
import { indexedDB } from "../utils/indexeddb/database";

interface UseIndexedDBReturn {
  isReady: boolean;
  error: string | null;
  storageStats: {
    totalSize: number;
    songCount: number;
    setlistCount: number;
    quotaUsage: number;
  } | null;
  refreshStats: () => Promise<void>;
}

export function useIndexedDB(): UseIndexedDBReturn {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storageStats, setStorageStats] =
    useState<UseIndexedDBReturn["storageStats"]>(null);

  // Initialize IndexedDB
  useEffect(() => {
    const initDB = async () => {
      try {
        setError(null);
        await indexedDB.init();
        setIsReady(true);

        // Load initial stats
        const stats = await indexedDB.getStorageStats();
        if (stats) {
          setStorageStats({
            totalSize: stats.totalSize,
            songCount: stats.songCount,
            setlistCount: stats.setlistCount,
            quotaUsage: stats.quotaUsage,
          });
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to initialize IndexedDB";
        setError(errorMessage);
        console.error("IndexedDB initialization error:", err);
      }
    };

    initDB();
  }, []);

  // Refresh storage stats
  const refreshStats = useCallback(async () => {
    if (!isReady) {
      return;
    }

    try {
      await indexedDB.updateStorageStats();
      const stats = await indexedDB.getStorageStats();
      if (stats) {
        setStorageStats({
          totalSize: stats.totalSize,
          songCount: stats.songCount,
          setlistCount: stats.setlistCount,
          quotaUsage: stats.quotaUsage,
        });
      }
    } catch (err) {
      console.error("Error refreshing storage stats:", err);
    }
  }, [isReady]);

  return {
    isReady,
    error,
    storageStats,
    refreshStats,
  };
}

// Hook for caching songs
export function useCachedSongs() {
  const { isReady } = useIndexedDB();

  const cacheSong = useCallback(
    async (song: any) => {
      if (!isReady) {
        return;
      }
      await indexedDB.cacheSong(song);
    },
    [isReady],
  );

  const getCachedSong = useCallback(
    async (id: string) => {
      if (!isReady) {
        return null;
      }
      return await indexedDB.getSong(id);
    },
    [isReady],
  );

  const searchCachedSongs = useCallback(
    async (query: string) => {
      if (!isReady) {
        return [];
      }
      return await indexedDB.searchCachedSongs(query);
    },
    [isReady],
  );

  return {
    cacheSong,
    getCachedSong,
    searchCachedSongs,
  };
}

// Hook for setlist caching
export function useCachedSetlists() {
  const { isReady } = useIndexedDB();

  const cacheSetlist = useCallback(
    async (setlist: any) => {
      if (!isReady) {
        return;
      }
      await indexedDB.cacheSetlist(setlist);
    },
    [isReady],
  );

  const getCachedSetlist = useCallback(
    async (id: string) => {
      if (!isReady) {
        return null;
      }
      return await indexedDB.getSetlist(id);
    },
    [isReady],
  );

  const getUserSetlists = useCallback(
    async (userId: string) => {
      if (!isReady) {
        return [];
      }
      return await indexedDB.getSetlistsByUser(userId);
    },
    [isReady],
  );

  return {
    cacheSetlist,
    getCachedSetlist,
    getUserSetlists,
  };
}

// Hook for sync queue management
export function useSyncQueue() {
  const { isReady } = useIndexedDB();

  const addToQueue = useCallback(
    async (operation: {
      operation: "create" | "update" | "delete";
      entity: "song" | "setlist" | "preference";
      entityId: string;
      data: any;
    }) => {
      if (!isReady) {
        return;
      }
      await indexedDB.addToSyncQueue(operation);
    },
    [isReady],
  );

  const getPendingItems = useCallback(async () => {
    if (!isReady) {
      return [];
    }
    return await indexedDB.getPendingSyncItems();
  }, [isReady]);

  const updateItemStatus = useCallback(
    async (
      id: string,
      status: "pending" | "processing" | "failed",
      incrementRetries = false,
    ) => {
      if (!isReady) {
        return;
      }
      await indexedDB.updateSyncItemStatus(id, status, incrementRetries);
    },
    [isReady],
  );

  const removeItem = useCallback(
    async (id: string) => {
      if (!isReady) {
        return;
      }
      await indexedDB.removeSyncItem(id);
    },
    [isReady],
  );

  return {
    addToQueue,
    getPendingItems,
    updateItemStatus,
    removeItem,
  };
}

// Hook for user preferences
export function useOfflinePreferences() {
  const { isReady } = useIndexedDB();

  const savePreferences = useCallback(
    async (preferences: {
      userId: string;
      theme: "light" | "dark" | "stage";
      fontSize: number;
      defaultKey?: string;
      notation: "english" | "german" | "latin";
      lastSync: number;
    }) => {
      if (!isReady) {
        return;
      }
      await indexedDB.savePreferences(preferences);
    },
    [isReady],
  );

  const getPreferences = useCallback(
    async (userId: string) => {
      if (!isReady) {
        return null;
      }
      return await indexedDB.getPreferences(userId);
    },
    [isReady],
  );

  return {
    savePreferences,
    getPreferences,
  };
}
