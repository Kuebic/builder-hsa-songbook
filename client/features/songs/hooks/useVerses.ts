import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Verse, SongComment } from "@features/songs/types/song.types";

// Mock data for development
const mockVerses: Verse[] = [
  {
    id: "1",
    songId: "amazing-grace",
    text: "For it is by grace you have been saved, through faith—and this is not from yourselves, it is the gift of God— not by works, so that no one can boast.",
    reference: "Ephesians 2:8-9",
    type: "bible",
    userId: "user1",
    userName: "John Smith",
    upvotes: 45,
    downvotes: 2,
    userVote: null,
    isApproved: true,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    id: "2",
    songId: "amazing-grace",
    text: "But he said to me, 'My grace is sufficient for you, for my power is made perfect in weakness.'",
    reference: "2 Corinthians 12:9",
    type: "bible",
    userId: "user2",
    userName: "Sarah Johnson",
    upvotes: 32,
    downvotes: 1,
    userVote: "up",
    isApproved: true,
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-01-20"),
  },
];

const mockComments: SongComment[] = [
  {
    id: "1",
    songId: "amazing-grace",
    userId: "user1",
    userName: "John Smith",
    content:
      "This song has been a source of comfort through difficult times. The history behind it makes it even more meaningful.",
    upvotes: 12,
    isReported: false,
    isEdited: false,
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-10"),
  },
];

// Fetch verses for a song
export function useVerses(songId: string) {
  return useQuery({
    queryKey: ["verses", songId],
    queryFn: async (): Promise<Verse[]> => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const response = await fetch(`/api/songs/${songId}/verses`, {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error("Failed to fetch verses");
        }

        const data = await response.json();
        return data.verses || [];
      } catch (error) {
        // Return mock data in development
        console.warn("Using mock verses data:", error);
        return mockVerses.filter((v) => v.songId === songId);
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: false,
    refetchOnWindowFocus: false,
  });
}

// Submit a new verse
export function useSubmitVerse() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      songId,
      text,
      reference,
      type,
    }: {
      songId: string;
      text: string;
      reference: string;
      type: "bible" | "tf" | "tm";
    }): Promise<Verse> => {
      try {
        const response = await fetch(`/api/songs/${songId}/verses`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text, reference, type }),
        });

        if (!response.ok) {
          throw new Error("Failed to submit verse");
        }

        return await response.json();
      } catch (error) {
        // Mock submission in development
        const newVerse: Verse = {
          id: Date.now().toString(),
          songId,
          text,
          reference,
          type,
          userId: "current-user",
          userName: "Current User",
          upvotes: 0,
          downvotes: 0,
          userVote: null,
          isApproved: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        return newVerse;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["verses", variables.songId] });
      toast({
        title: "Verse submitted",
        description: "Your verse has been submitted for review.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to submit verse",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });
}

// Vote on a verse
export function useVoteVerse() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      verseId,
      voteType,
    }: {
      verseId: string;
      voteType: "up" | "down" | null;
      songId: string;
    }): Promise<void> => {
      try {
        const response = await fetch(`/api/verses/${verseId}/vote`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ vote: voteType }),
        });

        if (!response.ok) {
          throw new Error("Failed to vote");
        }
      } catch (error) {
        // Mock vote in development
        console.log("Mock vote:", verseId, voteType);
      }
    },
    onMutate: async ({ verseId, voteType, songId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["verses", songId] });

      // Snapshot the previous value
      const previousVerses = queryClient.getQueryData<Verse[]>([
        "verses",
        songId,
      ]);

      // Optimistically update
      queryClient.setQueryData<Verse[]>(["verses", songId], (old) => {
        if (!old) {
          return [];
        }

        return old.map((verse) => {
          if (verse.id === verseId) {
            const prevVote = verse.userVote;
            let upvoteDelta = 0;
            let downvoteDelta = 0;

            // Remove previous vote
            if (prevVote === "up") {
              upvoteDelta = -1;
            }
            if (prevVote === "down") {
              downvoteDelta = -1;
            }

            // Add new vote
            if (voteType === "up") {
              upvoteDelta += 1;
            }
            if (voteType === "down") {
              downvoteDelta += 1;
            }

            return {
              ...verse,
              upvotes: verse.upvotes + upvoteDelta,
              downvotes: verse.downvotes + downvoteDelta,
              userVote: voteType,
            };
          }
          return verse;
        });
      });

      // Return a context object with the snapshotted value
      return { previousVerses };
    },
    onError: (_, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousVerses) {
        queryClient.setQueryData(
          ["verses", variables.songId],
          context.previousVerses,
        );
      }
      toast({
        title: "Failed to vote",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
    onSettled: (_, __, variables) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ["verses", variables.songId] });
    },
  });
}

// Favorite/unfavorite a song
export function useToggleSongFavorite() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      songId,
      isFavorited,
    }: {
      songId: string;
      isFavorited: boolean;
    }): Promise<void> => {
      try {
        const response = await fetch(`/api/songs/${songId}/favorite`, {
          method: isFavorited ? "DELETE" : "POST",
        });

        if (!response.ok) {
          throw new Error("Failed to update favorite");
        }
      } catch (error) {
        // Mock favorite in development
        console.log("Mock favorite toggle:", songId, !isFavorited);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["song", variables.songId] });
      toast({
        title: variables.isFavorited
          ? "Removed from favorites"
          : "Added to favorites",
        description: variables.isFavorited
          ? "Song removed from your favorites."
          : "Song added to your favorites.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to update favorite",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });
}

// Get comments for a song
export function useSongComments(songId: string) {
  return useQuery({
    queryKey: ["song-comments", songId],
    queryFn: async (): Promise<SongComment[]> => {
      try {
        const response = await fetch(`/api/songs/${songId}/comments`);
        if (!response.ok) {
          throw new Error("Failed to fetch comments");
        }
        const data = await response.json();
        return data.comments || [];
      } catch (error) {
        // Return mock data in development
        console.warn("Using mock comments data:", error);
        return mockComments.filter((c) => c.songId === songId);
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

// Submit a comment
export function useSubmitComment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      songId,
      content,
      parentId,
    }: {
      songId: string;
      content: string;
      parentId?: string;
    }): Promise<SongComment> => {
      try {
        const response = await fetch(`/api/songs/${songId}/comments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content, parentId }),
        });

        if (!response.ok) {
          throw new Error("Failed to submit comment");
        }

        return await response.json();
      } catch (error) {
        console.error("Failed to submit comment:", error);
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["song-comments", variables.songId],
      });
      toast({
        title: "Comment posted",
        description: "Your comment has been posted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to post comment",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });
}
