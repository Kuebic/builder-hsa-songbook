import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Book,
  Plus,
  ChevronUp,
  CheckCircle,
  Clock,
  XCircle,
  User,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUserId } from "@/shared/hooks/useAuth";
import { useVersesBySong, useSubmitVerse, useUpvoteVerse } from "../hooks/useVerses";
import { formatDistanceToNow } from "@/shared/utils/formatRelativeTime";

interface SongNotesTabProps {
  songId: string;
  songTitle: string;
  songNotes?: string;
}

interface VerseFormData {
  reference: string;
  text: string;
}

export default function SongNotesTab({ songId, songTitle, songNotes }: SongNotesTabProps) {
  const userId = useUserId();
  const { toast } = useToast();
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [formData, setFormData] = useState<VerseFormData>({
    reference: "",
    text: "",
  });

  const { data: verses, isLoading, refetch } = useVersesBySong(songId);
  const submitVerseMutation = useSubmitVerse();
  const upvoteVerseMutation = useUpvoteVerse();

  const handleSubmitVerse = useCallback(async () => {
    if (!userId) {
      toast({
        title: "Authentication required",
        description: "Please sign in to submit verses",
        variant: "default",
      });
      return;
    }

    if (!formData.reference.trim() || !formData.text.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both a reference and verse text",
        variant: "destructive",
      });
      return;
    }

    try {
      await submitVerseMutation.mutateAsync({
        songId,
        reference: formData.reference.trim(),
        text: formData.text.trim(),
        userId,
      });

      toast({
        title: "Verse submitted",
        description: "Your verse has been submitted for review",
      });

      setFormData({ reference: "", text: "" });
      setIsSubmitDialogOpen(false);
      refetch();
    } catch (error) {
      toast({
        title: "Failed to submit verse",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  }, [userId, formData, songId, submitVerseMutation, toast, refetch]);

  const handleUpvote = useCallback(async (verseId: string) => {
    if (!userId) {
      toast({
        title: "Authentication required",
        description: "Please sign in to upvote verses",
        variant: "default",
      });
      return;
    }

    try {
      await upvoteVerseMutation.mutateAsync({ verseId, userId });
      refetch();
    } catch (error) {
      toast({
        title: "Failed to update vote",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  }, [userId, upvoteVerseMutation, toast, refetch]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge variant="default" className="gap-1 bg-green-500 text-white">
            <CheckCircle className="h-3 w-3" aria-hidden="true" />
            Approved
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" aria-hidden="true" />
            Pending
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" aria-hidden="true" />
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  const renderVerseCard = (verse: any) => (
    <Card key={verse.id} className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-semibold text-lg">{verse.reference}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-3 w-3" aria-hidden="true" />
              <span>{verse.submittedBy.name}</span>
              <span>•</span>
              <span>{formatDistanceToNow(new Date(verse.createdAt))}</span>
            </div>
          </div>
          {verse.status && getStatusBadge(verse.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm leading-relaxed">{verse.text}</p>
        
        {verse.rejectionReason && (
          <Alert className="py-2">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertDescription className="text-sm">
              {verse.rejectionReason}
            </AlertDescription>
          </Alert>
        )}
        
        {verse.status === "approved" && (
          <div className="flex items-center gap-2">
            <Button
              variant={verse.hasUpvoted ? "default" : "outline"}
              size="sm"
              onClick={() => handleUpvote(verse.id)}
              disabled={upvoteVerseMutation.isPending}
              className="gap-1"
              aria-label={`Upvote this verse, ${verse.upvoteCount} upvotes`}
              aria-pressed={verse.hasUpvoted}
            >
              <ChevronUp className="h-4 w-4" aria-hidden="true" />
              {verse.upvoteCount}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Song Notes Section */}
      {songNotes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Book className="h-5 w-5" />
              Song Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{songNotes}</p>
          </CardContent>
        </Card>
      )}

      {/* Bible Verses Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Book className="h-5 w-5" />
            Related Bible Verses
          </h2>
          <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1" aria-label="Add a Bible verse related to this song">
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add Verse
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Submit a Bible Verse</DialogTitle>
                <DialogDescription>
                  Add a Bible verse that relates to &quot;{songTitle}&quot;
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="reference" className="text-sm font-medium">
                    Reference (e.g., John 3:16)
                  </label>
                  <Input
                    id="reference"
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    placeholder="Enter verse reference"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="text" className="text-sm font-medium">
                    Verse Text
                  </label>
                  <Textarea
                    id="text"
                    value={formData.text}
                    onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                    placeholder="Enter the verse text"
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsSubmitDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmitVerse}
                  disabled={submitVerseMutation.isPending}
                >
                  {submitVerseMutation.isPending ? "Submitting..." : "Submit"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Verses List */}
        {verses && verses.verses.length > 0 ? (
          <div className="grid gap-4">
            {verses.verses.map(renderVerseCard)}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <CardContent>
              <Book className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No verses yet</h3>
              <p className="text-muted-foreground mb-4">
                Be the first to add a Bible verse related to this song.
              </p>
              {userId && (
                <Button
                  size="sm"
                  onClick={() => setIsSubmitDialogOpen(true)}
                  className="gap-1"
                  aria-label="Add the first Bible verse for this song"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Add First Verse
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}