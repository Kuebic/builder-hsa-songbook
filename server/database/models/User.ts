import { Schema, model, Document } from "mongoose";

// Interface for User document
export interface IUser extends Document {
  _id: string; // Clerk user ID
  profile: {
    displayName?: string;
    isPublic: boolean;
    publicFields: string[];
  };
  preferences: {
    defaultKey?: string;
    notation: "english" | "german" | "latin";
    fontSize: number;
    theme: "light" | "dark" | "stage";
  };
  stats: {
    songsContributed: number;
    setlistsCreated: number;
    totalDownloads: number;
    lastLoginAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Create the schema
const userSchema = new Schema<IUser>({
  _id: {
    type: String, // Use Clerk user ID as the MongoDB _id
    required: true,
  },
  profile: {
    displayName: {
      type: String,
      maxlength: 100,
      trim: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    publicFields: [{
      type: String,
      enum: ["displayName", "stats", "location", "bio"],
    }],
  },
  preferences: {
    defaultKey: {
      type: String,
      enum: [
        "C", "C#", "Db", "D", "D#", "Eb", "E", "F", 
        "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B",
      ],
    },
    notation: {
      type: String,
      enum: ["english", "german", "latin"],
      default: "english",
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
  stats: {
    songsContributed: {
      type: Number,
      default: 0,
      min: 0,
    },
    setlistsCreated: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalDownloads: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastLoginAt: {
      type: Date,
    },
  },
}, {
  timestamps: true,
  collection: "users",
  _id: false, // Disable automatic _id generation since we're using Clerk ID
});

// Indexes
userSchema.index({ "profile.isPublic": 1 });
userSchema.index({ "stats.songsContributed": -1 });
userSchema.index({ "stats.lastLoginAt": -1 });

// Utility methods
userSchema.methods.incrementSongCount = function () {
  this.stats.songsContributed += 1;
  return this.save();
};

userSchema.methods.incrementSetlistCount = function () {
  this.stats.setlistsCreated += 1;
  return this.save();
};

userSchema.methods.updateLastLogin = function () {
  this.stats.lastLoginAt = new Date();
  return this.save();
};

userSchema.methods.incrementDownloads = function () {
  this.stats.totalDownloads += 1;
  return this.save();
};

// Static methods
userSchema.statics.findPublicUsers = function (limit = 20) {
  return this.find({ "profile.isPublic": true })
    .sort({ "stats.songsContributed": -1 })
    .limit(limit);
};

userSchema.statics.getTopContributors = function (limit = 10) {
  return this.find({})
    .sort({ "stats.songsContributed": -1 })
    .limit(limit)
    .select("profile.displayName stats.songsContributed stats.setlistsCreated");
};

export const User = model<IUser>("User", userSchema);