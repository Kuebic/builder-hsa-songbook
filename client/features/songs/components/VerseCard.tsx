import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Verse } from "@features/songs/types/song.types";

export interface VerseCardProps {
  verse: Verse;
  onVote: (voteType: "up" | "down" | null) => void;
  isVoting?: boolean;
}

const VERSE_TYPE_LABELS = {
  bible: "Bible",
  tf: "Talks from Favorites",
  tm: "The Mission",
} as const;

function VerseCard({
  verse,
  onVote,
  isVoting = false,
}: VerseCardProps) {
  const netScore = verse.upvotes - verse.downvotes;

  const handleVote = (voteType: "up" | "down") => {
    // Toggle vote if already voted the same way
    if (verse.userVote === voteType) {
      onVote(null);
    } else {
      onVote(voteType);
    }
  };

  return (
    <Card
      className={cn(
        "transition-colors",
        !verse.isApproved &&
          "border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20",
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Vote buttons */}
          <div className="flex flex-col items-center gap-1 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 w-8 p-0",
                verse.userVote === "up" &&
                  "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
              )}
              onClick={() => handleVote("up")}
              disabled={isVoting}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>

            <span
              className={cn(
                "text-sm font-medium min-w-0",
                netScore > 0 && "text-green-600 dark:text-green-400",
                netScore < 0 && "text-red-600 dark:text-red-400",
              )}
            >
              {netScore >= 0 ? `+${netScore}` : netScore}
            </span>

            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 w-8 p-0",
                verse.userVote === "down" &&
                  "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
              )}
              onClick={() => handleVote("down")}
              disabled={isVoting}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>

          {/* Verse content */}
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">
                    {verse.reference}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {VERSE_TYPE_LABELS[verse.type]}
                  </Badge>
                  {!verse.isApproved && (
                    <Badge
                      variant="secondary"
                      className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
                    >
                      Pending Review
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Submitted by {verse.userName}
                </p>
              </div>
            </div>

            <blockquote className="pl-3 border-l-2 border-muted-foreground/20 text-sm leading-relaxed italic">
              "{verse.text}"
            </blockquote>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-3">
                <span>{verse.upvotes} upvotes</span>
                <span>{verse.downvotes} downvotes</span>
              </div>
              <span>{verse.createdAt.toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default memo(VerseCard);
