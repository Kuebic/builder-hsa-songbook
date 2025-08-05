// MongoDB and Mongoose type definitions
import { Document, Types } from 'mongoose';

// Base MongoDB document interface
export interface MongoDocument extends Document {
  _id: Types.ObjectId | string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Song document from MongoDB (metadata only - chord data is in Arrangements)
export interface SongDocument extends MongoDocument {
  title: string;
  artist?: string;
  slug: string;
  compositionYear?: number;
  ccli?: string;
  themes: string[];
  source?: string;
  lyrics?: string;
  notes?: string;
  defaultArrangement?: Types.ObjectId | string; // Reference to default Arrangement
  metadata: {
    createdBy: Types.ObjectId | string;
    lastModifiedBy?: Types.ObjectId | string;
    isPublic: boolean;
    ratings: {
      average: number;
      count: number;
    };
    views: number;
  };
  documentSize: number;
}

// Arrangement document from MongoDB
export interface ArrangementDocument extends MongoDocument {
  name: string;
  songIds: Types.ObjectId[] | string[];
  createdBy: Types.ObjectId | string;
  chordData: Buffer | string;
  key?: string;
  tempo?: number;
  timeSignature?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  description?: string;
  tags: string[];
  metadata: {
    isMashup: boolean;
    mashupSections?: Array<{
      songId: Types.ObjectId | string;
      title: string;
      startBar?: number;
      endBar?: number;
    }>;
    isPublic: boolean;
    ratings?: {
      average: number;
      count: number;
    };
    views: number;
  };
  documentSize: number;
}

// Setlist document from MongoDB
export interface SetlistDocument extends MongoDocument {
  name: string;
  description?: string;
  createdBy: Types.ObjectId | string;
  songs: Array<{
    songId?: Types.ObjectId | string;
    arrangementId?: Types.ObjectId | string;
    transposeBy: number;
    notes?: string;
    order: number;
  }>;
  tags: string[];
  metadata: {
    date?: Date;
    venue?: string;
    isPublic: boolean;
    shareToken?: string;
    duration?: number;
  };
}

// Review document from MongoDB
export interface ReviewDocument extends MongoDocument {
  arrangementId: Types.ObjectId | string;
  userId: Types.ObjectId | string;
  userDisplayName: string;
  rating: number; // 1-5
  comment?: string;
  helpfulVotes: string[]; // Array of user IDs
  reportedBy: string[]; // Array of user IDs
  reportReason?: string;
  isPublic: boolean;
}

// Verse document from MongoDB
export interface VerseDocument extends MongoDocument {
  songId: Types.ObjectId | string;
  reference: string;
  text: string;
  relevance: string;
  submittedBy: Types.ObjectId | string;
  upvotes: string[]; // Array of user IDs
  isApproved: boolean;
  approvedBy?: Types.ObjectId | string;
  approvedAt?: Date;
}

// User document from MongoDB
export interface UserDocument extends MongoDocument {
  clerkId: string;
  email: string;
  name?: string;
  role: 'USER' | 'ADMIN' | 'MODERATOR';
  preferences: {
    defaultKey?: string;
    fontSize: number;
    theme: 'light' | 'dark' | 'stage';
  };
  profile: {
    bio?: string;
    website?: string;
    location?: string;
  };
  stats: {
    songsCreated: number;
    arrangementsCreated: number;
    setlistsCreated: number;
  };
  isActive: boolean;
  lastLoginAt?: Date;
}

// MongoDB index definition
export interface MongoIndex {
  name: string;
  key: Record<string, 1 | -1 | 'text'>;
  unique?: boolean;
  sparse?: boolean;
  background?: boolean;
  expireAfterSeconds?: number;
}

// Query builder types
export interface MongoQuery<T = unknown> {
  filter: Partial<T>;
  projection?: Record<string, 0 | 1>;
  options?: {
    limit?: number;
    skip?: number;
    sort?: Record<string, 1 | -1>;
    populate?: string | string[];
  };
}

// Aggregation pipeline stage
export interface AggregationStage {
  [operator: string]: unknown;
}