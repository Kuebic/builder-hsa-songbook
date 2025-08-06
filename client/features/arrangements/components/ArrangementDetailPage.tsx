import { ReactElement, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Layout } from "@/shared/components/Layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ArrangementDetail } from "@/features/songs/types/song.types";
import ChordProEditor from "@/features/songs/components/ChordProEditor";
import {
  useUpdateArrangement,
  useArrangementBySlug,
} from "@/features/songs/hooks/useArrangements";
import { ArrangementHeader } from "./ArrangementHeader";
import { ArrangementTabs } from "./ArrangementTabs";

type ArrangementParams = {
  slug: string;
};

function ArrangementDetailSkeleton(): ReactElement {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Skeleton className="h-10 w-3/4" />
      <Skeleton className="h-6 w-1/2" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-24" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export default function ArrangementDetailPage(): ReactElement {
  const { slug } = useParams<ArrangementParams>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isFavorited, setIsFavorited] = useState(false);
  const [activeTab, setActiveTab] = useState("chords");
  const [showChordProEditor, setShowChordProEditor] = useState(false);
  const [editingArrangement, setEditingArrangement] =
    useState<ArrangementDetail | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [transpose, setTranspose] = useState(0);
  const fontSize = "base" as const;
  const theme = "light" as const;

  const {
    data: arrangement,
    isLoading,
    error,
    refetch,
  } = useArrangementBySlug(slug || "");
  const updateArrangementMutation = useUpdateArrangement();

  const handleToggleFavorite = () => {
    setIsFavorited(!isFavorited);
    toast({
      title: isFavorited ? "Removed from favorites" : "Added to favorites",
      description: `This arrangement has been ${isFavorited ? "removed from" : "added to"} your favorites.`,
    });
  };

  const handleCopyChords = () => {
    if (arrangement?.chordData) {
      navigator.clipboard.writeText(arrangement.chordData);
      toast({
        title: "Copied to clipboard",
        description: "The chord chart has been copied to your clipboard.",
      });
    }
  };

  const handleEdit = () => {
    if (arrangement) {
      setEditingArrangement(arrangement as ArrangementDetail);
      setShowChordProEditor(true);
      setIsViewMode(false);
    }
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

      toast({
        title: "Arrangement saved",
        description: "Your changes have been saved successfully.",
      });

      refetch();
    } catch (error) {
      toast({
        title: "Failed to save arrangement",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const handleAddToSetlist = () => {
    navigate(`/setlists/new?arrangementId=${arrangement?._id}`);
  };

  if (isLoading) {
    return (
      <Layout>
        <ArrangementDetailSkeleton />
      </Layout>
    );
  }

  if (error || !arrangement) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto py-16">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Arrangement not found</AlertTitle>
            <AlertDescription>
              We couldn&apos;t find an arrangement with the slug &quot;{slug}
              &quot;. Please check the URL and try again.
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button asChild variant="outline">
              <Link to="/arrangements">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Arrangements
              </Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // Handle both songs array and songIds array (populated from API)
  const songData = arrangement.songs?.[0] || arrangement.songIds?.[0];
  const songTitle = songData?.title || "Unknown Song";
  const songArtist = songData?.artist || "Unknown Artist";

  // Show ChordPro editor when editing
  if (showChordProEditor && editingArrangement) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <ChordProEditor
            initialContent={editingArrangement.chordData}
            songTitle={`${songTitle} - ${editingArrangement.name}`}
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
      <div className="max-w-6xl mx-auto space-y-6">
        <ArrangementHeader
          arrangement={arrangement}
          songTitle={songTitle}
          songArtist={songArtist}
          isFavorited={isFavorited}
          onToggleFavorite={handleToggleFavorite}
          onEdit={handleEdit}
          onAddToSetlist={handleAddToSetlist}
          onBack={() => navigate(-1)}
        />

        <ArrangementTabs
          arrangement={arrangement}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          transpose={transpose}
          onTranspose={setTranspose}
          onCopyChords={handleCopyChords}
          fontSize={fontSize}
          theme={theme}
        />
      </div>
    </Layout>
  );
}
