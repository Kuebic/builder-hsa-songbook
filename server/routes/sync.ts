import { Request, Response } from "express";
import { Song, Setlist, Arrangement, User } from "../database/models";
import { z } from "zod";

// Validation schemas
const syncOperationSchema = z.object({
  id: z.string(),
  operation: z.enum(["create", "update", "delete"]),
  entity: z.enum(["song", "setlist", "arrangement", "user"]),
  entityId: z.string(),
  data: z.any(),
  timestamp: z.number(),
  clientId: z.string().optional(),
});

const batchSyncSchema = z.object({
  operations: z.array(syncOperationSchema).max(50), // Limit batch size
  clientLastSync: z.number().optional(),
});

// Batch sync endpoint - processes multiple operations
export async function batchSync(req: Request, res: Response) {
  try {
    const { operations, clientLastSync } = batchSyncSchema.parse(req.body);
    
    const results = [];
    const conflicts = [];
    
    // Process each operation
    for (const operation of operations) {
      try {
        const result = await processSyncOperation(operation);
        results.push({
          operationId: operation.id,
          success: true,
          result,
        });
      } catch (error) {
        console.error("Sync operation failed:", operation, error);
        
        // Check if it's a conflict
        if (error instanceof ConflictError) {
          conflicts.push({
            operationId: operation.id,
            type: "conflict",
            serverData: error.serverData,
            clientData: operation.data,
            lastModified: error.lastModified,
          });
        } else {
          results.push({
            operationId: operation.id,
            success: false,
            error: {
              code: "SYNC_FAILED",
              message: error instanceof Error ? error.message : "Unknown error",
            },
          });
        }
      }
    }

    // Get server changes since client's last sync
    const serverChanges = clientLastSync 
      ? await getServerChangesSince(clientLastSync)
      : [];

    res.json({
      success: true,
      data: {
        results,
        conflicts,
        serverChanges,
        serverTimestamp: Date.now(),
      },
    });

  } catch (error) {
    console.error("Batch sync error:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid sync data",
          details: error.errors,
        },
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Batch sync failed",
      },
    });
  }
}

// Get sync status for pending operations
export async function getSyncStatus(req: Request, res: Response) {
  try {
    const { operationIds } = req.query;
    
    if (!operationIds || typeof operationIds !== "string") {
      return res.status(400).json({
        success: false,
        error: {
          code: "MISSING_OPERATION_IDS",
          message: "Operation IDs are required",
        },
      });
    }

    const ids = operationIds.split(",");
    
    // For now, we'll just return a simple status since we don't store
    // operation states on the server (they're processed immediately)
    const statuses = ids.map(id => ({
      operationId: id,
      status: "processed", // or "not_found"
      timestamp: Date.now(),
    }));

    res.json({
      success: true,
      data: { statuses },
    });

  } catch (error) {
    console.error("Error fetching sync status:", error);
    
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch sync status",
      },
    });
  }
}

// Resolve conflicts endpoint
export async function resolveConflicts(req: Request, res: Response) {
  try {
    const { resolutions } = req.body;
    
    if (!Array.isArray(resolutions)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_RESOLUTIONS",
          message: "Resolutions must be an array",
        },
      });
    }

    const results = [];
    
    for (const resolution of resolutions) {
      const { operationId, choice, data } = resolution;
      
      try {
        let result;
        
        if (choice === "client") {
          // Apply client version
          result = await processSyncOperation({
            id: operationId,
            operation: "update",
            entity: resolution.entity,
            entityId: resolution.entityId,
            data,
            timestamp: Date.now(),
          });
        } else if (choice === "server") {
          // Keep server version (no action needed)
          result = { message: "Server version kept" };
        } else if (choice === "merge") {
          // Apply merged data
          result = await processSyncOperation({
            id: operationId,
            operation: "update",
            entity: resolution.entity,
            entityId: resolution.entityId,
            data,
            timestamp: Date.now(),
          });
        }
        
        results.push({
          operationId,
          success: true,
          result,
        });
        
      } catch (error) {
        results.push({
          operationId,
          success: false,
          error: {
            code: "RESOLUTION_FAILED",
            message: error instanceof Error ? error.message : "Unknown error",
          },
        });
      }
    }

    res.json({
      success: true,
      data: { results },
    });

  } catch (error) {
    console.error("Error resolving conflicts:", error);
    
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to resolve conflicts",
      },
    });
  }
}

