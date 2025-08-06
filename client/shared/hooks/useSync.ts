import { useState, useEffect, useCallback } from "react";
import { syncManager, SyncOperation } from "../utils/sync/syncManager";
import { useNetworkContext } from "../contexts/NetworkContext";

interface UseSyncReturn {
  syncStatus: {
    pendingCount: number;
    failedCount: number;
    isProcessing: boolean;
    lastSync?: number;
  };
  addToSyncQueue: (
    operation: Omit<SyncOperation, "id" | "timestamp" | "retries" | "status">,
  ) => Promise<void>;
  forcSync: () => Promise<void>;
  retryFailed: () => Promise<void>;
  clearQueue: () => Promise<void>;
  isOnline: boolean;
}

export function useSync(): UseSyncReturn {
  const { isOnline } = useNetworkContext();
  const [syncStatus, setSyncStatus] = useState<{
    pendingCount: number;
    failedCount: number;
    isProcessing: boolean;
    lastSync?: number;
  }>({
    pendingCount: 0,
    failedCount: 0,
    isProcessing: false,
  });

  // Update sync status
  const updateSyncStatus = useCallback(async () => {
    try {
      const status = await syncManager.getSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error("Failed to get sync status:", error);
    }
  }, []);

  // Add operation to sync queue
  const addToSyncQueue = useCallback(
    async (
      operation: Omit<SyncOperation, "id" | "timestamp" | "retries" | "status">,
    ) => {
      await syncManager.addOperation(operation);
      await updateSyncStatus();
    },
    [updateSyncStatus],
  );

  // Force sync
  const forcSync = useCallback(async () => {
    await syncManager.processSyncQueue();
    await updateSyncStatus();
  }, [updateSyncStatus]);

  // Retry failed operations
  const retryFailed = useCallback(async () => {
    await syncManager.retryFailedOperations();
    await updateSyncStatus();
  }, [updateSyncStatus]);

  // Clear sync queue
  const clearQueue = useCallback(async () => {
    await syncManager.clearSyncQueue();
    await updateSyncStatus();
  }, [updateSyncStatus]);

  // Start/stop auto-sync based on network status
  useEffect(() => {
    if (isOnline) {
      syncManager.startAutoSync();
    } else {
      syncManager.stopAutoSync();
    }

    return () => {
      syncManager.stopAutoSync();
    };
  }, [isOnline]);

  // Update sync status periodically
  useEffect(() => {
    // Initial status check
    updateSyncStatus();

    // Update status every 10 seconds
    const interval = setInterval(updateSyncStatus, 10000);

    return () => clearInterval(interval);
  }, [updateSyncStatus]);

  // Process sync queue when coming back online
  useEffect(() => {
    if (isOnline) {
      // Small delay to ensure network is stable
      setTimeout(() => {
        syncManager.processSyncQueue();
      }, 1000);
    }
  }, [isOnline]);

  return {
    syncStatus,
    addToSyncQueue,
    forcSync,
    retryFailed,
    clearQueue,
    isOnline,
  };
}

// Hook for quick access to sync queue operations
export function useSyncOperations() {
  const { addToSyncQueue } = useSync();

  const syncCreateSong = useCallback(
    async (songData: any) => {
      await addToSyncQueue({
        operation: "create",
        entity: "song",
        entityId: songData._id || `temp_${Date.now()}`,
        data: songData,
      });
    },
    [addToSyncQueue],
  );

  const syncUpdateSong = useCallback(
    async (songId: string, songData: any) => {
      await addToSyncQueue({
        operation: "update",
        entity: "song",
        entityId: songId,
        data: songData,
      });
    },
    [addToSyncQueue],
  );

  const syncDeleteSong = useCallback(
    async (songId: string) => {
      await addToSyncQueue({
        operation: "delete",
        entity: "song",
        entityId: songId,
        data: { id: songId },
      });
    },
    [addToSyncQueue],
  );

  const syncCreateSetlist = useCallback(
    async (setlistData: any) => {
      await addToSyncQueue({
        operation: "create",
        entity: "setlist",
        entityId: setlistData._id || `temp_${Date.now()}`,
        data: setlistData,
      });
    },
    [addToSyncQueue],
  );

  const syncUpdateSetlist = useCallback(
    async (setlistId: string, setlistData: any) => {
      await addToSyncQueue({
        operation: "update",
        entity: "setlist",
        entityId: setlistId,
        data: setlistData,
      });
    },
    [addToSyncQueue],
  );

  const syncDeleteSetlist = useCallback(
    async (setlistId: string) => {
      await addToSyncQueue({
        operation: "delete",
        entity: "setlist",
        entityId: setlistId,
        data: { id: setlistId },
      });
    },
    [addToSyncQueue],
  );

  return {
    syncCreateSong,
    syncUpdateSong,
    syncDeleteSong,
    syncCreateSetlist,
    syncUpdateSetlist,
    syncDeleteSetlist,
  };
}
