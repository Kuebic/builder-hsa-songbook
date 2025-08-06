import { z } from "zod";

// Zod validation schemas
export const songDetailSchema = z.object({
  slug: z.string().min(1, "Song slug is required"),
});

export const arrangementCreateSchema = z.object({
  name: z.string().min(1).max(200),
  chordData: z.string().min(1, "ChordPro data is required"),
  key: z.enum([
    "C",
    "C#",
    "Db",
    "D",
    "D#",
    "Eb",
    "E",
    "F",
    "F#",
    "Gb",
    "G",
    "G#",
    "Ab",
    "A",
    "A#",
    "Bb",
    "B",
  ]),
  tempo: z.number().min(40).max(200).optional(),
  difficulty: z
    .enum(["beginner", "intermediate", "advanced"])
    .default("intermediate"),
  description: z.string().max(1000).optional(),
  tags: z.array(z.string().max(50)).default([]),
});

/**
 * Core Song interface representing a worship song in the database
 * @interface Song
 */
export interface Song {
  /** MongoDB document ID */
  _id: string;
  /** Song title */
  title: string;
  /** Original artist or composer */
  artist?: string;
  /** URL-friendly identifier */
  slug: string;
  /** Decompressed ChordPro formatted chord data */
  chordData: string;
  /** Musical key (C, D, E, F, G, A, B with sharps/flats) */
  key?: string;
  /** Beats per minute */
  tempo?: number;
  /** Time signature (e.g., "4/4", "3/4") */
  timeSignature?: string;
  /** Difficulty level for musicians */
  difficulty: "beginner" | "intermediate" | "advanced";
  /** Worship themes/categories */
  themes: string[];
  /** Source hymnal or songbook */
  source: string;
  /** Plain text lyrics without chords */
  lyrics?: string;
  /** Additional notes or instructions for musicians */
  notes?: string;
  /** Song metadata including ownership and statistics */
  metadata: {
    createdBy: string;
    isPublic: boolean;
    ratings: {
      average: number;
      count: number;
    };
    views: number;
  };
  documentSize: number;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

/**
 * Client-side Song interface optimized for UI components
 * Maps database fields to frontend-friendly properties
 * @interface ClientSong
 */
export interface ClientSong {
  /** Unique identifier (maps to _id) */
  id: string;
  /** Song title */
  title: string;
  /** Original artist or composer */
  artist?: string;
  /** URL-friendly slug for routing */
  slug: string;
  /** Musical key */
  key?: string;
  /** Beats per minute */
  tempo?: number;
  /** Difficulty level for musicians */
  difficulty: "beginner" | "intermediate" | "advanced";
  /** Worship themes/categories */
  themes: string[];
  /** Number of times viewed (maps to metadata.views) */
  viewCount: number;
  /** Average user rating (maps to metadata.ratings.average) */
  avgRating: number;
  /** List of basic chords used (derived from chordData) */
  basicChords: string[];
  /** Last time this song was used in a setlist */
  lastUsed?: Date;
  /** Whether current user has favorited this song (client-side only) */
  isFavorite: boolean;
  /** ChordPro data (optional for display) */
  chordData?: string;
  /** ID of the default arrangement to display */
  defaultArrangementId?: string;
  /** Additional notes or instructions */
  notes?: string;
}

/**
 * Musical arrangement of a song with chord data and metadata
 * @interface Arrangement
 */
export interface Arrangement {
  _id: string;
  slug: string; // URL-friendly identifier: {song-name}-{random-id}
  name: string;
  songIds: string[]; // ObjectId strings
  createdBy: string;
  chordData: string; // Decompressed ChordPro data
  metadata: {
    key: string;
    capo?: number;
    tempo?: number;
    timeSignature?: string;
    difficulty: "beginner" | "intermediate" | "advanced";
    instruments?: string[];
    isMashup: boolean;
    mashupSections?: Array<{
      songId: string;
      title: string;
      startBar: number;
      endBar: number;
    }>;
  };
  stats: {
    usageCount: number;
    lastUsed?: string; // ISO string
  };
  isPublic: boolean;
  documentSize: number;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

/**
 * Collection of songs organized for a worship service or event
 * @interface Setlist
 */
export interface Setlist {
  _id: string;
  name: string;
  description?: string;
  createdBy: string;
  songs: Array<{
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
    duration?: number;
  };
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

/**
 * User account information and preferences
 * @interface User
 */
export interface User {
  _id: string; // Clerk user ID
  profile: {
    displayName?: string;
    isPublic: boolean;
    publicFields: string[];
  };
  preferences: {
    defaultKey?: string;
    notation: "english" | "german" | "latin";
    fontSize: number;
    theme: "light" | "dark" | "stage";
  };
  stats: {
    songsContributed: number;
    setlistsCreated: number;
    totalDownloads: number;
    lastLoginAt?: string; // ISO string
  };
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

/**
 * Legacy chord chart format (deprecated, use Arrangement instead)
 * @interface ChordChart
 * @deprecated Use Arrangement interface instead
 */
export interface ChordChart {
  songId: string;
  content: string;
  capo?: number;
  structure: string[];
}

/**
 * Filter options for searching and filtering songs
 * @interface SongFilters
 */
export interface SongFilters {
  searchQuery: string;
  key?: string;
  difficulty?: string;
  themes: string[];
  tempo?: {
    min: number;
    max: number;
  };
  isPublic?: boolean;
}

/**
 * Filter options for searching and filtering arrangements
 * @interface ArrangementFilters
 */
export interface ArrangementFilters {
  searchQuery: string;
  songId?: string;
  difficulty?: string;
  key?: string;
  isMashup?: boolean;
  isPublic?: boolean;
}

/**
 * Filter options for searching and filtering setlists
 * @interface SetlistFilters
 */
export interface SetlistFilters {
  searchQuery: string;
  createdBy?: string;
  tags: string[];
  isPublic?: boolean;
  hasDate?: boolean;
}

/**
 * Generic API response wrapper with success/error handling
 * @interface ApiResponse
 * @template T - The type of data returned in the response
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    compressed?: boolean;
    cacheHit?: boolean;
  };
}

// Sync-related types
import type { SyncOperationData } from "../../../../shared/types/api.types";

/**
 * Offline sync operation for data synchronization
 * @interface SyncOperation
 */
export interface SyncOperation {
  id: string;
  operation: "create" | "update" | "delete";
  entity: "song" | "setlist" | "arrangement" | "user";
  entityId: string;
  data: SyncOperationData;
  timestamp: number;
  retries: number;
  status: "pending" | "processing" | "failed" | "synced";
}

// Utility type for transforming MongoDB documents to client format
export type ClientFormat<T> = Omit<T, "_id" | "createdAt" | "updatedAt"> & {
  id: string;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Extended song data with all relationships for detail views
 * @interface SongDetail
 */
export interface SongDetail extends ClientSong {
  source: string;
  lyrics?: string;
  notes?: string;
  ccli?: string;
  year?: number;
  bibleVerses?: Array<{
    reference: string;
    text: string;
    relevance: string;
  }>;
  comments: Comment[];
  totalArrangements: number;
}

/**
 * Extended arrangement with full metadata and relationships
 * @interface ArrangementDetail
 */
export interface ArrangementDetail extends Arrangement {
  songs: Pick<Song, "_id" | "title" | "artist">[]; // For mashups
  isDefault: boolean;
  usageInSetlists: number;
  lastUsedDate?: Date;
  // Additional fields from updated model
  key?: string;
  tempo?: number;
  difficulty?: string;
  genreStyle?: string;
  vocalRange?: {
    low: string;
    high: string;
  };
  metadata: {
    key: string;
    capo?: number;
    tempo?: number;
    timeSignature?: string;
    difficulty: "beginner" | "intermediate" | "advanced";
    instruments?: string[];
    isMashup: boolean;
    mashupSections?: Array<{
      songId: string;
      title: string;
      startBar: number;
      endBar: number;
    }>;
    ratings?: {
      average: number;
      count: number;
    };
    reviewCount?: number;
  };
}

/**
 * User comment on songs or arrangements
 * @interface Comment
 */
export interface Comment {
  _id: string;
  userId: string;
  userDisplayName: string;
  content: string;
  rating?: number; // 1-5 stars
  isHelpful: number; // Vote count
  isReported: boolean;
  createdAt: Date;
  arrangementId?: string; // Optional - arrangement-specific comments
}

/**
 * Bible verse or inspirational quote related to a song
 * @interface Verse
 */
export interface Verse {
  id: string;
  songId: string;
  text: string;
  reference: string; // "Ephesians 2:8-9" or "TF 123:4"
  type: "bible" | "tf" | "tm"; // Bible, Talks from Favorites, The Mission
  userId: string;
  userName: string;
  upvotes: number;
  downvotes: number;
  userVote?: "up" | "down" | null;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Community discussion comment on a song
 * @interface SongComment
 */
export interface SongComment {
  id: string;
  songId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  parentId?: string; // For nested replies
  upvotes: number;
  isReported: boolean;
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Arrangement with engagement metrics and social proof
 * @interface ArrangementWithMetrics
 */
export interface ArrangementWithMetrics extends ArrangementDetail {
  favoriteCount: number;
  setlistCount: number;
  rating: {
    average: number;
    count: number;
  };
  reviews: ArrangementReview[];
  capo?: number;
}

/**
 * User review and rating for an arrangement
 * @interface ArrangementReview
 */
export interface ArrangementReview {
  id: string;
  arrangementId: string;
  userId: string;
  userName: string;
  rating: number; // 1-5 stars
  comment?: string;
  helpfulCount: number;
  createdAt: Date;
}

/**
 * Complete song data with all related entities for detail page
 * @interface SongWithRelations
 */
export interface SongWithRelations extends Omit<SongDetail, "comments"> {
  compositionYear?: number;
  ccli?: string;
  favoriteCount: number;
  isFavorited: boolean;
  verses: Verse[];
  arrangements: ArrangementWithMetrics[];
  comments: SongComment[];
}

// Form schemas for new features
export const verseSubmitSchema = z.object({
  text: z.string().min(1, "Verse text is required").max(500),
  reference: z.string().min(1, "Reference is required").max(100),
  type: z.enum(["bible", "tf", "tm"]),
});

export const songCommentSchema = z.object({
  content: z.string().min(1, "Comment is required").max(1000),
  parentId: z.string().optional(),
});

export const arrangementReviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().max(500).optional(),
});

// Transform functions
export function songToClientFormat(song: Song): ClientSong {
  // Extract basic chords from ChordPro data (simplified)
  const basicChords = extractChordsFromChordPro(song.chordData);

  return {
    id: song._id,
    title: song.title,
    artist: song.artist,
    slug: song.slug,
    key: song.key,
    tempo: song.tempo,
    difficulty: song.difficulty,
    themes: song.themes,
    viewCount: song.metadata.views,
    avgRating: song.metadata.ratings.average,
    basicChords,
    lastUsed: undefined, // Client-side only
    isFavorite: false, // Client-side only
    chordData: song.chordData,
  };
}

// Helper function to extract chords from ChordPro data
function extractChordsFromChordPro(chordPro: string): string[] {
  if (!chordPro) {
    return [];
  }

  // Check if the chordData is base64 encoded (proper base64 pattern validation)
  let actualChordData = chordPro;
  try {
    // More accurate Base64 validation: ensures proper length and padding
    if (
      /^[A-Za-z0-9+/]{4,}(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
        chordPro,
      ) &&
      chordPro.length >= 8
    ) {
      actualChordData = atob(chordPro);
    }
  } catch {
    // If decoding fails, use original data
    console.warn("Failed to decode base64 chord data, using raw data");
    actualChordData = chordPro;
  }

  const chordRegex = /\[([A-G][#b]?[^/\]]*)\]/g;
  const matches = actualChordData.match(chordRegex);

  if (!matches) {
    return [];
  }

  const chords = matches
    .map((match) => match.slice(1, -1)) // Remove brackets
    .filter((chord, index, array) => array.indexOf(chord) === index) // Remove duplicates
    .slice(0, 5); // Take first 5 unique chords

  return chords;
}
