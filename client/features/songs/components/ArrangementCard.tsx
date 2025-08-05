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
  Check,
  MessageSquare,
  Music,
  Mic2,
} from "lucide-react";
import { ArrangementDetail } from "../types/song.types";
import FavoritesToggle from "./FavoritesToggle";
import MashupIndicator from "./MashupIndicator";

interface ArrangementCardProps {
  arrangement: ArrangementDetail;
  isDefault?: boolean;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onSetDefault?: () => void;
}

export default function ArrangementCard({
  arrangement,
  isDefault = false,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  onSetDefault,
}: ArrangementCardProps) {

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get metadata with defaults
  const rating = arrangement.metadata?.ratings?.average || 0;
  const reviewCount = arrangement.metadata?.reviewCount || 0;
  const isMashup = arrangement.metadata?.isMashup || false;

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
          
          <div className="flex items-center gap-1">
            <FavoritesToggle
              type="arrangement"
              itemId={arrangement._id}
              itemName={arrangement.name}
              size="sm"
              variant="ghost"
            />
            
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
        </div>
        
        <div className="flex flex-wrap items-center gap-2 mt-3">
          {arrangement.key && (
            <Badge variant="outline" className="text-xs">
              <Music className="h-3 w-3 mr-1" />
              {arrangement.key}
            </Badge>
          )}
          {arrangement.tempo && (
            <Badge variant="outline" className="text-xs">
              {arrangement.tempo} BPM
            </Badge>
          )}
          {arrangement.difficulty && (
            <Badge variant="outline" className="text-xs">
              {arrangement.difficulty}
            </Badge>
          )}
          {arrangement.genreStyle && (
            <Badge variant="outline" className="text-xs">
              {arrangement.genreStyle}
            </Badge>
          )}
          {arrangement.vocalRange && (
            <Badge variant="outline" className="text-xs">
              <Mic2 className="h-3 w-3 mr-1" />
              {arrangement.vocalRange.low} - {arrangement.vocalRange.high}
            </Badge>
          )}
          <MashupIndicator
            isMashup={isMashup}
            songCount={arrangement.songIds?.length}
            variant="minimal"
          />
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
          <div className="flex items-center gap-3">
            {rating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                <span className="font-medium">{rating.toFixed(1)}</span>
                <span className="text-sm text-muted-foreground">
                  ({arrangement.metadata?.ratings?.count || 0})
                </span>
              </div>
            )}
            {reviewCount > 0 && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MessageSquare className="h-4 w-4" />
                <span>{reviewCount} review{reviewCount !== 1 ? "s" : ""}</span>
              </div>
            )}
          </div>
          
          <Button onClick={onView} size="sm">
            View Arrangement
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}