import { Schema, model, Document, Types } from "mongoose";
import { compress, decompress } from "@mongodb-js/zstd";

// Interface for Arrangement document
export interface IArrangement extends Document {
  _id: string;
  name: string;
  songIds: Types.ObjectId[]; // Array for mashups - multiple songs
  createdBy: string;
  chordData: Buffer; // Zstd compressed ChordPro
  metadata: {
    key: string;
    capo?: number;
    tempo?: number;
    timeSignature?: string;
    difficulty: "beginner" | "intermediate" | "advanced";
    instruments?: string[];
    isMashup: boolean;
    mashupSections?: Array<{
      songId: Types.ObjectId;
      title: string;
      startBar: number;
      endBar: number;
    }>;
  };
  stats: {
    usageCount: number;
    lastUsed?: Date;
  };
  isPublic: boolean;
  documentSize: number;
  createdAt: Date;
  updatedAt: Date;
}

// Mashup section sub-schema
const mashupSectionSchema = new Schema({
  songId: {
    type: Schema.Types.ObjectId,
    ref: "Song",
    required: true,
  },
  title: {
    type: String,
    required: true,
    maxlength: 200,
  },
  startBar: {
    type: Number,
    required: true,
    min: 1,
  },
  endBar: {
    type: Number,
    required: true,
    min: 1,
  },
}, { _id: false });

// Create the schema
const arrangementSchema = new Schema<IArrangement>({
  name: {
    type: String,
    required: true,
    maxlength: 200,
    trim: true,
    index: "text",
  },
  songIds: [{
    type: Schema.Types.ObjectId,
    ref: "Song",
    required: true,
    index: true,
  }],
  createdBy: {
    type: String,
    required: true,
    index: true,
  },
  chordData: {
    type: Buffer, // Compressed ChordPro data
    required: true,
    validate: {
      validator: function (v: Buffer) {
        return v.length <= 100 * 1024; // 100KB compressed limit for arrangements
      },
      message: "Compressed chord data exceeds 100KB limit",
    },
  },
  metadata: {
    key: {
      type: String,
      enum: [
        "C", "C#", "Db", "D", "D#", "Eb", "E", "F", 
        "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B"
      ],
      index: true,
    },
    capo: {
      type: Number,
      min: 0,
      max: 12,
    },
    tempo: {
      type: Number,
      min: 40,
      max: 200,
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
    instruments: [{
      type: String,
      maxlength: 50,
    }],
    isMashup: {
      type: Boolean,
      default: false,
      index: true,
    },
    mashupSections: [mashupSectionSchema],
  },
  stats: {
    usageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastUsed: {
      type: Date,
    },
  },
  isPublic: {
    type: Boolean,
    default: true,
    index: true,
  },
  documentSize: {
    type: Number,
    required: true,
  },
}, {
  timestamps: true,
  collection: "arrangements",
});

// Create text index for search
arrangementSchema.index(
  { name: "text" },
  { weights: { name: 10 } }
);

// Compound indexes for efficient queries
arrangementSchema.index({ createdBy: 1, isPublic: 1 });
arrangementSchema.index({ "songIds": 1, isPublic: 1 });
arrangementSchema.index({ "metadata.difficulty": 1, isPublic: 1 });

// Compression middleware - compress on save
arrangementSchema.pre("save", async function (this: IArrangement) {
  if (this.isModified("chordData") && typeof this.chordData === "string") {
    const buffer = Buffer.from(this.chordData as unknown as string, "utf8");
    this.chordData = await compress(buffer, 6); // Zstd level 6
  }

  // Validate mashup data consistency
  if (this.metadata.isMashup) {
    if (this.songIds.length < 2) {
      throw new Error("Mashup arrangements must reference at least 2 songs");
    }
    
    if (this.metadata.mashupSections && this.metadata.mashupSections.length > 0) {
      // Verify all mashup sections reference songs in songIds
      const songIdStrings = this.songIds.map(id => id.toString());
      for (const section of this.metadata.mashupSections) {
        if (!songIdStrings.includes(section.songId.toString())) {
          throw new Error("All mashup sections must reference songs in songIds array");
        }
      }
    }
  } else {
    // Single song arrangement
    if (this.songIds.length !== 1) {
      throw new Error("Non-mashup arrangements must reference exactly one song");
    }
  }

  // Calculate document size for monitoring
  this.documentSize = Buffer.byteLength(JSON.stringify(this.toObject()));
});

// Decompression middleware - decompress on find
arrangementSchema.post("find", async function (docs: IArrangement[]) {
  for (const doc of docs) {
    if (doc.chordData && Buffer.isBuffer(doc.chordData)) {
      try {
        const decompressed = await decompress(doc.chordData);
        (doc.chordData as unknown) = decompressed.toString("utf8");
      } catch (error) {
        console.error("Error decompressing chord data for arrangement:", doc._id, error);
        (doc.chordData as unknown) = ""; // Fallback to empty string
      }
    }
  }
});

arrangementSchema.post("findOne", async function (doc: IArrangement | null) {
  if (doc && doc.chordData && Buffer.isBuffer(doc.chordData)) {
    try {
      const decompressed = await decompress(doc.chordData);
      (doc.chordData as unknown) = decompressed.toString("utf8");
    } catch (error) {
      console.error("Error decompressing chord data for arrangement:", doc._id, error);
      (doc.chordData as unknown) = ""; // Fallback to empty string
    }
  }
});

// Utility methods
arrangementSchema.methods.incrementUsage = function () {
  this.stats.usageCount += 1;
  this.stats.lastUsed = new Date();
  return this.save();
};

arrangementSchema.methods.getMashupDuration = function () {
  if (!this.metadata.isMashup || !this.metadata.mashupSections) {
    return 0;
  }
  
  return this.metadata.mashupSections.reduce((total, section) => {
    return total + (section.endBar - section.startBar + 1);
  }, 0);
};

// Static methods
arrangementSchema.statics.findBySong = function (songId: string) {
  return this.find({ songIds: songId, isPublic: true })
    .populate("songIds", "title artist")
    .sort({ "stats.usageCount": -1 });
};

arrangementSchema.statics.findMashups = function (limit = 20) {
  return this.find({ "metadata.isMashup": true, isPublic: true })
    .populate("songIds", "title artist")
    .sort({ "stats.usageCount": -1 })
    .limit(limit);
};

arrangementSchema.statics.findByDifficulty = function (difficulty: string) {
  return this.find({ "metadata.difficulty": difficulty, isPublic: true })
    .populate("songIds", "title artist");
};

arrangementSchema.statics.searchArrangements = function (query: string, limit = 20) {
  return this.find(
    { $text: { $search: query }, isPublic: true },
    { score: { $meta: "textScore" } }
  )
  .populate("songIds", "title artist")
  .sort({ score: { $meta: "textScore" } })
  .limit(limit);
};

export const Arrangement = model<IArrangement>("Arrangement", arrangementSchema);