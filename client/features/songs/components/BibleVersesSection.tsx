import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Book, 
  Plus, 
  ThumbsUp, 
  ThumbsDown, 
  Flag, 
  Info,
  User,
  Quote,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export interface BibleVerse {
  id: string;
  reference: string;
  text: string;
  submittedBy: {
    name: string;
    id: string;
  };
  submittedAt: string;
  upvotes: number;
  downvotes: number;
  hasUpvoted: boolean;
  hasDownvoted: boolean;
  relevanceNote?: string;
  status: "pending" | "approved" | "rejected";
}

export interface BibleVersesSectionProps {
  songId: string;
  songTitle: string;
  verses: BibleVerse[];
  onSubmitVerse?: (reference: string, text: string, relevanceNote: string) => Promise<void>;
  onVote?: (verseId: string, voteType: "up" | "down") => void;
  onReport?: (verseId: string) => void;
}

/**
 * Community-submitted Bible verses section that allows users to connect
 * scriptural references to songs and vote on relevance
 */
export default function BibleVersesSection({
  songTitle,
  verses,
  onSubmitVerse,
  onVote,
  onReport,
}: BibleVersesSectionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reference, setReference] = useState("");
  const [text, setText] = useState("");
  const [relevanceNote, setRelevanceNote] = useState("");

  // Sort verses by net score (upvotes - downvotes)
  const sortedVerses = [...verses].sort((a, b) => {
    const scoreA = a.upvotes - a.downvotes;
    const scoreB = b.upvotes - b.downvotes;
    return scoreB - scoreA;
  });

  const handleSubmit = async () => {
    if (!reference.trim() || !text.trim() || !relevanceNote.trim()) return;

    setIsSubmitting(true);
    try {
      if (onSubmitVerse) {
        await onSubmitVerse(reference, text, relevanceNote);
        setReference("");
        setText("");
        setRelevanceNote("");
        setIsDialogOpen(false);
      }
    } catch (error) {
      console.error("Failed to submit verse:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getScoreColor = (upvotes: number, downvotes: number) => {
    const score = upvotes - downvotes;
    if (score >= 10) return "text-green-600 dark:text-green-400";
    if (score >= 5) return "text-blue-600 dark:text-blue-400";
    if (score < 0) return "text-red-600 dark:text-red-400";
    return "text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Book className="h-5 w-5" />
            Biblical Connections ({sortedVerses.length})
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Bible verses that relate to this song's themes and message
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Verse
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Suggest a Bible Verse</DialogTitle>
              <DialogDescription>
                Share a scripture that connects to "{songTitle}" and explain its relevance.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-2">
                  Bible Reference
                </label>
                <Input
                  placeholder="e.g. Ephesians 2:8-9"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">
                  Verse Text
                </label>
                <Textarea
                  placeholder="For by grace you have been saved through faith..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">
                  How does this connect to the song?
                </label>
                <Textarea
                  placeholder="This verse perfectly captures the song's message about unmerited grace..."
                  value={relevanceNote}
                  onChange={(e) => setRelevanceNote(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleSubmit}
                  disabled={!reference.trim() || !text.trim() || !relevanceNote.trim() || isSubmitting}
                  className="flex-1"
                >
                  Submit Verse
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Guidelines */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Community members can suggest Bible verses that relate to this song. 
          Vote up relevant connections and vote down those that don't fit. 
          Moderators review submissions before they appear publicly.
        </AlertDescription>
      </Alert>

      {/* Verses list */}
      {sortedVerses.length > 0 ? (
        <div className="space-y-4">
          {sortedVerses.map((verse) => (
            <Card key={verse.id} className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                      <Quote className="h-4 w-4" />
                      {verse.reference}
                      {verse.status === "pending" && (
                        <Badge variant="outline" className="text-xs">
                          Pending Review
                        </Badge>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>Suggested by {verse.submittedBy.name}</span>
                      <span>•</span>
                      <span>{new Date(verse.submittedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Verse text */}
                <blockquote className="border-l-4 border-muted pl-4 italic text-sm">
                  "{verse.text}"
                </blockquote>

                {/* Relevance note */}
                {verse.relevanceNote && (
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-sm">
                      <span className="font-medium">Connection: </span>
                      {verse.relevanceNote}
                    </p>
                  </div>
                )}

                {/* Voting and actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant={verse.hasUpvoted ? "default" : "outline"}
                      size="sm"
                      onClick={() => onVote?.(verse.id, "up")}
                      className="gap-1"
                      disabled={verse.hasDownvoted}
                    >
                      <ThumbsUp className="h-3 w-3" />
                      <span className={getScoreColor(verse.upvotes, verse.downvotes)}>
                        {verse.upvotes}
                      </span>
                    </Button>
                    <Button
                      variant={verse.hasDownvoted ? "destructive" : "outline"}
                      size="sm"
                      onClick={() => onVote?.(verse.id, "down")}
                      className="gap-1"
                      disabled={verse.hasUpvoted}
                    >
                      <ThumbsDown className="h-3 w-3" />
                      <span className={getScoreColor(verse.upvotes, verse.downvotes)}>
                        {verse.downvotes}
                      </span>
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onReport?.(verse.id)}
                    className="gap-1 text-muted-foreground hover:text-destructive"
                  >
                    <Flag className="h-3 w-3" />
                    Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Empty state */
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <Book className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Bible Verses Yet</h3>
            <p className="text-muted-foreground mb-4 max-w-sm">
              Help connect this song to Scripture by suggesting relevant Bible verses 
              that relate to its themes and message.
            </p>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Suggest First Verse
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Suggest a Bible Verse</DialogTitle>
                  <DialogDescription>
                    Share a scripture that connects to "{songTitle}" and explain its relevance.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium block mb-2">
                      Bible Reference
                    </label>
                    <Input
                      placeholder="e.g. Ephesians 2:8-9"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-2">
                      Verse Text
                    </label>
                    <Textarea
                      placeholder="For by grace you have been saved through faith..."
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-2">
                      How does this connect to the song?
                    </label>
                    <Textarea
                      placeholder="This verse perfectly captures the song's message about unmerited grace..."
                      value={relevanceNote}
                      onChange={(e) => setRelevanceNote(e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={handleSubmit}
                      disabled={!reference.trim() || !text.trim() || !relevanceNote.trim() || isSubmitting}
                      className="flex-1"
                    >
                      Submit Verse
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
