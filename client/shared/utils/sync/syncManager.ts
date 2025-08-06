import { indexedDB } from "../indexeddb/database";

export interface SyncOperation {
  id: string;
  operation: "create" | "update" | "delete";
  entity: "song" | "setlist" | "preference";
  entityId: string;
  data: any;
  timestamp: number;
  retries: number;
  status: "pending" | "processing" | "failed" | "synced";
}

export class SyncManager {
  private static instance: SyncManager;
  private isProcessing = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private maxRetries = 3;
  private retryDelay = 5000; // 5 seconds

  private constructor() {}

  public static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager();
    }
    return SyncManager.instance;
  }

  // Add operation to sync queue
  async addOperation(
    operation: Omit<SyncOperation, "id" | "timestamp" | "retries" | "status">,
  ): Promise<void> {
    try {
      await indexedDB.addToSyncQueue(operation);
      console.log(
        `🔄 Added to sync queue: ${operation.operation} ${operation.entity}`,
      );

      // Try to process immediately if online
      this.processSyncQueue();
    } catch (error) {
      console.error("Failed to add operation to sync queue:", error);
    }
  }

  // Start automatic sync processing
  startAutoSync(): void {
    if (this.syncInterval) {
      return;
    }

    // Process sync queue every 30 seconds
    this.syncInterval = setInterval(() => {
      this.processSyncQueue();
    }, 30000);

    console.log("🔄 Auto-sync started");
  }

  // Stop automatic sync processing
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    console.log("⏹️ Auto-sync stopped");
  }

  // Process all pending operations in sync queue
  async processSyncQueue(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    // Check network status
    if (!navigator.onLine) {
      console.log("📴 Offline - skipping sync");
      return;
    }

    try {
      this.isProcessing = true;
      const pendingItems = await indexedDB.getPendingSyncItems();

      if (pendingItems.length === 0) {
        return;
      }

      console.log(`🔄 Processing ${pendingItems.length} sync operations`);

      // Group operations by entity for batch processing
      const batches = this.groupOperationsByEntity(pendingItems);

      for (const [entity, operations] of batches) {
        await this.processBatch(entity, operations);
      }
    } catch (error) {
      console.error("Sync queue processing failed:", error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Group operations by entity type for efficient batch processing
  private groupOperationsByEntity(
    operations: SyncOperation[],
  ): Map<string, SyncOperation[]> {
    const batches = new Map<string, SyncOperation[]>();

    for (const operation of operations) {
      const key = operation.entity;
      if (!batches.has(key)) {
        batches.set(key, []);
      }
      batches.get(key)!.push(operation);
    }

    return batches;
  }

  // Process a batch of operations for a specific entity
  private async processBatch(
    entity: string,
    operations: SyncOperation[],
  ): Promise<void> {
    try {
      // Mark all operations as processing
      for (const operation of operations) {
        await indexedDB.updateSyncItemStatus(operation.id, "processing");
      }

      // Send batch to server
      const response = await this.sendBatchToServer(operations);

      if (response.success) {
        await this.handleBatchSuccess(operations, response.data);
      } else {
        await this.handleBatchError(operations, response.error);
      }
    } catch (error) {
      console.error(`Batch processing failed for ${entity}:`, error);
      await this.handleBatchError(operations, error);
    }
  }

  // Send batch of operations to server
  private async sendBatchToServer(operations: SyncOperation[]): Promise<any> {
    const batchData = {
      operations: operations.map((op) => ({
        id: op.id,
        operation: op.operation,
        entity: op.entity,
        entityId: op.entityId,
        data: op.data,
        timestamp: op.timestamp,
      })),
      clientLastSync: await this.getLastSyncTimestamp(),
    };

    const response = await fetch("/api/sync/batch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(batchData),
    });

    return await response.json();
  }

  // Handle successful batch processing
  private async handleBatchSuccess(
    operations: SyncOperation[],
    responseData: any,
  ): Promise<void> {
    const { results, conflicts, serverChanges } = responseData;

    // Process results
    for (const result of results) {
      const operation = operations.find((op) => op.id === result.operationId);
      if (!operation) {
        continue;
      }

      if (result.success) {
        // Remove successful operation from queue
        await indexedDB.removeSyncItem(operation.id);
        console.log(`✅ Synced: ${operation.operation} ${operation.entity}`);
      } else {
        // Handle failed operation
        await this.handleOperationFailure(operation, result.error);
      }
    }

    // Handle conflicts
    if (conflicts && conflicts.length > 0) {
      await this.handleConflicts(conflicts);
    }

    // Apply server changes
    if (serverChanges && serverChanges.length > 0) {
      await this.applyServerChanges(serverChanges);
    }

    // Update last sync timestamp
    await this.setLastSyncTimestamp(responseData.serverTimestamp);
  }

  // Handle batch processing errors
  private async handleBatchError(
    operations: SyncOperation[],
    error: any,
  ): Promise<void> {
    for (const operation of operations) {
      await this.handleOperationFailure(operation, error);
    }
  }

  // Handle individual operation failure
  private async handleOperationFailure(
    operation: SyncOperation,
    error: any,
  ): Promise<void> {
    const newRetryCount = operation.retries + 1;

    if (newRetryCount >= this.maxRetries) {
      // Max retries reached - mark as failed
      await indexedDB.updateSyncItemStatus(operation.id, "failed");
      console.error(
        `❌ Max retries reached for ${operation.operation} ${operation.entity}:`,
        error,
      );
    } else {
      // Retry later
      await indexedDB.updateSyncItemStatus(operation.id, "pending", true);
      console.warn(
        `⚠️ Retry ${newRetryCount}/${this.maxRetries} for ${operation.operation} ${operation.entity}`,
      );

      // Schedule retry with exponential backoff
      setTimeout(() => {
        this.processSyncQueue();
      }, this.retryDelay * newRetryCount);
    }
  }

  // Handle data conflicts
  private async handleConflicts(conflicts: any[]): Promise<void> {
    console.warn(`⚠️ ${conflicts.length} conflicts detected`);

    // For now, implement last-write-wins conflict resolution
    // In a real app, you'd want to present conflicts to the user
    for (const conflict of conflicts) {
      try {
        // Auto-resolve by keeping server version (safest default)
        await this.resolveConflict(
          conflict.operationId,
          "server",
          conflict.serverData,
        );
      } catch (error) {
        console.error("Failed to resolve conflict:", error);
      }
    }
  }

  // Resolve a conflict with a specific resolution
  private async resolveConflict(
    operationId: string,
    choice: "client" | "server" | "merge",
    data?: any,
  ): Promise<void> {
    const resolution = {
      operationId,
      choice,
      data,
    };

    const response = await fetch("/api/sync/resolve", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ resolutions: [resolution] }),
    });

    const result = await response.json();

    if (result.success) {
      console.log(`✅ Conflict resolved: ${operationId}`);
    } else {
      console.error(
        `❌ Failed to resolve conflict: ${operationId}`,
        result.error,
      );
    }
  }

  // Apply server changes to local storage
  private async applyServerChanges(serverChanges: any[]): Promise<void> {
    for (const change of serverChanges) {
      try {
        switch (change.entity) {
          case "song":
            await indexedDB.cacheSong(change.data);
            break;
          case "setlist":
            await indexedDB.cacheSetlist(change.data);
            break;
          // Add other entity types as needed
        }
        console.log(`📥 Applied server change: ${change.entity}`);
      } catch (error) {
        console.error("Failed to apply server change:", error);
      }
    }
  }

  // Get last sync timestamp
  private async getLastSyncTimestamp(): Promise<number> {
    // This would typically be stored in user preferences or a separate store
    // For now, return a default timestamp
    return Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago
  }

  // Set last sync timestamp
  private async setLastSyncTimestamp(timestamp: number): Promise<void> {
    // Store timestamp for future sync operations
    console.log(`📅 Last sync updated: ${new Date(timestamp).toISOString()}`);
  }

  // Get sync queue status
  async getSyncStatus(): Promise<{
    pendingCount: number;
    failedCount: number;
    isProcessing: boolean;
    lastSync?: number;
  }> {
    const pendingItems = await indexedDB.getPendingSyncItems();
    const pendingCount = pendingItems.filter(
      (item) => item.status === "pending",
    ).length;
    const failedCount = pendingItems.filter(
      (item) => item.status === "failed",
    ).length;

    return {
      pendingCount,
      failedCount,
      isProcessing: this.isProcessing,
      lastSync: await this.getLastSyncTimestamp(),
    };
  }

  // Retry failed operations
  async retryFailedOperations(): Promise<void> {
    const pendingItems = await indexedDB.getPendingSyncItems();
    const failedItems = pendingItems.filter((item) => item.status === "failed");

    for (const item of failedItems) {
      // Reset to pending with retry count reset
      await indexedDB.updateSyncItemStatus(item.id, "pending");
    }

    console.log(`🔄 Retrying ${failedItems.length} failed operations`);
    await this.processSyncQueue();
  }

  // Clear all sync queue items (useful for testing or reset)
  async clearSyncQueue(): Promise<void> {
    const pendingItems = await indexedDB.getPendingSyncItems();

    for (const item of pendingItems) {
      await indexedDB.removeSyncItem(item.id);
    }

    console.log("🗑️ Sync queue cleared");
  }
}

// Export singleton instance
export const syncManager = SyncManager.getInstance();
