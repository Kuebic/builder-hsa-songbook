import { ReactElement, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/shared/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSongBySlug } from "@features/songs/hooks/useSongsAPI";
import {
  useArrangementsBySong,
  useUpdateArrangement,
} from "@features/songs/hooks/useArrangements";
import {
  useVerses,
  useToggleSongFavorite,
  useSongComments,
} from "@features/songs/hooks/useVerses";
import SongDetailHeader from "./SongDetailHeader";
import VersesSection from "./VersesSection";
import CommunitySection from "./CommunitySection";
import ArrangementsSection from "./ArrangementsSection";
import ChordProEditor from "./ChordProEditor";
import SongNotesTab from "./SongNotesTab";
import {
  ArrangementDetail,
  ArrangementWithMetrics,
  SongWithRelations,
} from "@features/songs/types/song.types";

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

export default function SongDetailPage(): ReactElement {
  const { slug } = useParams<SongParams>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [editingArrangement, setEditingArrangement] =
    useState<ArrangementDetail | null>(null);
  const [showChordProEditor, setShowChordProEditor] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("notes");
  const [isViewMode, setIsViewMode] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  const {
    data: song,
    isLoading: songLoading,
    error: songError,
  } = useSongBySlug(slug || "");
  const { data: arrangements, refetch: refetchArrangements } =
    useArrangementsBySong(song?.id || "");
  const { data: verses } = useVerses(song?.id || "");
  const { data: comments } = useSongComments(song?.id || "");
  const updateArrangementMutation = useUpdateArrangement();
  const toggleFavoriteMutation = useToggleSongFavorite();

  const handleToggleFavorite = async () => {
    if (!song) {
      return;
    }

    try {
      await toggleFavoriteMutation.mutateAsync({
        songId: song.id,
        isFavorited,
      });
      setIsFavorited(!isFavorited);
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  };

  const handleAddArrangement = () => {
    navigate(`/songs/${slug}/arrangements/new`);
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

      refetchArrangements();
    } catch (error) {
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
        <div className="max-w-4xl mx-auto">
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

  // Transform song data to match new structure
  const songWithRelations: SongWithRelations | undefined = song
    ? {
        ...song,
        source: (song as any).source || "Unknown",
        totalArrangements: arrangements?.length || 0,
        compositionYear: (song as any).year,
        ccli: (song as any).ccli,
        favoriteCount: 0, // TODO: Get from API
        isFavorited,
        verses: verses || [],
        arrangements: (arrangements || []).map(
          (arr) =>
            ({
              ...(arr as any),
              slug: (arr as any).slug, // Use slug from server
              favoriteCount: 0, // TODO: Get from API
              setlistCount: (arr as any).usageInSetlists || 0,
              rating: {
                average: (arr.metadata as any)?.ratings?.average || 0,
                count: (arr.metadata as any)?.ratings?.count || 0,
              },
              reviews: [],
              capo: arr.metadata?.capo,
              songs: [], // For mashups
              isDefault: false,
              usageInSetlists: (arr as any).usageInSetlists || 0,
            }) as ArrangementWithMetrics,
        ),
        comments: comments || [],
      }
    : undefined;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Song Header with core info */}
        {songWithRelations && (
          <SongDetailHeader
            song={songWithRelations}
            onToggleFavorite={handleToggleFavorite}
            onAddArrangement={handleAddArrangement}
          />
        )}

        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Tabs for Notes, Verses, Community */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="verses" className="gap-2">
                  Verses & Quotes
                  {verses && verses.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {verses.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="community" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Community
                  {comments && comments.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {comments.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="notes" className="mt-6">
                <SongNotesTab
                  songId={song.id}
                  songTitle={song.title}
                  songNotes={song.notes}
                />
              </TabsContent>

              <TabsContent value="verses" className="mt-6">
                <VersesSection songId={song.id} />
              </TabsContent>

              <TabsContent value="community" className="mt-6">
                <CommunitySection songId={song.id} />
              </TabsContent>
            </Tabs>

            {/* Arrangements Section - Always visible below tabs */}
            {songWithRelations && (
              <ArrangementsSection
                arrangements={songWithRelations.arrangements}
              />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
