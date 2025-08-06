import { Schema, model, Document, Model, Types } from "mongoose";

// Interface for Review document
export interface IReview extends Document {
  _id: Types.ObjectId;
  arrangementId: Types.ObjectId; // Reference to Arrangement
  userId: Types.ObjectId; // Reference to User (one review per user per arrangement)
  rating: number; // 1-5 stars
  comment: string; // Review text
  helpful: Types.ObjectId[]; // Users who marked this review as helpful
  reported: boolean; // Flag for moderation
  reportReason?: string; // Optional reason for report
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  markAsHelpful(userId: Types.ObjectId): Promise<IReview>;
  unmarkAsHelpful(userId: Types.ObjectId): Promise<IReview>;
  report(reason?: string): Promise<IReview>;
  clearReport(): Promise<IReview>;
  getHelpfulCount(): number;
}

// Interface for Review model (static methods)
export interface IReviewModel extends Model<IReview> {
  findByArrangement(
    arrangementId: string | Types.ObjectId,
    includeReported?: boolean,
  ): Promise<IReview[]>;
  findByUser(userId: string | Types.ObjectId): Promise<IReview[]>;
  findUserReview(
    arrangementId: string | Types.ObjectId,
    userId: string | Types.ObjectId,
  ): Promise<IReview | null>;
  getAverageRating(
    arrangementId: string | Types.ObjectId,
  ): Promise<{ average: number; count: number }>;
  findReported(limit?: number): Promise<IReview[]>;
}

// Schema definition
const reviewSchema = new Schema<IReview, IReviewModel>(
  {
    arrangementId: {
      type: Schema.Types.ObjectId,
      ref: "Arrangement",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: "Rating must be a whole number between 1 and 5",
      },
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 2000,
    },
    helpful: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    reported: {
      type: Boolean,
      default: false,
      index: true,
    },
    reportReason: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  },
);

// Compound indexes
reviewSchema.index({ arrangementId: 1, userId: 1 }, { unique: true }); // One review per user per arrangement
reviewSchema.index({ userId: 1, createdAt: -1 });
reviewSchema.index({ arrangementId: 1, rating: -1 }); // For sorting by rating

// Instance methods
reviewSchema.methods.markAsHelpful = async function (userId: Types.ObjectId) {
  if (!this.helpful.some((id: Types.ObjectId) => id.equals(userId))) {
    this.helpful.push(userId);
    return await this.save();
  }
  return this;
};

reviewSchema.methods.unmarkAsHelpful = async function (userId: Types.ObjectId) {
  this.helpful = this.helpful.filter(
    (id: Types.ObjectId) => !id.equals(userId),
  );
  return await this.save();
};

reviewSchema.methods.report = async function (reason?: string) {
  this.reported = true;
  if (reason) {
    this.reportReason = reason;
  }
  return await this.save();
};

reviewSchema.methods.clearReport = async function () {
  this.reported = false;
  this.reportReason = undefined;
  return await this.save();
};

reviewSchema.methods.getHelpfulCount = function () {
  return this.helpful.length;
};

// Static methods
reviewSchema.statics.findByArrangement = async function (
  arrangementId: string | Types.ObjectId,
  includeReported: boolean = false,
): Promise<IReview[]> {
  const query: FilterQuery<IReview> = { arrangementId };
  if (!includeReported) {
    query.reported = false;
  }

  return await this.find(query)
    .populate("userId", "name email")
    .sort({ "helpful.length": -1, createdAt: -1 });
};

reviewSchema.statics.findByUser = async function (
  userId: string | Types.ObjectId,
): Promise<IReview[]> {
  return await this.find({ userId })
    .populate("arrangementId", "name songIds")
    .sort({ createdAt: -1 });
};

reviewSchema.statics.findUserReview = async function (
  arrangementId: string | Types.ObjectId,
  userId: string | Types.ObjectId,
): Promise<IReview | null> {
  return await this.findOne({ arrangementId, userId }).populate(
    "userId",
    "name email",
  );
};

reviewSchema.statics.getAverageRating = async function (
  arrangementId: string | Types.ObjectId,
): Promise<{ average: number; count: number }> {
  const result = await this.aggregate([
    {
      $match: {
        arrangementId: new Types.ObjectId(arrangementId.toString()),
        reported: false,
      },
    },
    {
      $group: {
        _id: null,
        average: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  if (result.length === 0) {
    return { average: 0, count: 0 };
  }

  return {
    average: Math.round(result[0].average * 10) / 10, // Round to 1 decimal place
    count: result[0].count,
  };
};

reviewSchema.statics.findReported = async function (
  limit: number = 50,
): Promise<IReview[]> {
  return await this.find({ reported: true })
    .populate("userId", "name email")
    .populate("arrangementId", "name")
    .sort({ updatedAt: -1 })
    .limit(limit);
};

// Create and export the model
export const Review = model<IReview, IReviewModel>("Review", reviewSchema);

// Export schema for testing
export { reviewSchema };
