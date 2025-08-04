import { Schema, model, Document, Model, Types } from "mongoose";
import { compress, decompress } from "@mongodb-js/zstd";
import { MusicalKey } from "./User.js"; // Import the shared type

// Difficulty levels
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

// Interface for Song document - Updated per PRD specifications
export interface ISong extends Document {
  _id: Types.ObjectId;
  title: string; // Required, max 200 chars
  artist?: string; // Optional, max 100 chars
  slug: string; // Auto-generated, unique, indexed
  chordData: Buffer; // Zstd compressed ChordPro, max 50KB
  key: MusicalKey; // Required musical key
  tempo?: number; // 40-200 BPM
  timeSignature: string; // Default "4/4"
  difficulty: Difficulty; // beginner|intermediate|advanced
  themes: string[]; // Max 50 chars each
  source?: string; // Max 100 chars, indexed
  lyrics?: string; // Max 10,000 chars
  notes?: string; // Max 2,000 chars
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
  getDecompressedChordData(): Promise<string>;
}

// Interface for Song model (static methods)
export interface ISongModel extends Model<ISong> {
  findByDifficulty(difficulty: string): Promise<ISong[]>;
  findByKey(key: string): Promise<ISong[]>;
  searchSongs(query: string, limit?: number): Promise<ISong[]>;
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
  chordData: {
    type: Buffer, // Compressed ChordPro data
    required: true,
    validate: {
      validator: function (v: Buffer) {
        return v.length <= 50 * 1024; // 50KB compressed limit
      },
      message: "Compressed chord data exceeds 50KB limit",
    },
  },
  key: {
    type: String,
    enum: ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'],
    required: true,
    index: true,
  },
  tempo: {
    type: Number,
    min: 40,
    max: 200,
    index: true,
  },
  timeSignature: {
    type: String,
    default: "4/4",
  },
  difficulty: {
    type: String,
    enum: ["beginner", "intermediate", "advanced"],
    default: "intermediate",
    index: true,
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
  metadata: {
    createdBy: { 
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true, 
      index: true, 
    },
    lastModifiedBy: { 
      type: Schema.Types.ObjectId,
      ref: 'User',
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

// Strategic indexes per PRD specifications
songSchema.index(
  { 
    title: "text", 
    artist: "text", 
    themes: "text",
    source: "text",
    lyrics: "text"
  }, 
  { 
    weights: { title: 10, artist: 8, themes: 6, source: 4, lyrics: 2 },
    name: 'song_search_index'
  },
);

// Compound indexes for common queries
songSchema.index({ 'metadata.isPublic': 1, createdAt: -1 }); // Public songs by date
songSchema.index({ key: 1, difficulty: 1 }); // Filter combinations
songSchema.index({ themes: 1, 'metadata.ratings.average': -1 }); // Theme + rating
songSchema.index({ artist: 1, title: 1 }); // Artist lookups

// Compression middleware - compress on save
songSchema.pre("save", async function (this: ISong, next) {
  if (this.isModified("chordData") && typeof this.chordData === "string") {
    const buffer = Buffer.from(this.chordData as unknown as string, "utf8");
    this.chordData = await compress(buffer, 3); // Zstd level 3
  }

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

  // Document size will be calculated post-save to avoid circular dependencies
  next();
});

// Post-save middleware to calculate document size
songSchema.post('save', async function(doc: ISong) {
  if (doc.documentSize === 0) {
    // Calculate and update document size after save
    const docObject = doc.toObject();
    const size = Buffer.byteLength(JSON.stringify(docObject));
    await Song.updateOne({ _id: doc._id }, { documentSize: size });
  }
});

// Decompression middleware - decompress on find
songSchema.post("find", async function (docs: ISong[]) {
  for (const doc of docs) {
    if (doc.chordData && Buffer.isBuffer(doc.chordData)) {
      try {
        const decompressed = await decompress(doc.chordData);
        (doc.chordData as unknown) = decompressed.toString("utf8");
      } catch (error) {
        // Enhanced error handling for compression level mismatch
        console.error("Error decompressing chord data for song:", doc._id, error);
        console.error("Data may be compressed with a different compression level (was level 6, now level 3)");
        
        // Try to handle as plain base64 if decompression fails
        try {
          // If the data looks like base64, try decoding it
          const base64String = doc.chordData.toString('base64');
          if (/^[A-Za-z0-9+/]{4,}(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(base64String) && base64String.length >= 8) {
            (doc.chordData as unknown) = base64String;
          } else {
            (doc.chordData as unknown) = ""; // Fallback to empty string
          }
        } catch (fallbackError) {
          console.error("Fallback base64 handling also failed:", fallbackError);
          (doc.chordData as unknown) = ""; // Final fallback to empty string
        }
      }
    }
  }
});

songSchema.post("findOne", async function (doc: ISong | null) {
  if (doc && doc.chordData && Buffer.isBuffer(doc.chordData)) {
    try {
      const decompressed = await decompress(doc.chordData);
      (doc.chordData as unknown) = decompressed.toString("utf8");
    } catch (error) {
      // Enhanced error handling for compression level mismatch
      console.error("Error decompressing chord data for song:", doc._id, error);
      console.error("Data may be compressed with a different compression level (was level 6, now level 3)");
      
      // Try to handle as plain base64 if decompression fails
      try {
        // If the data looks like base64, try decoding it
        const base64String = doc.chordData.toString('base64');
        if (/^[A-Za-z0-9+/]{4,}(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(base64String) && base64String.length >= 8) {
          (doc.chordData as unknown) = base64String;
        } else {
          (doc.chordData as unknown) = ""; // Fallback to empty string
        }
      } catch (fallbackError) {
        console.error("Fallback base64 handling also failed:", fallbackError);
        (doc.chordData as unknown) = ""; // Final fallback to empty string
      }
    }
  }
});

// Utility methods
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

// Decompression method for reading chord data
songSchema.methods.getDecompressedChordData = async function (): Promise<string> {
  if (!this.chordData || !Buffer.isBuffer(this.chordData)) {
    return '';
  }
  
  try {
    const decompressed = await decompress(this.chordData);
    return decompressed.toString('utf8');
  } catch (error) {
    console.error('Error decompressing chord data for song:', this._id, error);
    return '';
  }
};

// Static methods for queries
songSchema.statics.findByDifficulty = function (difficulty: string) {
  return this.find({ difficulty });
};

songSchema.statics.findByKey = function (key: string) {
  return this.find({ key });
};

songSchema.statics.searchSongs = function (query: string, limit = 20) {
  return this.find(
    { $text: { $search: query } },
    { score: { $meta: "textScore" } },
  )
  .sort({ score: { $meta: "textScore" } })
  .limit(limit);
};

export const Song = model<ISong, ISongModel>("Song", songSchema);