// Type definitions for Bible verses feature

/**
 * Bible verse or quote related to a song
 * @interface Verse
 */
export interface Verse {
  id: string;
  reference: string;
  text: string;
  relevance: string;
  submittedBy: {
    id: string;
    name: string;
  };
  upvotes: number;
  upvoteCount?: number; // Alternative property name used in some places
  hasUpvoted?: boolean;
  status?: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Form data for submitting a new verse
 * @interface VerseFormData
 */
export interface VerseFormData {
  reference: string;
  text: string;
  relevance: string;
}

/**
 * Data payload for voting on a verse
 * @interface VerseVoteData
 */
export interface VerseVoteData {
  verseId: string;
  userId: string;
  voteType: "upvote" | "downvote";
}
