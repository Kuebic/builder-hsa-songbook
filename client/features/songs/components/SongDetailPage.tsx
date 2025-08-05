import { ReactElement, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/shared/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Music, FileText, Star, Book } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSongBySlug } from "../hooks/useSongsAPI";
import {
  useArrangementsBySong,
  useUpdateArrangement,
} from "../hooks/useArrangements";
import SongHeader from "./SongHeader";
import SongOverview from "./SongOverview";
import ArrangementGrid from "./ArrangementGrid";
import SongReviewsSection from "./SongReviewsSection";
import BibleVersesSection, { BibleVerse } from "./BibleVersesSection";
import ChordProEditor from "./ChordProEditor";
import { Arrangement } from "../types/song.types";

type SongParams = {
  slug: string;
};

function SongDetailSkeleton(): ReactElement {
  return (
    <div
      className="max-w-6xl mx-auto space-y-6"
      data-testid="song-detail-skeleton"
    >
      {/* Header skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

interface SongNotFoundProps {
  slug?: string;
}

function SongNotFound({ slug }: SongNotFoundProps): ReactElement {
  return (
    <div className="max-w-2xl mx-auto py-16">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Song not found</AlertTitle>
        <AlertDescription>
          {slug
            ? `We couldn't find a song with the slug "${slug}".`
            : "The requested song could not be found."}{" "}
          Please check the URL and try again, or return to the songs page.
        </AlertDescription>
      </Alert>
    </div>
  );
}

// Mock Bible verses data (would come from API in real implementation)
const mockBibleVerses: BibleVerse[] = [
  {
    id: "1",
    reference: "Ephesians 2:8-9",
    text: "For by grace you have been saved through faith. And this is not your own doing; it is the gift of God, not a result of works, so that no one may boast.",
    submittedBy: { name: "Sarah M.", id: "user1" },
    submittedAt: "2024-01-15T10:30:00Z",
    upvotes: 45,
    downvotes: 2,
    hasUpvoted: false,
    hasDownvoted: false,
    relevanceNote:
      "This verse perfectly captures the core message of Amazing Grace - that salvation is a gift from God, not earned through our works.",
    status: "approved",
  },
  {
    id: "2",
    reference: "1 Chronicles 16:34",
    text: "Oh give thanks to the Lord, for he is good; for his steadfast love endures forever!",
    submittedBy: { name: "David L.", id: "user2" },
    submittedAt: "2024-01-12T14:20:00Z",
    upvotes: 28,
    downvotes: 1,
    hasUpvoted: true,
    hasDownvoted: false,
    relevanceNote:
      "The enduring nature of God's grace is beautifully reflected in both this verse and the song's message.",
    status: "approved",
  },
];

export default function SongDetailPage(): ReactElement {
  const { slug } = useParams<SongParams>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [editingArrangement, setEditingArrangement] =
    useState<Arrangement | null>(null);
  const [showChordProEditor, setShowChordProEditor] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [isViewMode, setIsViewMode] = useState(false);

  const {
    data: song,
    isLoading: songLoading,
    error: songError,
  } = useSongBySlug(slug || "");
  const {
    data: arrangements,
    isLoading: arrangementsLoading,
    refetch: refetchArrangements,
  } = useArrangementsBySong(song?.id || "");
  const updateArrangementMutation = useUpdateArrangement();

  const handleToggleFavorite = () => {
    // TODO: Implement favorite toggle
  };

  const handleEditSong = () => {
    // TODO: Navigate to edit page
    navigate(`/songs/${slug}/edit`);
  };

  const handleDeleteSong = () => {
    // TODO: Implement delete
  };

  const handleShareSong = () => {
    // TODO: Implement share
  };

  const handleExportSong = () => {
    // TODO: Implement export
  };

  const handleCreateArrangement = () => {
    // TODO: Navigate to create arrangement page
    navigate(`/songs/${slug}/arrangements/new`);
  };

  const handleArrangementView = (arrangement: Arrangement) => {
    setEditingArrangement(arrangement);
    setShowChordProEditor(true);
    setActiveTab("arrangements"); // Remember we're in arrangements tab
    setIsViewMode(true); // Set read-only mode
  };

  const handleArrangementEdit = (arrangement: Arrangement) => {
    setEditingArrangement(arrangement);
    setShowChordProEditor(true);
    setActiveTab("arrangements"); // Remember we're in arrangements tab
    setIsViewMode(false); // Set edit mode
  };

  const handleSaveArrangement = async (content: string) => {
    if (!editingArrangement) {
      return;
    }

    try {
      await updateArrangementMutation.mutateAsync({
        id: editingArrangement._id,
        chordData: content,
      });
      setShowChordProEditor(false);
      setEditingArrangement(null);
      setIsViewMode(false);

      // Show success toast
      toast({
        title: "Arrangement saved",
        description: "Your changes have been saved successfully.",
      });

      // Refresh arrangements list
      refetchArrangements();
    } catch (error) {
      // Keep the editor open on error so user doesn't lose their work
      toast({
        title: "Failed to save arrangement",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  if (songLoading) {
    return (
      <Layout>
        <SongDetailSkeleton />
      </Layout>
    );
  }

  if (songError || !song) {
    return (
      <Layout>
        <SongNotFound slug={slug} />
      </Layout>
    );
  }

  if (showChordProEditor && editingArrangement) {
    return (
      <Layout>
        <div className={`mx-auto ${isViewMode ? "max-w-4xl" : "max-w-7xl"}`}>
          <ChordProEditor
            initialContent={editingArrangement.chordData}
            songTitle={`${song.title} - ${editingArrangement.name}`}
            onSave={handleSaveArrangement}
            onCancel={() => {
              setShowChordProEditor(false);
              setEditingArrangement(null);
              setIsViewMode(false);
            }}
            isLoading={updateArrangementMutation.isPending}
            readOnly={isViewMode}
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Song Header */}
        <SongHeader
          song={song}
          onToggleFavorite={handleToggleFavorite}
          onEdit={handleEditSong}
          onDelete={handleDeleteSong}
          onShare={handleShareSong}
          onExport={handleExportSong}
        />

        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Tabs for content organization */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview" className="gap-2">
                  <Music className="h-4 w-4" />
                  Song Overview
                </TabsTrigger>
                <TabsTrigger value="arrangements" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Arrangements {arrangements && `(${arrangements.length})`}
                </TabsTrigger>
                <TabsTrigger value="verses" className="gap-2">
                  <Book className="h-4 w-4" />
                  Bible Verses
                </TabsTrigger>
                <TabsTrigger value="reviews" className="gap-2">
                  <Star className="h-4 w-4" />
                  Community Reviews
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                <SongOverview song={song} />
              </TabsContent>

              <TabsContent value="arrangements" className="mt-6">
                {arrangementsLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                ) : (
                  <ArrangementGrid
                    arrangements={arrangements || []}
                    onView={handleArrangementView}
                    onEdit={handleArrangementEdit}
                    onCreateNew={handleCreateArrangement}
                    defaultArrangementId={song.defaultArrangementId}
                  />
                )}
              </TabsContent>

              <TabsContent value="verses" className="mt-6">
                <BibleVersesSection
                  songTitle={song.title}
                  verses={mockBibleVerses} // Mock data for now
                  onSubmitVerse={async (reference, text, relevanceNote) => {
                    console.log("Submitting verse:", {
                      reference,
                      text,
                      relevanceNote,
                    });
                    // TODO: Implement verse submission
                  }}
                  onVote={(verseId, voteType) => {
                    console.log("Voting on verse:", verseId, voteType);
                    // TODO: Implement voting
                  }}
                  onReport={(verseId) => {
                    console.log("Reporting verse:", verseId);
                    // TODO: Implement reporting
                  }}
                />
              </TabsContent>

              <TabsContent value="reviews" className="mt-6">
                <SongReviewsSection
                  songTitle={song.title}
                  averageRating={song.avgRating}
                  totalReviews={23} // Mock data
                  onSubmitReview={async (rating, comment) => {
                    console.log("Submitting review:", { rating, comment });
                    // TODO: Implement review submission
                  }}
                  onMarkHelpful={(reviewId) => {
                    console.log("Marking helpful:", reviewId);
                    // TODO: Implement helpful marking
                  }}
                  onReport={(reviewId) => {
                    console.log("Reporting review:", reviewId);
                    // TODO: Implement reporting
                  }}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
}
