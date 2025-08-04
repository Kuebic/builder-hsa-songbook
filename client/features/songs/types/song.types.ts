import { z } from "zod";

// Zod validation schemas
export const songDetailSchema = z.object({
  slug: z.string().min(1, "Song slug is required"),
});

export const arrangementCreateSchema = z.object({
  name: z.string().min(1).max(200),
  chordData: z.string().min(1, "ChordPro data is required"),
  key: z.enum(['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B']),
  tempo: z.number().min(40).max(200).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate'),
  description: z.string().max(1000).optional(),
  tags: z.array(z.string().max(50)).default([]),
});

// Updated Song interface to match MongoDB schema
export interface Song {
  _id: string;
  title: string;
  artist?: string;
  slug: string;
  chordData: string; // Decompressed ChordPro data
  key?: string;
  tempo?: number;
  timeSignature?: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  themes: string[];
  source: string;
  lyrics?: string;
  notes?: string;
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

// Client-side Song interface (compatible with existing components)
export interface ClientSong {
  id: string; // Maps to _id
  title: string;
  artist?: string;
  slug: string; // Added for slug-based routing
  key?: string;
  tempo?: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  themes: string[];
  viewCount: number; // Maps to metadata.views
  avgRating: number; // Maps to metadata.ratings.average
  basicChords: string[]; // Derived from chordData
  lastUsed?: Date;
  isFavorite: boolean; // Client-side only
  chordData?: string; // Optional for display
  defaultArrangementId?: string; // ID of the default arrangement
}

// Arrangement interface matching MongoDB schema
export interface Arrangement {
  _id: string;
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

// Setlist interface matching MongoDB schema
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

// User interface matching MongoDB schema
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

// Legacy ChordChart interface (for backward compatibility)
export interface ChordChart {
  songId: string;
  content: string;
  capo?: number;
  structure: string[];
}

// Search and filter interfaces
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

export interface ArrangementFilters {
  searchQuery: string;
  songId?: string;
  difficulty?: string;
  key?: string;
  isMashup?: boolean;
  isPublic?: boolean;
}

export interface SetlistFilters {
  searchQuery: string;
  createdBy?: string;
  tags: string[];
  isPublic?: boolean;
  hasDate?: boolean;
}

// API Response types
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
export interface SyncOperation {
  id: string;
  operation: "create" | "update" | "delete";
  entity: "song" | "setlist" | "arrangement" | "user";
  entityId: string;
  data: any;
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

// Extended song interface for detail page
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

// Arrangement with detailed metadata
export interface ArrangementDetail extends Arrangement {
  songs: Pick<Song, '_id' | 'title' | 'artist'>[]; // For mashups
  isDefault: boolean;
  usageInSetlists: number;
  lastUsedDate?: Date;
}

// Comment system
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
    if (/^[A-Za-z0-9+/]{4,}(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(chordPro) && chordPro.length >= 8) {
      actualChordData = atob(chordPro);
    }
  } catch (error) {
    // If decoding fails, use original data
    console.warn('Failed to decode base64 chord data, using raw data');
    actualChordData = chordPro;
  }
  
  const chordRegex = /\[([A-G][#b]?[^/\]]*)\]/g;
  const matches = actualChordData.match(chordRegex);
  
  if (!matches) {
    return [];
  }
  
  const chords = matches
    .map(match => match.slice(1, -1)) // Remove brackets
    .filter((chord, index, array) => array.indexOf(chord) === index) // Remove duplicates
    .slice(0, 5); // Take first 5 unique chords
    
  return chords;
}