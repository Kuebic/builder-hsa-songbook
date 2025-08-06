import { Schema, model, Document, Types, Model } from "mongoose";

// Musical key enum for consistency
export type MusicalKey =
  | "C"
  | "C#"
  | "Db"
  | "D"
  | "D#"
  | "Eb"
  | "E"
  | "F"
  | "F#"
  | "Gb"
  | "G"
  | "G#"
  | "Ab"
  | "A"
  | "A#"
  | "Bb"
  | "B";

// Interface for User document - Updated for dual favorites system
export interface IUser extends Document {
  _id: Types.ObjectId;
  clerkId?: string; // Optional until Clerk integration
  email: string; // Unique, lowercase, trimmed
  name: string; // Max 100 characters
  role: "USER" | "ADMIN" | "MODERATOR";
  preferences: {
    defaultKey?: MusicalKey;
    fontSize: number; // 12-32px range
    theme: "light" | "dark" | "stage";
  };
  profile: {
    bio?: string; // Max 500 characters
    website?: string; // Max 200 characters
    location?: string; // Max 100 characters
  };
  profilePrivacy: {
    isPublic: boolean; // Master privacy switch - default false for privacy by design
    showFavorites: boolean; // Show favorite songs/arrangements
    showActivity: boolean; // Show activity timeline
    showContributions: boolean; // Show created content - default true for ministry value
    showReviews: boolean; // Show reviews and ratings
    allowContact: boolean; // Allow ministry contact via email
    showStats: boolean; // Show contribution statistics
    showBio: boolean; // Show bio section
    showLocation: boolean; // Show location
    showWebsite: boolean; // Show website link
  };
  favoriteSongs: Types.ObjectId[]; // Array of song IDs user has favorited
  favoriteArrangements: Types.ObjectId[]; // Array of arrangement IDs user has favorited
  submittedVerses: Types.ObjectId[]; // Array of verse IDs user has submitted
  reviews: Types.ObjectId[]; // Array of review IDs user has written
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

  // Favorites methods - Songs
  addFavoriteSong(songId: string | Types.ObjectId): Promise<IUser>;
  removeFavoriteSong(songId: string | Types.ObjectId): Promise<IUser>;
  isFavoriteSong(songId: string | Types.ObjectId): boolean;
  getFavoriteSongs(): Types.ObjectId[];

  // Favorites methods - Arrangements
  addFavoriteArrangement(
    arrangementId: string | Types.ObjectId,
  ): Promise<IUser>;
  removeFavoriteArrangement(
    arrangementId: string | Types.ObjectId,
  ): Promise<IUser>;
  isFavoriteArrangement(arrangementId: string | Types.ObjectId): boolean;
  getFavoriteArrangements(): Types.ObjectId[];

  // Community content methods
  addSubmittedVerse(verseId: Types.ObjectId): Promise<IUser>;
  addReview(reviewId: Types.ObjectId): Promise<IUser>;
}

// Interface for User model (static methods)
export interface IUserModel extends Model<IUser> {
  findActiveUsers(limit?: number): Promise<IUser[]>;
  getTopContributors(limit?: number): Promise<IUser[]>;
  findByEmail(email: string): Promise<IUser | null>;
  findByClerkId(clerkId: string): Promise<IUser | null>;
}

