import { Schema, model, Document, Model, Types } from "mongoose";

// Verse status enum
export type VerseStatus = "pending" | "approved" | "rejected";

// Interface for Verse document
export interface IVerse extends Document {
  _id: Types.ObjectId;
  songId: Types.ObjectId; // Reference to Song
  reference: string; // Bible reference (e.g., "John 3:16")
  text: string; // The verse text
  submittedBy: Types.ObjectId; // Reference to User
  upvotes: Types.ObjectId[]; // Array of user IDs who upvoted
  status: VerseStatus; // Moderation status
  rejectionReason?: string; // Optional reason for rejection
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  addUpvote(userId: Types.ObjectId): Promise<IVerse>;
  removeUpvote(userId: Types.ObjectId): Promise<IVerse>;
  approve(): Promise<IVerse>;
  reject(reason?: string): Promise<IVerse>;
  getUpvoteCount(): number;
}

// Interface for Verse model (static methods)
export interface IVerseModel extends Model<IVerse> {
  findBySong(
    songId: string | Types.ObjectId,
    status?: VerseStatus,
  ): Promise<IVerse[]>;
  findByUser(userId: string | Types.ObjectId): Promise<IVerse[]>;
  findPending(limit?: number): Promise<IVerse[]>;
}

// Schema definition
const verseSchema = new Schema<IVerse, IVerseModel>(
  {
    songId: {
      type: Schema.Types.ObjectId,
      ref: "Song",
      required: true,
      index: true,
    },
    reference: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    upvotes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    rejectionReason: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  },
);

// Compound indexes for efficient queries
verseSchema.index({ songId: 1, status: 1 });
verseSchema.index({ submittedBy: 1, createdAt: -1 });

// Instance methods
verseSchema.methods.addUpvote = async function (userId: Types.ObjectId) {
  if (!this.upvotes.some((id: Types.ObjectId) => id.equals(userId))) {
    this.upvotes.push(userId);
    return await this.save();
  }
  return this;
};

verseSchema.methods.removeUpvote = async function (userId: Types.ObjectId) {
  this.upvotes = this.upvotes.filter(
    (id: Types.ObjectId) => !id.equals(userId),
  );
  return await this.save();
};

verseSchema.methods.approve = async function () {
  this.status = "approved";
  this.rejectionReason = undefined;
  return await this.save();
};

verseSchema.methods.reject = async function (reason?: string) {
  this.status = "rejected";
  if (reason) {
    this.rejectionReason = reason;
  }
  return await this.save();
};

verseSchema.methods.getUpvoteCount = function () {
  return this.upvotes.length;
};

// Static methods
verseSchema.statics.findBySong = async function (
  songId: string | Types.ObjectId,
  status?: VerseStatus,
): Promise<IVerse[]> {
  const query: FilterQuery<IVerse> = { songId };
  if (status) {
    query.status = status;
  }
  return await this.find(query)
    .populate("submittedBy", "name email")
    .sort({ "upvotes.length": -1, createdAt: -1 });
};

verseSchema.statics.findByUser = async function (
  userId: string | Types.ObjectId,
): Promise<IVerse[]> {
  return await this.find({ submittedBy: userId })
    .populate("songId", "title artist")
    .sort({ createdAt: -1 });
};

verseSchema.statics.findPending = async function (
  limit: number = 50,
): Promise<IVerse[]> {
  return await this.find({ status: "pending" })
    .populate("submittedBy", "name email")
    .populate("songId", "title artist")
    .sort({ createdAt: 1 })
    .limit(limit);
};

// Create and export the model
export const Verse = model<IVerse, IVerseModel>("Verse", verseSchema);

// Export schema for testing
export { verseSchema };
