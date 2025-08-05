import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Music,
  AlertCircle,
} from "lucide-react";
import { ArrangementDetail } from "../types/song.types";
import ArrangementCard from "./ArrangementCard";
import { 
  useCreateArrangement, 
  useDeleteArrangement,
} from "../hooks/useArrangements";
import { useAuthContext } from "@/shared/contexts/AuthContext";

interface ArrangementsListProps {
  songId: string;
  songChordData: string;
  arrangements: ArrangementDetail[];
  defaultArrangementId?: string;
  onArrangementView?: (arrangement: ArrangementDetail) => void;
  onArrangementEdit?: (arrangement: ArrangementDetail) => void;
}

export default function ArrangementsList({
  songId,
  songChordData,
  arrangements,
  defaultArrangementId,
  onArrangementView,
  onArrangementEdit,
}: ArrangementsListProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newArrangementName, setNewArrangementName] = useState("");
  const [newArrangementDescription, setNewArrangementDescription] = useState("");
  
  const { currentUser } = useAuthContext();
  const createArrangementMutation = useCreateArrangement();
  const deleteArrangementMutation = useDeleteArrangement();

  const handleCreateArrangement = async () => {
    if (!newArrangementName.trim()) {
      return;
    }
    
    if (!currentUser) {
      return;
    }
    
    try {
      await createArrangementMutation.mutateAsync({
        name: newArrangementName,
        description: newArrangementDescription,
        songIds: [songId],
        chordData: songChordData || "{title: New Arrangement}\n{artist: }\n\n", // Use song's chord data or minimal valid ChordPro
        key: "C" as const, // Default key, user can change later
        difficulty: "intermediate" as const, // Default difficulty
        tags: [],
        createdBy: currentUser._id, // Use actual user ID from auth context
        isPublic: true, // Make arrangement public by default
      });
      
      setIsCreateDialogOpen(false);
      setNewArrangementName("");
      setNewArrangementDescription("");
    } catch (error) {
      console.error("Failed to create arrangement:", error);
    }
  };

  const handleDeleteArrangement = async (arrangementId: string) => {
    if (!confirm("Are you sure you want to delete this arrangement?")) {
      return;
    }
    
    try {
      await deleteArrangementMutation.mutateAsync(arrangementId);
    } catch (error) {
      console.error("Failed to delete arrangement:", error);
    }
  };


  if (arrangements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Arrangements
          </CardTitle>
          <CardDescription>
            No arrangements yet. Create the first one!
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <div className="text-center mb-4">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">
              Arrangements allow you to save different versions of this song
            </p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create First Arrangement
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Arrangement</DialogTitle>
                <DialogDescription>
                  Create a new arrangement for this song. You can customize the chords, key, and tempo.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Arrangement Name</Label>
                  <Input
                    id="name"
                    value={newArrangementName}
                    onChange={(e) => setNewArrangementName(e.target.value)}
                    placeholder="e.g., Acoustic Version, Youth Service"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={newArrangementDescription}
                    onChange={(e) => setNewArrangementDescription(e.target.value)}
                    placeholder="Describe this arrangement..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateArrangement}
                    disabled={!newArrangementName.trim() || createArrangementMutation.isPending}
                  >
                    {createArrangementMutation.isPending ? "Creating..." : "Create"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Music className="h-5 w-5" />
          Arrangements ({arrangements.length})
        </h2>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Arrangement
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Arrangement</DialogTitle>
              <DialogDescription>
                Create a new arrangement for this song. You can customize the chords, key, and tempo.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Arrangement Name</Label>
                <Input
                  id="name"
                  value={newArrangementName}
                  onChange={(e) => setNewArrangementName(e.target.value)}
                  placeholder="e.g., Acoustic Version, Youth Service"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={newArrangementDescription}
                  onChange={(e) => setNewArrangementDescription(e.target.value)}
                  placeholder="Describe this arrangement..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateArrangement}
                  disabled={!newArrangementName.trim() || createArrangementMutation.isPending}
                >
                  {createArrangementMutation.isPending ? "Creating..." : "Create"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {arrangements.map((arrangement) => (
          <ArrangementCard
            key={arrangement._id}
            arrangement={arrangement}
            isDefault={arrangement._id === defaultArrangementId}
            onView={() => onArrangementView?.(arrangement)}
            onEdit={() => onArrangementEdit?.(arrangement)}
            onDelete={() => handleDeleteArrangement(arrangement._id)}
          />
        ))}
      </div>
    </div>
  );
}