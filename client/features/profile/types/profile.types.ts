/**
 * Complete user profile with preferences and statistics
 * @interface UserProfile
 */
export interface UserProfile {
  /** MongoDB document ID */
  _id: string;
  /** Clerk authentication ID */
  clerkId?: string;
  /** User email address */
  email: string;
  /** Display name */
  name: string;
  /** User role for authorization */
  role: "USER" | "ADMIN" | "MODERATOR";
  /** User preferences for app behavior */
  preferences: {
    /** Default musical key for transposition */
    defaultKey?: string;
    /** Font size preference in pixels */
    fontSize: number;
    /** Visual theme selection */
    theme: "light" | "dark" | "stage";
  };
  /** Public profile information */
  profile: {
    /** User biography */
    bio?: string;
    /** Personal website URL */
    website?: string;
    /** Geographic location */
    location?: string;
  };
  /** Privacy settings for profile visibility */
  profilePrivacy?: UserPrivacySettings;
  /** User activity statistics */
  stats: {
    /** Number of songs created by user */
    songsCreated: number;
    /** Number of arrangements created */
    arrangementsCreated: number;
    /** Number of setlists created */
    setlistsCreated: number;
  };
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User's favorite songs and arrangements
 * @interface ProfileFavorites
 */
export interface ProfileFavorites {
  songs: Array<{
    _id: string;
    title: string;
    artist?: string;
    slug: string;
    themes: string[];
    metadata?: {
      ratings?: {
        average: number;
      };
      views: number;
    };
  }>;
  arrangements: Array<{
    _id: string;
    name: string;
    key?: string;
    difficulty: "beginner" | "intermediate" | "advanced";
    tags: string[];
    songIds: Array<{
      _id: string;
      title: string;
      artist?: string;
    }>;
    metadata?: {
      ratings?: {
        average: number;
      };
      views: number;
      isMashup: boolean;
    };
  }>;
}

export interface ProfileContributions {
  arrangements: Array<{
    _id: string;
    name: string;
    songIds: Array<{
      title: string;
      artist?: string;
    }>;
    createdAt: Date;
    metadata?: {
      ratings?: {
        average: number;
      };
      views: number;
    };
  }>;
  verses: Array<{
    _id: string;
    songId: {
      _id: string;
      title: string;
      artist?: string;
    };
    verseNumber: number;
    verseText: string;
    upvotes: number;
    createdAt: Date;
  }>;
  reviews: Array<{
    _id: string;
    arrangementId: {
      _id: string;
      name: string;
    };
    rating: number;
    comment?: string;
    helpfulVotes: string[];
    createdAt: Date;
  }>;
  setlists: Array<{
    _id: string;
    name: string;
    description?: string;
    songs: Array<any>;
    metadata: {
      date?: Date;
      venue?: string;
      isPublic: boolean;
    };
    createdAt: Date;
  }>;
}

export interface ProfileActivity {
  type:
    | "song_created"
    | "arrangement_created"
    | "setlist_created"
    | "verse_submitted"
    | "review_posted";
  timestamp: Date;
  details: {
    id: string;
    title: string;
    subtitle?: string;
  };
}

export type ProfileTab =
  | "overview"
  | "favorites"
  | "contributions"
  | "activity"
  | "settings";

// Privacy settings type to match backend schema
export interface UserPrivacySettings {
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
}
