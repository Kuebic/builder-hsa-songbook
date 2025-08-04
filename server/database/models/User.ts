import { Schema, model, Document, Types, Model } from "mongoose";

// Musical key enum for consistency
export type MusicalKey = 'C' | 'C#' | 'Db' | 'D' | 'D#' | 'Eb' | 'E' | 'F' | 'F#' | 'Gb' | 'G' | 'G#' | 'Ab' | 'A' | 'A#' | 'Bb' | 'B';

// Interface for User document - Updated per PRD specifications
export interface IUser extends Document {
  _id: Types.ObjectId;
  clerkId?: string; // Optional until Clerk integration
  email: string; // Unique, lowercase, trimmed
  name: string; // Max 100 characters
  role: 'USER' | 'ADMIN' | 'MODERATOR';
  preferences: {
    defaultKey?: MusicalKey;
    fontSize: number; // 12-32px range
    theme: 'light' | 'dark' | 'stage';
  };
  profile: {
    bio?: string; // Max 500 characters
    website?: string; // Max 200 characters
    location?: string; // Max 100 characters
  };
  favorites: Types.ObjectId[]; // Array of song IDs user has favorited
  stats: {
    songsCreated: number;
    arrangementsCreated: number;
    setlistsCreated: number;
  };
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  incrementSongCount(): Promise<IUser>;
  incrementArrangementCount(): Promise<IUser>;
  incrementSetlistCount(): Promise<IUser>;
  updateLastLogin(): Promise<IUser>;
  deactivate(): Promise<IUser>;
  activate(): Promise<IUser>;
  addFavorite(songId: string | Types.ObjectId): Promise<IUser>;
  removeFavorite(songId: string | Types.ObjectId): Promise<IUser>;
  isFavoriteSong(songId: string | Types.ObjectId): boolean;
  getFavorites(): Types.ObjectId[];
}

// Interface for User model (static methods)
export interface IUserModel extends Model<IUser> {
  findActiveUsers(limit?: number): Promise<IUser[]>;
  getTopContributors(limit?: number): Promise<IUser[]>;
  findByEmail(email: string): Promise<IUser | null>;
  findByClerkId(clerkId: string): Promise<IUser | null>;
}

// Create the schema - Updated per PRD specifications
const userSchema = new Schema<IUser>({
  clerkId: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    maxlength: 254, // Standard email length limit
  },
  name: {
    type: String,
    required: true,
    maxlength: 100,
    trim: true,
  },
  role: {
    type: String,
    enum: ['USER', 'ADMIN', 'MODERATOR'],
    default: 'USER',
  },
  preferences: {
    defaultKey: {
      type: String,
      enum: ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'],
    },
    fontSize: {
      type: Number,
      min: 12,
      max: 32,
      default: 16,
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'stage'],
      default: 'light',
    },
  },
  profile: {
    bio: {
      type: String,
      maxlength: 500,
      trim: true,
    },
    website: {
      type: String,
      maxlength: 200,
      trim: true,
    },
    location: {
      type: String,
      maxlength: 100,
      trim: true,
    },
  },
  favorites: [{
    type: Schema.Types.ObjectId,
    ref: 'Song',
    index: true,
  }],
  stats: {
    songsCreated: {
      type: Number,
      default: 0,
      min: 0,
    },
    arrangementsCreated: {
      type: Number,
      default: 0,
      min: 0,
    },
    setlistsCreated: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLoginAt: {
    type: Date,
  },
}, {
  timestamps: true,
  collection: "users",
});

// Indexes - Updated per PRD specifications
userSchema.index({ email: 1, isActive: 1 }, { unique: true }); // Auth lookups with email uniqueness
userSchema.index({ clerkId: 1 }, { sparse: true, unique: true }); // Clerk integration (sparse allows nulls, unique when present)
userSchema.index({ role: 1, isActive: 1 }); // Admin queries
userSchema.index({ "stats.songsCreated": -1 }); // Leaderboards
userSchema.index({ lastLoginAt: -1 }); // Activity tracking

// Utility methods - Updated for new schema
userSchema.methods.incrementSongCount = function () {
  this.stats.songsCreated += 1;
  return this.save();
};

userSchema.methods.incrementArrangementCount = function () {
  this.stats.arrangementsCreated += 1;
  return this.save();
};

userSchema.methods.incrementSetlistCount = function () {
  this.stats.setlistsCreated += 1;
  return this.save();
};

userSchema.methods.updateLastLogin = function () {
  this.lastLoginAt = new Date();
  return this.save();
};

userSchema.methods.deactivate = function () {
  this.isActive = false;
  return this.save();
};

userSchema.methods.activate = function () {
  this.isActive = true;
  return this.save();
};

// Favorites methods
userSchema.methods.addFavorite = function (songId: string | Types.ObjectId) {
  const objectId = typeof songId === 'string' ? new Types.ObjectId(songId) : songId;
  
  if (!this.favorites.some((id: Types.ObjectId) => id.equals(objectId))) {
    this.favorites.push(objectId);
  }
  return this.save();
};

userSchema.methods.removeFavorite = function (songId: string | Types.ObjectId) {
  const objectId = typeof songId === 'string' ? new Types.ObjectId(songId) : songId;
  
  this.favorites = this.favorites.filter((id: Types.ObjectId) => !id.equals(objectId));
  return this.save();
};

userSchema.methods.isFavoriteSong = function (songId: string | Types.ObjectId) {
  const objectId = typeof songId === 'string' ? new Types.ObjectId(songId) : songId;
  return this.favorites.some((id: Types.ObjectId) => id.equals(objectId));
};

userSchema.methods.getFavorites = function () {
  return this.favorites;
};

// Static methods - Updated for new schema
userSchema.statics.findActiveUsers = function (limit = 20) {
  return this.find({ isActive: true })
    .sort({ "stats.songsCreated": -1 })
    .limit(limit);
};

userSchema.statics.getTopContributors = function (limit = 10) {
  return this.find({ isActive: true })
    .sort({ "stats.songsCreated": -1 })
    .limit(limit)
    .select("name email stats.songsCreated stats.arrangementsCreated stats.setlistsCreated");
};

userSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase().trim() });
};

userSchema.statics.findByClerkId = function (clerkId: string) {
  return this.findOne({ clerkId });
};

export const User = model<IUser, IUserModel>("User", userSchema);