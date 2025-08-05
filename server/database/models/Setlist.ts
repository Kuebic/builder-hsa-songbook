import { Schema, model, Document, Types, Model } from "mongoose";

// Interface for SetlistItem subdocument - Per PRD specifications
export interface ISetlistItem {
  songId: Types.ObjectId; // Required reference to Song
  arrangementId?: Types.ObjectId; // Optional arrangement override
  transpose: number; // Semitones -11 to +11
  notes?: string; // Performance notes, max 500 chars
  order: number; // Required, min 0
}

// Interface for Setlist document - Updated per PRD specifications
export interface ISetlist extends Document {
  _id: Types.ObjectId;
  name: string; // Required, max 200 chars
  description?: string; // Max 1,000 chars
  createdBy: Types.ObjectId; // Reference to User, indexed
  songs: ISetlistItem[]; // Embedded subdocuments
  tags: string[]; // Max 50 chars each
  metadata: {
    isPublic: boolean; // Indexed, default false
    shareToken?: string; // UUID for public sharing
    estimatedDuration: number; // Minutes, calculated
    lastUsedAt?: Date;
    usageCount: number; // Auto-increment
  };
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  generateShareToken(): string;
  addSong(songId: string, arrangementId?: string, transpose?: number, notes?: string): Promise<ISetlist>;
  removeSong(songId: string): Promise<ISetlist>;
  reorderSongs(newOrder: string[]): Promise<ISetlist>;
  updateSongTranspose(songId: string, transpose: number): Promise<ISetlist>;
  estimateDuration(): Promise<number>;
  incrementUsage(): Promise<ISetlist>;
}

// Interface for Setlist model (static methods)
export interface ISetlistModel extends Model<ISetlist> {
  findPublic(limit?: number): Promise<ISetlist[]>;
  findByUser(userId: string, includePrivate?: boolean): Promise<ISetlist[]>;
  findByShareToken(shareToken: string): Promise<ISetlist | null>;
  findByTag(tag: string, limit?: number): Promise<ISetlist[]>;
  searchSetlists(query: string, limit?: number): Promise<ISetlist[]>;
}

// Setlist item sub-schema - Updated per PRD specifications
const setlistItemSchema = new Schema({
  songId: {
    type: Schema.Types.ObjectId,
    ref: "Song",
    required: true,
  },
  arrangementId: {
    type: Schema.Types.ObjectId,
    ref: "Arrangement",
    // Optional - arrangement override
  },
  transpose: {
    type: Number,
    default: 0,
    min: -11,
    max: 11,
  },
  notes: {
    type: String,
    maxlength: 500,
    trim: true,
  },
  order: {
    type: Number,
    required: true,
    min: 0,
  },
}, { _id: false });