// Create the schema - Updated for dual favorites and community features
const userSchema = new Schema<IUser>(
  {
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
      enum: ["USER", "ADMIN", "MODERATOR"],
      default: "USER",
    },
    preferences: {
      defaultKey: {
        type: String,
        enum: [
          "C",
          "C#",
          "Db",
          "D",
          "D#",
          "Eb",
          "E",
          "F",
          "F#",
          "Gb",
          "G",
          "G#",
          "Ab",
          "A",
          "A#",
          "Bb",
          "B",
        ],
      },
      fontSize: {
        type: Number,
        min: 12,
        max: 32,
        default: 16,
      },
      theme: {
        type: String,
        enum: ["light", "dark", "stage"],
        default: "light",
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
    profilePrivacy: {
      isPublic: {
        type: Boolean,
        default: false, // Privacy by design - default private
      },
      showFavorites: {
        type: Boolean,
        default: false, // Privacy by design - default private
      },
      showActivity: {
        type: Boolean,
        default: false, // Privacy by design - default private
      },
      showContributions: {
        type: Boolean,
        default: true, // Allow ministry contributions visibility by default
      },
      showReviews: {
        type: Boolean,
        default: false, // Privacy by design - default private
      },
      allowContact: {
        type: Boolean,
        default: false, // Privacy by design - default private
      },
      showStats: {
        type: Boolean,
        default: false, // Privacy by design - default private
      },
      showBio: {
        type: Boolean,
        default: false, // Privacy by design - default private
      },
      showLocation: {
        type: Boolean,
        default: false, // Privacy by design - default private
      },
      showWebsite: {
        type: Boolean,
        default: false, // Privacy by design - default private
      },
    },
    favoriteSongs: [
      {
        type: Schema.Types.ObjectId,
        ref: "Song",
        index: true,
      },
    ],
    favoriteArrangements: [
      {
        type: Schema.Types.ObjectId,
        ref: "Arrangement",
        index: true,
      },
    ],
    submittedVerses: [
      {
        type: Schema.Types.ObjectId,
        ref: "Verse",
      },
    ],
    reviews: [
      {
        type: Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
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
  },
  {
    timestamps: true,
    collection: "users",
  },
);

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

// Song favorites methods
userSchema.methods.addFavoriteSong = function (
  songId: string | Types.ObjectId,
) {
  const objectId =
    typeof songId === "string" ? new Types.ObjectId(songId) : songId;

  if (!this.favoriteSongs.some((id: Types.ObjectId) => id.equals(objectId))) {
    this.favoriteSongs.push(objectId);
  }
  return this.save();
};

userSchema.methods.removeFavoriteSong = function (
  songId: string | Types.ObjectId,
) {
  const objectId =
    typeof songId === "string" ? new Types.ObjectId(songId) : songId;

  this.favoriteSongs = this.favoriteSongs.filter(
    (id: Types.ObjectId) => !id.equals(objectId),
  );
  return this.save();
};

userSchema.methods.isFavoriteSong = function (songId: string | Types.ObjectId) {
  const objectId =
    typeof songId === "string" ? new Types.ObjectId(songId) : songId;
  return this.favoriteSongs.some((id: Types.ObjectId) => id.equals(objectId));
};

userSchema.methods.getFavoriteSongs = function () {
  return this.favoriteSongs;
};

// Arrangement favorites methods
userSchema.methods.addFavoriteArrangement = function (
  arrangementId: string | Types.ObjectId,
) {
  const objectId =
    typeof arrangementId === "string"
      ? new Types.ObjectId(arrangementId)
      : arrangementId;

  if (
    !this.favoriteArrangements.some((id: Types.ObjectId) => id.equals(objectId))
  ) {
    this.favoriteArrangements.push(objectId);
  }
  return this.save();
};

userSchema.methods.removeFavoriteArrangement = function (
  arrangementId: string | Types.ObjectId,
) {
  const objectId =
    typeof arrangementId === "string"
      ? new Types.ObjectId(arrangementId)
      : arrangementId;

  this.favoriteArrangements = this.favoriteArrangements.filter(
    (id: Types.ObjectId) => !id.equals(objectId),
  );
  return this.save();
};

userSchema.methods.isFavoriteArrangement = function (
  arrangementId: string | Types.ObjectId,
) {
  const objectId =
    typeof arrangementId === "string"
      ? new Types.ObjectId(arrangementId)
      : arrangementId;
  return this.favoriteArrangements.some((id: Types.ObjectId) =>
    id.equals(objectId),
  );
};

userSchema.methods.getFavoriteArrangements = function () {
  return this.favoriteArrangements;
};

// Community content methods
userSchema.methods.addSubmittedVerse = function (verseId: Types.ObjectId) {
  if (!this.submittedVerses.some((id: Types.ObjectId) => id.equals(verseId))) {
    this.submittedVerses.push(verseId);
  }
  return this.save();
};

userSchema.methods.addReview = function (reviewId: Types.ObjectId) {
  if (!this.reviews.some((id: Types.ObjectId) => id.equals(reviewId))) {
    this.reviews.push(reviewId);
  }
  return this.save();
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
    .select(
      "name email stats.songsCreated stats.arrangementsCreated stats.setlistsCreated",
    );
};

userSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase().trim() });
};

userSchema.statics.findByClerkId = function (clerkId: string) {
  return this.findOne({ clerkId });
};

export const User = model<IUser, IUserModel>("User", userSchema);
