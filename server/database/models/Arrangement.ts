import { Schema, model, Document, Model, Types } from "mongoose";
import { compress, decompress } from "@mongodb-js/zstd";
import { MusicalKey } from "./User.js"; // Import MusicalKey
import { Difficulty } from "./Song.js"; // Import Difficulty from Song

// Interface for Arrangement document - Updated per PRD specifications
export interface IArrangement extends Document {
  _id: Types.ObjectId;
  name: string; // Required, max 200 chars
  songIds: Types.ObjectId[]; // Array supports mashups
  createdBy: Types.ObjectId; // Reference to User, indexed
  chordData: Buffer; // Zstd compressed, max 100KB
  key: MusicalKey;
  tempo?: number; // 40-200 BPM
  timeSignature: string; // Default "4/4"
  difficulty: Difficulty;
  description?: string; // Max 1,000 chars
  tags: string[]; // Max 50 chars each
  metadata: {
    isMashup: boolean; // Auto-set if multiple songs
    mashupSections?: Array<{
      songId: Types.ObjectId;
      title: string; // Max 200 chars
      startBar?: number;
      endBar?: number;
    }>;
    isPublic: boolean; // Indexed
    ratings: {
      average: number; // 0-5 scale
      count: number;
    };
    views: number;
  };
  documentSize: number;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  updateViews(): Promise<IArrangement>;
  addRating(rating: number): Promise<IArrangement>;
  getDecompressedChordData(): Promise<string>;
  getMashupDuration(): number;
}

// Interface for Arrangement model (static methods)
export interface IArrangementModel extends Model<IArrangement> {
  findBySong(songId: string): Promise<IArrangement[]>;
  findMashups(limit?: number): Promise<IArrangement[]>;
  findByDifficulty(difficulty: string): Promise<IArrangement[]>;
  searchArrangements(query: string, limit?: number): Promise<IArrangement[]>;
  findByTags(tags: string[], limit?: number): Promise<IArrangement[]>;
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
    type: Schema.Types.ObjectId,
    ref: 'User',
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
  description: {
    type: String,
    maxlength: 1000,
    trim: true,
  },
  tags: [{
    type: String,
    maxlength: 50,
    trim: true,
  }],
  metadata: {
    isMashup: {
      type: Boolean,
      default: false,
      index: true,
    },
    mashupSections: [mashupSectionSchema],
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
  collection: "arrangements",
});

// Strategic indexes per PRD specifications
arrangementSchema.index(
  { name: "text", description: "text", tags: "text" },
  { weights: { name: 10, description: 6, tags: 4 } },
);

// Compound indexes for efficient queries
arrangementSchema.index({ songIds: 1, 'metadata.isPublic': 1 }); // Find arrangements for songs
arrangementSchema.index({ 'metadata.isMashup': 1, 'metadata.isPublic': 1 }); // Mashup discovery
arrangementSchema.index({ createdBy: 1, createdAt: -1 }); // User's arrangements
arrangementSchema.index({ 'metadata.isPublic': 1, createdAt: -1 }); // Public arrangements
arrangementSchema.index({ tags: 1, 'metadata.isPublic': 1 }); // Tag searches

// Compression middleware - compress on save
arrangementSchema.pre("save", async function (this: IArrangement, next) {
  if (this.isModified("chordData") && typeof this.chordData === "string") {
    const buffer = Buffer.from(this.chordData as unknown as string, "utf8");
    this.chordData = await compress(buffer, 3); // Zstd level 3
  }

  // Auto-set isMashup based on songIds length
  this.metadata.isMashup = this.songIds.length > 1;

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
    // Clear mashup sections for single songs
    this.metadata.mashupSections = undefined;
  }

  // Document size will be calculated post-save to avoid circular dependencies
  next();
});

// Post-save middleware to calculate document size
arrangementSchema.post('save', async function(doc: IArrangement) {
  if (doc.documentSize === 0) {
    // Calculate and update document size after save
    const docObject = doc.toObject();
    const size = Buffer.byteLength(JSON.stringify(docObject));
    await Arrangement.updateOne({ _id: doc._id }, { documentSize: size });
  }
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
arrangementSchema.methods.updateViews = function () {
  this.metadata.views += 1;
  return this.save();
};

arrangementSchema.methods.addRating = function (rating: number) {
  const currentTotal = this.metadata.ratings.average * this.metadata.ratings.count;
  this.metadata.ratings.count += 1;
  this.metadata.ratings.average = (currentTotal + rating) / this.metadata.ratings.count;
  return this.save();
};

arrangementSchema.methods.getDecompressedChordData = async function (): Promise<string> {
  if (!this.chordData || !Buffer.isBuffer(this.chordData)) {
    return '';
  }
  
  try {
    const decompressed = await decompress(this.chordData);
    return decompressed.toString('utf8');
  } catch (error) {
    console.error('Error decompressing chord data for arrangement:', this._id, error);
    return '';
  }
};

arrangementSchema.methods.getMashupDuration = function () {
  if (!this.metadata.isMashup || !this.metadata.mashupSections) {
    return 0;
  }
  
  return this.metadata.mashupSections.reduce((total: number, section: any) => {
    if (section.startBar && section.endBar) {
      return total + (section.endBar - section.startBar + 1);
    }
    return total;
  }, 0);
};

// Static methods - Updated for new schema structure
arrangementSchema.statics.findBySong = function (songId: string) {
  return this.find({ songIds: songId, 'metadata.isPublic': true })
    .populate("songIds", "title artist")
    .populate("createdBy", "name email")
    .sort({ 'metadata.views': -1 });
};

arrangementSchema.statics.findMashups = function (limit = 20) {
  return this.find({ "metadata.isMashup": true, 'metadata.isPublic': true })
    .populate("songIds", "title artist")
    .populate("createdBy", "name email")
    .sort({ 'metadata.views': -1 })
    .limit(limit);
};

arrangementSchema.statics.findByDifficulty = function (difficulty: string) {
  return this.find({ difficulty: difficulty, 'metadata.isPublic': true })
    .populate("songIds", "title artist")
    .populate("createdBy", "name email");
};

arrangementSchema.statics.searchArrangements = function (query: string, limit = 20) {
  return this.find(
    { $text: { $search: query }, 'metadata.isPublic': true },
    { score: { $meta: "textScore" } },
  )
  .populate("songIds", "title artist")
  .populate("createdBy", "name email")
  .sort({ score: { $meta: "textScore" } })
  .limit(limit);
};

arrangementSchema.statics.findByTags = function (tags: string[], limit = 20) {
  return this.find({ tags: { $in: tags }, 'metadata.isPublic': true })
    .populate("songIds", "title artist")
    .populate("createdBy", "name email")
    .sort({ 'metadata.ratings.average': -1 })
    .limit(limit);
};

export const Arrangement = model<IArrangement, IArrangementModel>("Arrangement", arrangementSchema);