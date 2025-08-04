import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Star,
  Clock,
  User,
  MoreHorizontal,
  Eye,
  Edit,
  Copy,
  Trash2,
  Music2,
  Check,
} from "lucide-react";
import { ArrangementDetail } from "../types/song.types";

interface ArrangementCardProps {
  arrangement: ArrangementDetail;
  isDefault?: boolean;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onSetDefault?: () => void;
  onRate?: (rating: number) => void;
  rating?: number;
  ratingCount?: number;
}

export default function ArrangementCard({
  arrangement,
  isDefault = false,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  onSetDefault,
  onRate,
  rating = 0,
  ratingCount = 0,
}: ArrangementCardProps) {
  const [hoveredRating, setHoveredRating] = useState(0);

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const renderStars = () => {
    const stars = [];
    const displayRating = hoveredRating || rating;
    
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          onClick={() => onRate?.(i)}
          onMouseEnter={() => setHoveredRating(i)}
          onMouseLeave={() => setHoveredRating(0)}
          className="p-0.5 transition-colors hover:text-yellow-500"
          disabled={!onRate}
        >
          <Star 
            className={`h-4 w-4 ${
              i <= displayRating 
                ? "fill-yellow-500 text-yellow-500" 
                : "text-muted-foreground"
            }`}
          />
        </button>
      );
    }
    
    return stars;
  };

  return (
    <Card className={`relative ${isDefault ? "ring-2 ring-worship" : ""}`}>
      {isDefault && (
        <div className="absolute -top-2 -right-2 z-10">
          <Badge className="bg-worship text-white">
            <Check className="h-3 w-3 mr-1" />
            Default
          </Badge>
        </div>
      )}
      
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-medium">
              {arrangement.name}
            </CardTitle>
            <CardDescription className="mt-1">
              Arrangement by {arrangement.createdBy}
            </CardDescription>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onView}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              {!isDefault && (
                <DropdownMenuItem onClick={onSetDefault}>
                  <Check className="mr-2 h-4 w-4" />
                  Set as Default
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={onDelete}
                className="text-red-600 dark:text-red-400"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="flex items-center gap-2 mt-3">
          {arrangement.metadata.key && (
            <Badge variant="outline" className="text-xs">
              Key: {arrangement.metadata.key}
            </Badge>
          )}
          {arrangement.metadata.tempo && (
            <Badge variant="outline" className="text-xs">
              {arrangement.metadata.tempo} BPM
            </Badge>
          )}
          {arrangement.songIds && arrangement.songIds.length > 1 && (
            <Badge variant="secondary" className="text-xs">
              <Music2 className="h-3 w-3 mr-1" />
              Mashup ({arrangement.songIds.length} songs)
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4 text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {arrangement.createdBy}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDate(arrangement.createdAt)}
            </span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="border-t pt-3">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1">
            {renderStars()}
            <span className="text-sm text-muted-foreground ml-2">
              ({ratingCount})
            </span>
          </div>
          
          <Button onClick={onView} size="sm">
            View Arrangement
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}