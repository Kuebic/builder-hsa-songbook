import { ReactElement, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/shared/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Music, FileText, Star, Book } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSongBySlug } from "../hooks/useSongsAPI";
import { useArrangementsBySong, useUpdateArrangement } from "../hooks/useArrangements";
import SongHeader from "./SongHeader";
import SongMetadata from "./SongMetadata";
import ArrangementsList from "./ArrangementsList";
import SongRating from "./SongRating";
import ChordProEditor from "./ChordProEditor";
import SongNotesTab from "./SongNotesTab";
import { ArrangementDetail } from "../types/song.types";

type SongParams = {
  slug: string;
};

function SongDetailSkeleton(): ReactElement {
  return (
    <div className="max-w-6xl mx-auto space-y-6" data-testid="song-detail-skeleton">
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
            : "The requested song could not be found."
          }
          {" "}Please check the URL and try again, or return to the songs page.
        </AlertDescription>
      </Alert>
    </div>
  );
}

export default function SongDetailPage(): ReactElement {
  const { slug } = useParams<SongParams>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [editingArrangement, setEditingArrangement] = useState<ArrangementDetail | null>(null);
  const [showChordProEditor, setShowChordProEditor] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("info");
  const [isViewMode, setIsViewMode] = useState(false);
  
  const { data: song, isLoading: songLoading, error: songError } = useSongBySlug(slug || "");
  const { data: arrangements, isLoading: arrangementsLoading, refetch: refetchArrangements } = useArrangementsBySong(song?.id || "");
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

  const handleRateSong = async (_rating: number) => {
    // TODO: Implement rating
  };

  const handleArrangementView = (arrangement: ArrangementDetail) => {
    setEditingArrangement(arrangement);
    setShowChordProEditor(true);
    setActiveTab("arrangements"); // Remember we're in arrangements tab
    setIsViewMode(true); // Set read-only mode
  };

  const handleArrangementEdit = (arrangement: ArrangementDetail) => {
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
        description: error instanceof Error ? error.message : "An unknown error occurred",
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
        <div className="max-w-7xl mx-auto">
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
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="info" className="gap-2">
                  <Music className="h-4 w-4" />
                  Song Info
                </TabsTrigger>
                <TabsTrigger value="arrangements" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Arrangements {arrangements && `(${arrangements.length})`}
                </TabsTrigger>
                <TabsTrigger value="notes" className="gap-2">
                  <Book className="h-4 w-4" />
                  Notes & Verses
                </TabsTrigger>
                <TabsTrigger value="rating" className="gap-2">
                  <Star className="h-4 w-4" />
                  Rating & Reviews
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="mt-6">
                <SongMetadata song={song} />
              </TabsContent>
              
              <TabsContent value="arrangements" className="mt-6">
                {arrangementsLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                ) : (
                  <ArrangementsList
                    songId={song.id}
                    songChordData={song.chordData || ""}
                    arrangements={(arrangements || []) as ArrangementDetail[]}
                    defaultArrangementId={song.defaultArrangementId}
                    onArrangementView={handleArrangementView}
                    onArrangementEdit={handleArrangementEdit}
                  />
                )}
              </TabsContent>
              
              <TabsContent value="notes" className="mt-6">
                <SongNotesTab
                  songId={song.id}
                  songTitle={song.title}
                  songNotes={song.notes}
                />
              </TabsContent>
              
              <TabsContent value="rating" className="mt-6">
                <div className="max-w-md mx-auto">
                  <SongRating
                    currentRating={song.avgRating}
                    totalRatings={100} // TODO: Get actual count from API
                    onRate={handleRateSong}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
}
