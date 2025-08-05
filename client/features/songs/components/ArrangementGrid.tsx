import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Edit,
  Users,
  Music,
  Clock,
  Heart,
  Plus,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrangementDetail } from "../types/song.types";
import { StarRating } from "./StarRating";

export interface ArrangementGridProps {
  arrangements: ArrangementDetail[];
  onView: (arrangement: ArrangementDetail) => void;
  onEdit: (arrangement: ArrangementDetail) => void;
  onCreateNew: () => void;
  defaultArrangementId?: string;
}

/**
 * Grid component that displays available arrangements for a song
 * with quick actions and metadata
 */
export default function ArrangementGrid({ 
  arrangements, 
  onView, 
  onEdit, 
  onCreateNew,
  defaultArrangementId,
}: ArrangementGridProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "advanced":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const formatUsageCount = (count: number): string => {
    if (count === 0) return "Never used";
    if (count === 1) return "Used in 1 setlist";
    return `Used in ${count} setlists`;
  };

  return (
    <div className="space-y-4">
      {/* Header with create button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Available Arrangements ({arrangements.length})
        </h3>
        <Button onClick={onCreateNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Create New Arrangement
        </Button>
      </div>

      {/* Arrangements grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {arrangements.map((arrangement) => (
          <Card 
            key={arrangement._id} 
            className={`transition-all hover:shadow-md ${
              arrangement._id === defaultArrangementId 
                ? "ring-2 ring-primary/20 bg-primary/5" 
                : ""
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Music className="h-4 w-4" />
                    {arrangement.name}
                    {arrangement._id === defaultArrangementId && (
                      <Badge variant="secondary" className="text-xs">
                        Default
                      </Badge>
                    )}
                  </CardTitle>
                  {arrangement.metadata?.ratings && (
                    <div className="flex items-center gap-1">
                      <StarRating
                        rating={Math.round(arrangement.metadata.ratings.average || 0)}
                        readOnly
                        size="small"
                      />
                      <span className="text-xs text-muted-foreground">
                        ({arrangement.metadata.ratings.count || 0})
                      </span>
                    </div>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onView(arrangement)}>
                      <Play className="mr-2 h-4 w-4" />
                      View Chords
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(arrangement)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Heart className="mr-2 h-4 w-4" />
                      Add to Favorites
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {/* Musical details */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs">
                  Key: {arrangement.metadata?.key || "N/A"}
                </Badge>
                {arrangement.metadata?.capo && (
                  <Badge variant="outline" className="text-xs">
                    Capo {arrangement.metadata.capo}
                  </Badge>
                )}
                {arrangement.metadata?.tempo && (
                  <Badge variant="outline" className="text-xs">
                    {arrangement.metadata.tempo} BPM
                  </Badge>
                )}
                <Badge
                  variant="secondary"
                  className={`text-xs ${getDifficultyColor(arrangement.metadata?.difficulty || "intermediate")}`}
                >
                  {arrangement.metadata?.difficulty || "intermediate"}
                </Badge>
              </div>

              {/* Usage stats */}
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{formatUsageCount(arrangement.stats?.usageCount || 0)}</span>
                </div>
                {arrangement.stats?.lastUsed && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      Last used {new Date(arrangement.stats.lastUsed).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-2">
                <Button 
                  size="sm" 
                  onClick={() => onView(arrangement)}
                  className="flex-1 gap-1"
                >
                  <Play className="h-3 w-3" />
                  View
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => onEdit(arrangement)}
                  className="gap-1"
                >
                  <Edit className="h-3 w-3" />
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Empty state when no arrangements */}
        {arrangements.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <Music className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Arrangements Yet</h3>
              <p className="text-muted-foreground mb-4 max-w-sm">
                This song doesn't have any arrangements yet. Create the first one to start playing this song!
              </p>
              <Button onClick={onCreateNew} className="gap-2">
                <Plus className="h-4 w-4" />
                Create First Arrangement
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
