// Type definitions for Bible verses feature

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
  status?: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface VerseFormData {
  reference: string;
  text: string;
  relevance: string;
}

export interface VerseVoteData {
  verseId: string;
  userId: string;
  voteType: 'upvote' | 'downvote';
}