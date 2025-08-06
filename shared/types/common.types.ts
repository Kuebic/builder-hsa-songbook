// Common type definitions to replace 'any' usage across the codebase

import { Document, FilterQuery } from "mongoose";

// MongoDB Types
export type MongoFilter<T = Document> = FilterQuery<T>;
export type MongoDocument<T = unknown> = T & Document;

// User types for authorization
export interface AuthUser {
  _id: string;
  role: "USER" | "ADMIN" | "MODERATOR";
  clerkId?: string;
  email: string;
  name: string;
}

// Sync operation types
export interface SyncPayload<T = unknown> {
  entity: string;
  operation: "create" | "update" | "delete";
  entityId: string;
  data: T;
  timestamp: number;
  version?: number;
}

// API Response types
export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

// Transform function types
export type TransformFunction<TInput, TOutput> = (input: TInput) => TOutput;

// Index types for MongoDB
export interface MongoIndex {
  name: string;
  key: Record<string, 1 | -1>;
  unique?: boolean;
  sparse?: boolean;
  background?: boolean;
}

// Stats types
export interface StorageStats {
  totalSongs?: number;
  totalSetlists?: number;
  totalArrangements?: number;
  totalUsers?: number;
  storageUsed?: number;
  lastUpdated?: Date;
}

// Query builder types
export interface QueryOptions {
  sort?: Record<string, 1 | -1>;
  limit?: number;
  skip?: number;
  populate?: string | string[];
}

// Generic ID type
export type EntityId = string | { toString(): string };

// Error with status code
export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "HttpError";
  }
}
