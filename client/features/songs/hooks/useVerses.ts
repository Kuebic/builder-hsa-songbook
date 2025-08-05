import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Types
export interface Verse {
  id: string;
  songId: string;
  reference: string;
  text: string;
  submittedBy: {
    id: string;
    name: string;
    email: string;
  };
  upvoteCount: number;
  hasUpvoted: boolean;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VersesResponse {
  verses: Verse[];
  songTitle: string;
  songArtist?: string;
}

export interface SubmitVerseRequest {
  songId: string;
  reference: string;
  text: string;
  userId: string;
}

export interface UpvoteVerseRequest {
  verseId: string;
  userId: string;
}

// API functions
const fetchVersesBySong = async (songId: string): Promise<VersesResponse> => {
  const response = await fetch(`${window.location.origin}/api/songs/${songId}/verses`);
  const data = await response.json();
  if (!data.success) {throw new Error(data.error?.message || "Failed to fetch verses");}
  return data.data;
};

const submitVerse = async (data: SubmitVerseRequest): Promise<Verse> => {
  const response = await fetch(`${window.location.origin}/api/songs/${data.songId}/verses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      reference: data.reference,
      text: data.text,
      userId: data.userId,
    }),
  });
  const result = await response.json();
  if (!result.success) {throw new Error(result.error?.message || "Failed to submit verse");}
  return result.data;
};

const upvoteVerse = async (data: UpvoteVerseRequest): Promise<{ verseId: string; upvoteCount: number; hasUpvoted: boolean }> => {
  const response = await fetch(`${window.location.origin}/api/verses/${data.verseId}/upvote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: data.userId }),
  });
  const result = await response.json();
  if (!result.success) {throw new Error(result.error?.message || "Failed to upvote");}
  return result.data;
};

// Hooks
export const useVersesBySong = (songId: string) => {
  return useQuery({
    queryKey: ["verses", songId],
    queryFn: () => fetchVersesBySong(songId),
    enabled: !!songId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useSubmitVerse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: submitVerse,
    onSuccess: (_, variables) => {
      // Invalidate verses for the song to refetch
      queryClient.invalidateQueries({ queryKey: ["verses", variables.songId] });
    },
  });
};

export const useUpvoteVerse = () => {
  return useMutation({
    mutationFn: upvoteVerse,
    onSuccess: () => {
      // The component will handle refetching
    },
  });
};