// Helper function to process individual sync operations
async function processSyncOperation(operation: z.infer<typeof syncOperationSchema>) {
  const { entity, operation: op, entityId, data } = operation;
  
  switch (entity) {
    case "song":
      return await processSongSync(op, entityId, data);
    case "setlist":
      return await processSetlistSync(op, entityId, data);
    case "arrangement":
      return await processArrangementSync(op, entityId, data);
    case "user":
      return await processUserSync(op, entityId, data);
    default:
      throw new Error(`Unknown entity type: ${entity}`);
  }
}

// Song sync operations
async function processSongSync(operation: string, entityId: string, data: any) {
  switch (operation) {
    case "create": {
      const song = new Song(data);
      await song.save();
      return song;
    }
      
    case "update": {
      const existingSong = await Song.findById(entityId);
      if (!existingSong) {
        throw new Error("Song not found");
      }
      
      // Check for conflicts (last-write-wins for now)
      const serverModified = new Date(existingSong.updatedAt).getTime();
      const clientModified = new Date(data.updatedAt).getTime();
      
      if (serverModified > clientModified) {
        throw new ConflictError(existingSong, serverModified);
      }
      
      Object.assign(existingSong, data);
      await existingSong.save();
      return existingSong;
    }
      
    case "delete": {
      await Song.findByIdAndDelete(entityId);
      return { deleted: true };
    }
      
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}

// Setlist sync operations
async function processSetlistSync(operation: string, entityId: string, data: any) {
  switch (operation) {
    case "create": {
      const setlist = new Setlist(data);
      await setlist.save();
      return setlist;
    }
      
    case "update": {
      const existingSetlist = await Setlist.findById(entityId);
      if (!existingSetlist) {
        throw new Error("Setlist not found");
      }
      
      // Check for conflicts
      const serverModified = new Date(existingSetlist.updatedAt).getTime();
      const clientModified = new Date(data.updatedAt).getTime();
      
      if (serverModified > clientModified) {
        throw new ConflictError(existingSetlist, serverModified);
      }
      
      Object.assign(existingSetlist, data);
      await existingSetlist.save();
      return existingSetlist;
    }
      
    case "delete": {
      await Setlist.findByIdAndDelete(entityId);
      return { deleted: true };
    }
      
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}

// Arrangement sync operations
async function processArrangementSync(operation: string, entityId: string, data: any) {
  switch (operation) {
    case "create": {
      const arrangement = new Arrangement(data);
      await arrangement.save();
      return arrangement;
    }
      
    case "update": {
      const existingArrangement = await Arrangement.findById(entityId);
      if (!existingArrangement) {
        throw new Error("Arrangement not found");
      }
      
      // Check for conflicts
      const serverModified = new Date(existingArrangement.updatedAt).getTime();
      const clientModified = new Date(data.updatedAt).getTime();
      
      if (serverModified > clientModified) {
        throw new ConflictError(existingArrangement, serverModified);
      }
      
      Object.assign(existingArrangement, data);
      await existingArrangement.save();
      return existingArrangement;
    }
      
    case "delete": {
      await Arrangement.findByIdAndDelete(entityId);
      return { deleted: true };
    }
      
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}

// User sync operations
async function processUserSync(operation: string, entityId: string, data: any) {
  switch (operation) {
    case "create": {
      const user = new User({ _id: entityId, ...data });
      await user.save();
      return user;
    }
      
    case "update": {
      const existingUser = await User.findById(entityId);
      if (!existingUser) {
        // Create user if it doesn't exist (common for Clerk users)
        const newUser = new User({ _id: entityId, ...data });
        await newUser.save();
        return newUser;
      }
      
      Object.assign(existingUser, data);
      await existingUser.save();
      return existingUser;
    }
      
    case "delete": {
      await User.findByIdAndDelete(entityId);
      return { deleted: true };
    }
      
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}

// Get server changes since a timestamp
async function getServerChangesSince(timestamp: number): Promise<any[]> {
  const since = new Date(timestamp);
  
  const [songs, setlists, arrangements] = await Promise.all([
    Song.find({ updatedAt: { $gt: since } }).lean(),
    Setlist.find({ updatedAt: { $gt: since } }).lean(),
    Arrangement.find({ updatedAt: { $gt: since } }).lean(),
  ]);

  return [
    ...songs.map(song => ({ entity: "song", data: song })),
    ...setlists.map(setlist => ({ entity: "setlist", data: setlist })),
    ...arrangements.map(arrangement => ({ entity: "arrangement", data: arrangement })),
  ];
}

// Custom error class for conflicts
class ConflictError extends Error {
  constructor(
    public serverData: any,
    public lastModified: number,
  ) {
    super("Data conflict detected");
    this.name = "ConflictError";
  }
}