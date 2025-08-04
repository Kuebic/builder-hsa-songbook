import { Schema, model, Document, Model } from "mongoose";
import { compress, decompress } from "@mongodb-js/zstd";

// Interface for Song document
export interface ISong extends Document {
  _id: string;
  title: string;
  artist?: string;
  slug: string;
  chordData: Buffer; // Compressed ChordPro data
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
  documentSize: number; // Calculated field for monitoring
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  updateViews(): Promise<ISong>;
  addRating(rating: number): Promise<ISong>;
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
    enum: [
      "C", "C#", "Db", "D", "D#", "Eb", "E", "F", 
      "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B",
    ],
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
      type: String, 
      required: true, 
      index: true, 
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
    required: true, 
  },
}, {
  timestamps: true,
  collection: "songs",
});

// Create text index for search
songSchema.index(
  { 
    title: "text", 
    artist: "text", 
    themes: "text", 
  }, 
  { 
    weights: { title: 10, artist: 8, themes: 6 }, 
  },
);

// Compression middleware - compress on save
songSchema.pre("save", async function (this: ISong) {
  if (this.isModified("chordData") && typeof this.chordData === "string") {
    const buffer = Buffer.from(this.chordData as unknown as string, "utf8");
    this.chordData = await compress(buffer, 6); // Zstd level 6
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

  // Calculate document size for monitoring
  this.documentSize = Buffer.byteLength(JSON.stringify(this.toObject()));
});

// Decompression middleware - decompress on find
songSchema.post("find", async function (docs: ISong[]) {
  for (const doc of docs) {
    if (doc.chordData && Buffer.isBuffer(doc.chordData)) {
      try {
        const decompressed = await decompress(doc.chordData);
        (doc.chordData as unknown) = decompressed.toString("utf8");
      } catch (error) {
        console.error("Error decompressing chord data for song:", doc._id, error);
        (doc.chordData as unknown) = ""; // Fallback to empty string
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
      console.error("Error decompressing chord data for song:", doc._id, error);
      (doc.chordData as unknown) = ""; // Fallback to empty string
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