import { Schema, model, Document, Types, Model } from "mongoose";

// Interface for Setlist document
export interface ISetlist extends Document {
  _id: string;
  name: string;
  description?: string;
  createdBy: string;
  songs: Array<{
    arrangementId: Types.ObjectId;
    transposeBy: number; // Semitones from original
    notes?: string;
    order: number;
  }>;
  tags: string[];
  metadata: {
    date?: Date;
    venue?: string;
    isPublic: boolean;
    shareToken?: string;
    duration?: number; // Estimated duration in minutes
  };
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  generateShareToken(): string;
  addSong(arrangementId: string, transposeBy?: number, notes?: string): Promise<ISetlist>;
  removeSong(arrangementId: string): Promise<ISetlist>;
  reorderSongs(newOrder: string[]): Promise<ISetlist>;
  updateSongTranspose(arrangementId: string, transposeBy: number): Promise<ISetlist>;
  estimateDuration(): Promise<number>;
}

// Interface for Setlist model (static methods)
export interface ISetlistModel extends Model<ISetlist> {
  findPublic(limit?: number): Promise<ISetlist[]>;
  findByUser(userId: string, includePrivate?: boolean): Promise<ISetlist[]>;
  findByShareToken(shareToken: string): Promise<ISetlist | null>;
  findByTag(tag: string, limit?: number): Promise<ISetlist[]>;
  searchSetlists(query: string, limit?: number): Promise<ISetlist[]>;
}

// Setlist item sub-schema
const setlistItemSchema = new Schema({
  arrangementId: {
    type: Schema.Types.ObjectId,
    ref: "Arrangement",
    required: true,
  },
  transposeBy: {
    type: Number,
    default: 0,
    min: -12,
    max: 12,
  },
  notes: {
    type: String,
    maxlength: 500,
  },
  order: {
    type: Number,
    required: true,
    min: 1,
  },
}, { _id: false });

// Create the schema
const setlistSchema = new Schema<ISetlist>({
  name: {
    type: String,
    required: true,
    maxlength: 200,
    trim: true,
    index: "text",
  },
  description: {
    type: String,
    maxlength: 1000,
    trim: true,
  },
  createdBy: {
    type: String,
    required: true,
    index: true,
  },
  songs: [setlistItemSchema],
  tags: [{
    type: String,
    maxlength: 50,
    index: true,
  }],
  metadata: {
    date: {
      type: Date,
      index: true,
    },
    venue: {
      type: String,
      maxlength: 200,
      trim: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
      index: true,
    },
    shareToken: {
      type: String,
      unique: true,
      sparse: true, // Only create index for non-null values
    },
    duration: {
      type: Number,
      min: 0,
      max: 300, // 5 hours max
    },
  },
}, {
  timestamps: true,
  collection: "setlists",
});

// Create text index for search
setlistSchema.index(
  { name: "text", description: "text", tags: "text" },
  { weights: { name: 10, description: 5, tags: 3 } },
);

// Compound indexes for efficient queries
setlistSchema.index({ createdBy: 1, "metadata.isPublic": 1 });
setlistSchema.index({ "metadata.date": -1, "metadata.isPublic": 1 });
setlistSchema.index({ tags: 1, "metadata.isPublic": 1 });

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

  // Recalculate order numbers to ensure they're sequential
  this.songs.forEach((song, index) => {
    song.order = index + 1;
  });
});

// Instance methods
setlistSchema.methods.generateShareToken = function (): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

setlistSchema.methods.addSong = function (arrangementId: string, transposeBy = 0, notes?: string) {
  const newOrder = this.songs.length + 1;
  this.songs.push({
    arrangementId: new Types.ObjectId(arrangementId),
    transposeBy,
    notes,
    order: newOrder,
  });
  return this.save();
};

setlistSchema.methods.removeSong = function (arrangementId: string) {
  this.songs = this.songs.filter(
    (song: any) => song.arrangementId.toString() !== arrangementId,
  );
  // Reorder remaining songs
  this.songs.forEach((song: any, index: number) => {
    song.order = index + 1;
  });
  return this.save();
};

setlistSchema.methods.reorderSongs = function (newOrder: string[]) {
  const reorderedSongs = [];
  
  for (let i = 0; i < newOrder.length; i++) {
    const arrangementId = newOrder[i];
    const song = this.songs.find((s: any) => s.arrangementId.toString() === arrangementId);
    if (song) {
      song.order = i + 1;
      reorderedSongs.push(song);
    }
  }
  
  this.songs = reorderedSongs;
  return this.save();
};

setlistSchema.methods.updateSongTranspose = function (arrangementId: string, transposeBy: number) {
  const song = this.songs.find((s: any) => s.arrangementId.toString() === arrangementId);
  if (song) {
    song.transposeBy = transposeBy;
    return this.save();
  }
  throw new Error("Song not found in setlist");
};

setlistSchema.methods.estimateDuration = function (): Promise<number> {
  // This would typically involve looking up arrangement durations
  // For now, estimate 4 minutes per song
  const estimatedMinutes = this.songs.length * 4;
  this.metadata.duration = estimatedMinutes;
  return this.save().then(() => estimatedMinutes);
};

// Static methods
setlistSchema.statics.findPublic = function (limit = 20) {
  return this.find({ "metadata.isPublic": true })
    .populate({
      path: "songs.arrangementId",
      populate: {
        path: "songIds",
        select: "title artist",
      },
    })
    .sort({ createdAt: -1 })
    .limit(limit);
};

setlistSchema.statics.findByUser = function (userId: string, includePrivate = false) {
  const query: any = { createdBy: userId };
  if (!includePrivate) {
    query["metadata.isPublic"] = true;
  }

  return this.find(query)
    .populate({
      path: "songs.arrangementId",
      populate: {
        path: "songIds",
        select: "title artist",
      },
    })
    .sort({ createdAt: -1 });
};

setlistSchema.statics.findByShareToken = function (shareToken: string) {
  return this.findOne({ "metadata.shareToken": shareToken })
    .populate({
      path: "songs.arrangementId",
      populate: {
        path: "songIds",
        select: "title artist key tempo difficulty",
      },
    });
};

setlistSchema.statics.findByTag = function (tag: string, limit = 20) {
  return this.find({ tags: tag, "metadata.isPublic": true })
    .populate({
      path: "songs.arrangementId",
      populate: {
        path: "songIds",
        select: "title artist",
      },
    })
    .sort({ createdAt: -1 })
    .limit(limit);
};

setlistSchema.statics.searchSetlists = function (query: string, limit = 20) {
  return this.find(
    { $text: { $search: query }, "metadata.isPublic": true },
    { score: { $meta: "textScore" } },
  )
  .populate({
    path: "songs.arrangementId",
    populate: {
      path: "songIds",
      select: "title artist",
    },
  })
  .sort({ score: { $meta: "textScore" } })
  .limit(limit);
};

export const Setlist = model<ISetlist, ISetlistModel>("Setlist", setlistSchema);