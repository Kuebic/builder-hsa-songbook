import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useVerses, useVoteVerse } from "@features/songs/hooks/useVerses";
import VerseCard from "./VerseCard";
import VerseSubmitForm from "./VerseSubmitForm";

export interface VersesSectionProps {
  songId: string;
}

export default function VersesSection({ songId }: VersesSectionProps) {
  const { data: verses = [], isLoading } = useVerses(songId);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const voteVerse = useVoteVerse();

  const handleVote = (verseId: string, voteType: "up" | "down" | null) => {
    voteVerse.mutate({ verseId, voteType, songId });
  };

  const handleSubmitSuccess = () => {
    setShowSubmitForm(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Loading skeleton */}
        <div className="flex justify-between items-center">
          <div className="h-6 w-48 bg-muted rounded animate-pulse" />
          <div className="h-10 w-32 bg-muted rounded animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 border rounded-lg space-y-2">
              <div className="h-4 w-32 bg-muted rounded animate-pulse" />
              <div className="h-16 bg-muted rounded animate-pulse" />
              <div className="flex items-center justify-between">
                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                <div className="flex gap-2">
                  <div className="h-8 w-16 bg-muted rounded animate-pulse" />
                  <div className="h-8 w-16 bg-muted rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Biblical References</h3>
        <Button onClick={() => setShowSubmitForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Submit Verse
        </Button>
      </div>

      {showSubmitForm && (
        <VerseSubmitForm
          songId={songId}
          onSubmit={handleSubmitSuccess}
          onCancel={() => setShowSubmitForm(false)}
        />
      )}

      {verses.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-lg mb-2">No biblical references yet</p>
          <p className="text-sm">
            Be the first to share a verse that connects to this song's message.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {verses
            .sort((a, b) => b.upvotes - b.downvotes - (a.upvotes - a.downvotes))
            .map((verse) => (
              <VerseCard
                key={verse.id}
                verse={verse}
                onVote={(type) => handleVote(verse.id, type)}
                isVoting={voteVerse.isPending}
              />
            ))}
        </div>
      )}
    </div>
  );
}
