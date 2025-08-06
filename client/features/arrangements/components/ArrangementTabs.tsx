import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Music, Copy, Download, Share2 } from "lucide-react";
import { LazyChordDisplay } from "@/features/songs/components/LazyChordDisplay";
import type { ArrangementWithMetrics } from "@/features/songs/types/song.types";

interface ArrangementTabsProps {
  arrangement: ArrangementWithMetrics;
  activeTab: string;
  onTabChange: (value: string) => void;
  transpose: number;
  onTranspose: (semitones: number) => void;
  onCopyChords: () => void;
  fontSize?: "sm" | "base" | "lg" | "xl";
  theme?: "light" | "dark" | "stage";
}

export function ArrangementTabs({
  arrangement,
  activeTab,
  onTabChange,
  transpose,
  onTranspose,
  onCopyChords,
  fontSize = "base",
  theme = "light",
}: ArrangementTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange}>
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="chords">
          <Music className="h-4 w-4 mr-2" />
          Chord Chart
        </TabsTrigger>
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="reviews">Reviews</TabsTrigger>
      </TabsList>

      <TabsContent value="chords" className="mt-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Chord Chart</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onCopyChords}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <LazyChordDisplay
              content={arrangement.chordData}
              transpose={transpose}
              fontSize={fontSize}
              theme={theme}
              showChords={true}
              showControls={true}
              onTranspose={onTranspose}
              className="min-h-[400px]"
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="details" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Arrangement Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Name</h3>
              <p className="text-muted-foreground">{arrangement.name}</p>
            </div>

            {arrangement.metadata.instruments && arrangement.metadata.instruments.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Instruments</h3>
                <div className="flex gap-2 flex-wrap">
                  {arrangement.metadata.instruments.map((instrument) => (
                    <Badge key={instrument} variant="secondary">
                      {instrument}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-2">Usage Statistics</h3>
              <p className="text-muted-foreground">
                Used {arrangement.stats?.usageCount || 0} times
              </p>
              {arrangement.stats?.lastUsed && (
                <p className="text-muted-foreground">
                  Last used: {new Date(arrangement.stats.lastUsed).toLocaleDateString()}
                </p>
              )}
            </div>

            <div>
              <h3 className="font-semibold mb-2">Created</h3>
              <p className="text-muted-foreground">
                {new Date(arrangement.createdAt).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="reviews" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">
              No reviews yet. Be the first to review this arrangement!
            </p>
            <div className="flex justify-center">
              <Button>Write a Review</Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}