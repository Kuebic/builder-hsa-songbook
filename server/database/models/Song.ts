import { Schema, model, Document, Model, Types } from "mongoose";

// Interface for Song document - Updated to contain only metadata
export interface ISong extends Document {
  _id: Types.ObjectId;
  title: string; // Required, max 200 chars
  artist?: string; // Optional, max 100 chars
  slug: string; // Auto-generated, unique, indexed
  compositionYear?: number; // Year the song was composed
  ccli?: string; // CCLI number for licensing
  themes: string[]; // Max 50 chars each
  source?: string; // Max 100 chars, indexed
  lyrics?: string; // Max 10,000 chars
  notes?: string; // Max 2,000 chars
  defaultArrangement?: Types.ObjectId; // Reference to default Arrangement
  metadata: {
    createdBy: Types.ObjectId; // Reference to User
    lastModifiedBy: Types.ObjectId; // Reference to User
    isPublic: boolean; // Indexed
    ratings: {
      average: number; // 0-5 scale
      count: number;
    };
    views: number;
  };
  documentSize: number; // Calculated bytes for monitoring
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  updateViews(): Promise<ISong>;
  addRating(rating: number): Promise<ISong>;
}

// Interface for Song model (static methods)
export interface ISongModel extends Model<ISong> {
  searchSongs(query: string, limit?: number): Promise<ISong[]>;
  findByTheme(theme: string): Promise<ISong[]>;
  findByCCLI(ccli: string): Promise<ISong | null>;
}

// Create the schema
const songSchema = new Schema<ISong>({
  title: {
    type: String,
    required: true,
    maxlength: 200,
    trim: true,
    index: "text",
  },
  artist: {
    type: String,
    maxlength: 100,
    trim: true,
    index: "text",
  },
  slug: {
    type: String,
    unique: true,
    index: true,
  },
  compositionYear: {
    type: Number,
    min: 1000,
    max: new Date().getFullYear() + 1,
    index: true,
  },
  ccli: {
    type: String,
    trim: true,
    index: true,
    sparse: true, // Allows null values while maintaining uniqueness
    validate: {
      validator: function(v: string) {
        return !v || /^\d+$/.test(v); // CCLI numbers are numeric strings
      },
      message: "CCLI must be a numeric string",
    },
  },
  themes: [{
    type: String,
    maxlength: 50,
    index: true,
  }],
  source: {
    type: String,
    maxlength: 100,
    index: true,
  },
  lyrics: {
    type: String,
    maxlength: 10000,
  },
  notes: {
    type: String,
    maxlength: 2000,
  },
  defaultArrangement: {
    type: Schema.Types.ObjectId,
    ref: "Arrangement",
  },
  metadata: {
    createdBy: { 
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true, 
      index: true, 
    },
    lastModifiedBy: { 
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true, 
    },
    isPublic: { 
      type: Boolean, 
      default: true, 
      index: true, 
    },
    ratings: {
      average: { 
        type: Number, 
        default: 0, 
        min: 0, 
        max: 5, 
      },
      count: { 
        type: Number, 
        default: 0, 
        min: 0, 
      },
    },
    views: { 
      type: Number, 
      default: 0, 
      min: 0, 
    },
  },
  documentSize: { 
    type: Number, 
    default: 0,
  },
}, {
  timestamps: true,
  collection: "songs",
});

// Strategic indexes for searching
songSchema.index(
  { 
    title: "text", 
    artist: "text", 
    themes: "text",
    source: "text",
    lyrics: "text",
  }, 
  { 
    weights: { title: 10, artist: 8, themes: 6, source: 4, lyrics: 2 },
    name: "song_search_index",
  },
);

// Compound indexes for common queries
songSchema.index({ "metadata.isPublic": 1, createdAt: -1 }); // Public songs by date
songSchema.index({ themes: 1, "metadata.ratings.average": -1 }); // Theme + rating
songSchema.index({ artist: 1, title: 1 }); // Artist lookups
songSchema.index({ compositionYear: -1, artist: 1 }); // Historical searches

// Pre-save middleware
songSchema.pre("save", async function (this: ISong, next) {
  // Generate slug if not provided
  if (!this.slug) {
    const baseSlug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .trim();
    
    // Add random suffix to ensure uniqueness
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    this.slug = `${baseSlug}-${randomSuffix}`;
  }

  next();
});

// Post-save middleware to calculate document size
songSchema.post("save", async function(doc: ISong) {
  if (doc.documentSize === 0) {
    // Calculate and update document size after save
    const docObject = doc.toObject();
    const size = Buffer.byteLength(JSON.stringify(docObject));
    await Song.updateOne({ _id: doc._id }, { documentSize: size });
  }
});

// Instance methods
songSchema.methods.updateViews = function () {
  this.metadata.views += 1;
  return this.save();
};

songSchema.methods.addRating = function (rating: number) {
  const currentTotal = this.metadata.ratings.average * this.metadata.ratings.count;
  this.metadata.ratings.count += 1;
  this.metadata.ratings.average = (currentTotal + rating) / this.metadata.ratings.count;
  return this.save();
};

// Static methods
songSchema.statics.searchSongs = function (query: string, limit = 20) {
  return this.find(
    { $text: { $search: query } },
    { score: { $meta: "textScore" } },
  )
  .sort({ score: { $meta: "textScore" } })
  .limit(limit);
};

songSchema.statics.findByTheme = function (theme: string) {
  return this.find({ themes: theme })
    .sort({ "metadata.ratings.average": -1 });
};

songSchema.statics.findByCCLI = function (ccli: string) {
  return this.findOne({ ccli });
};

// Export Difficulty type for backward compatibility (will be moved to Arrangement)
export type Difficulty = "beginner" | "intermediate" | "advanced";

export const Song = model<ISong, ISongModel>("Song", songSchema);