// Create the schema
const setlistSchema = new Schema<ISetlist>({
  name: {
    type: String,
    required: true,
    maxlength: 200,
    trim: true,
  },
  description: {
    type: String,
    maxlength: 1000,
    trim: true,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  songs: [setlistItemSchema],
  tags: [{
    type: String,
    maxlength: 50,
    trim: true,
  }],
  metadata: {
    isPublic: {
      type: Boolean,
      default: false,
    },
    shareToken: {
      type: String,
    },
    estimatedDuration: {
      type: Number,
      default: 0,
      min: 0,
      max: 500, // 8+ hours max for large events
    },
    lastUsedAt: {
      type: Date,
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
}, {
  timestamps: true,
  collection: "setlists",
});

// Strategic indexes per PRD specifications
setlistSchema.index(
  { name: "text", description: "text", tags: "text" },
  { weights: { name: 10, description: 5, tags: 3 } },
);

// Compound indexes for efficient queries
setlistSchema.index({ createdBy: 1, createdAt: -1 }); // User's setlists
setlistSchema.index({ "metadata.isPublic": 1, createdAt: -1 }); // Public setlists
setlistSchema.index({ tags: 1, "metadata.isPublic": 1 }); // Tag searches
setlistSchema.index({ "metadata.shareToken": 1 }, { sparse: true, unique: true }); // Public sharing

// Pre-save middleware
setlistSchema.pre("save", function (this: ISetlist) {
  // Generate share token if setlist is public and doesn't have one
  if (this.metadata.isPublic && !this.metadata.shareToken) {
    this.metadata.shareToken = this.generateShareToken();
  }

  // Remove share token if setlist is made private
  if (!this.metadata.isPublic && this.metadata.shareToken) {
    this.metadata.shareToken = undefined;
  }

  // Sort songs by order
  this.songs.sort((a, b) => a.order - b.order);

  // Recalculate order numbers to ensure they're sequential starting from 0
  this.songs.forEach((song, index) => {
    song.order = index;
  });

  // Auto-calculate estimated duration (4 minutes per song average)
  this.metadata.estimatedDuration = this.songs.length * 4;
});

// Instance methods
setlistSchema.methods.generateShareToken = function (): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

setlistSchema.methods.addSong = function (songId: string, arrangementId?: string, transpose = 0, notes?: string) {
  const newOrder = this.songs.length;
  const newSong: any = {
    songId: new Types.ObjectId(songId),
    transpose,
    notes,
    order: newOrder,
  };
  
  if (arrangementId) {
    newSong.arrangementId = new Types.ObjectId(arrangementId);
  }
  
  this.songs.push(newSong);
  return this.save();
};

setlistSchema.methods.removeSong = function (songId: string) {
  this.songs = this.songs.filter(
    (song: any) => song.songId.toString() !== songId,
  );
  // Reorder remaining songs - will be handled in pre-save middleware
  return this.save();
};

setlistSchema.methods.reorderSongs = function (newOrder: string[]) {
  const reorderedSongs = [];
  
  for (let i = 0; i < newOrder.length; i++) {
    const songId = newOrder[i];
    const song = this.songs.find((s: any) => s.songId.toString() === songId);
    if (song) {
      song.order = i;
      reorderedSongs.push(song);
    }
  }
  
  this.songs = reorderedSongs;
  return this.save();
};

setlistSchema.methods.updateSongTranspose = function (songId: string, transpose: number) {
  const song = this.songs.find((s: any) => s.songId.toString() === songId);
  if (song) {
    song.transpose = transpose;
    return this.save();
  }
  throw new Error("Song not found in setlist");
};

setlistSchema.methods.estimateDuration = function (): Promise<number> {
  // Estimated duration is auto-calculated in pre-save middleware
  return this.save().then(() => this.metadata.estimatedDuration);
};

setlistSchema.methods.incrementUsage = function () {
  this.metadata.usageCount += 1;
  this.metadata.lastUsedAt = new Date();
  return this.save();
};

// Static methods - Updated for new schema structure
setlistSchema.statics.findPublic = function (limit = 20) {
  return this.find({ "metadata.isPublic": true })
    .populate("songs.songId", "title artist key difficulty")
    .populate("songs.arrangementId", "name key difficulty")
    .populate("createdBy", "name email")
    .sort({ createdAt: -1 })
    .limit(limit);
};

setlistSchema.statics.findByUser = function (userId: string, includePrivate = false) {
  const query: any = { createdBy: userId };
  if (!includePrivate) {
    query["metadata.isPublic"] = true;
  }

  return this.find(query)
    .populate("songs.songId", "title artist key difficulty")
    .populate("songs.arrangementId", "name key difficulty")
    .populate("createdBy", "name email")
    .sort({ createdAt: -1 });
};

setlistSchema.statics.findByShareToken = function (shareToken: string) {
  return this.findOne({ "metadata.shareToken": shareToken })
    .populate("songs.songId", "title artist key tempo difficulty")
    .populate("songs.arrangementId", "name key tempo difficulty")
    .populate("createdBy", "name email");
};

setlistSchema.statics.findByTag = function (tag: string, limit = 20) {
  return this.find({ tags: tag, "metadata.isPublic": true })
    .populate("songs.songId", "title artist key difficulty")
    .populate("songs.arrangementId", "name key difficulty")
    .populate("createdBy", "name email")
    .sort({ createdAt: -1 })
    .limit(limit);
};

setlistSchema.statics.searchSetlists = function (query: string, limit = 20) {
  return this.find(
    { $text: { $search: query }, "metadata.isPublic": true },
    { score: { $meta: "textScore" } },
  )
  .populate("songs.songId", "title artist key difficulty")
  .populate("songs.arrangementId", "name key difficulty")
  .populate("createdBy", "name email")
  .sort({ score: { $meta: "textScore" } })
  .limit(limit);
};

export const Setlist = model<ISetlist, ISetlistModel>("Setlist", setlistSchema);