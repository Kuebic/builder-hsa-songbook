// Common API types shared between client and server

// Database status for health checks
export interface DatabaseStatus {
  connected: boolean;
  host?: string;
  name?: string;
  version?: string;
  collections?: number;
  documents?: number;
  size?: number;
}

// Health check response
export interface HealthCheckResponse {
  status: string;
  database: DatabaseStatus;
  timestamp?: string;
  uptime?: number;
}

// Common error details
export interface ErrorDetails {
  field?: string;
  message?: string;
  code?: string;
  [key: string]: unknown;
}

// API Error response
export interface ApiError {
  code: string;
  message: string;
  details?: ErrorDetails | Record<string, unknown>;
}

// Generic API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMetadata;
}

// API Metadata for pagination and caching
export interface ApiMetadata {
  total?: number;
  page?: number;
  limit?: number;
  compressed?: boolean;
  cacheHit?: boolean;
  processingTime?: number;
}

// Sync operation data types
export interface SyncOperationData {
  // Song sync data
  song?: {
    title: string;
    artist?: string;
    chordData: string;
    key?: string;
    tempo?: number;
    difficulty: string;
    themes: string[];
    notes?: string;
  };
  // Setlist sync data
  setlist?: {
    name: string;
    description?: string;
    songs: Array<{
      arrangementId: string;
      transposeBy: number;
      notes?: string;
      order: number;
    }>;
    tags: string[];
  };
  // Arrangement sync data
  arrangement?: {
    name: string;
    songIds: string[];
    chordData: string;
    metadata: Record<string, unknown>;
  };
  // User preferences sync data
  user?: {
    preferences: {
      defaultKey?: string;
      notation: string;
      fontSize: number;
      theme: string;
    };
    profile: {
      displayName?: string;
      isPublic: boolean;
    };
  };
}

// Filter types for database queries
export interface QueryFilter {
  [key: string]:
    | string
    | number
    | boolean
    | undefined
    | QueryFilter
    | QueryFilter[]
    | RegExp
    | RegExp[]
    | { [operator: string]: unknown };
  $or?: QueryFilter[];
  $and?: QueryFilter[];
  $text?: { $search: string };
}

// Sort criteria
export interface SortCriteria {
  [field: string]: 1 | -1 | "asc" | "desc" | { $meta: string };
}

// Pagination options
export interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
  sort?: SortCriteria;
}

// User role permissions
export type UserRole = "USER" | "ADMIN" | "MODERATOR";

// Permission check result
export interface PermissionCheck {
  allowed: boolean;
  reason?: string;
  requiredRole?: UserRole;
}
