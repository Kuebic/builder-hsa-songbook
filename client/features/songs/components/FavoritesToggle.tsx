import { useCallback, ReactElement } from "react";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUserId } from "@/shared/hooks/useAuth";
import { useAddFavorite, useRemoveFavorite, useCheckFavorite } from "../hooks/useFavorites";
import { cn } from "@/lib/utils";

export interface FavoritesToggleProps {
  type: "song" | "arrangement";
  itemId: string;
  itemName?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "outline" | "ghost";
  className?: string;
  showLabel?: boolean;
  onToggle?: (isFavorite: boolean) => void;
}

// API Error Response Structure
interface APIErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// Helper function to parse API errors and provide user-friendly messages
function getErrorMessage(error: unknown, type: "song" | "arrangement", itemName?: string): {
  title: string;
  description: string;
} {
  const itemLabel = itemName || `this ${type}`;
  
  // Check if it's a network error (fetch failed)
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return {
      title: "Network error",
      description: "Unable to connect to the server. Please check your internet connection and try again.",
    };
  }
  
  // Check if it's an Error with a message
  if (error instanceof Error) {
    try {
      // Try to parse the error message as JSON (in case it contains API error response)
      const apiError = JSON.parse(error.message) as APIErrorResponse;
      
      switch (apiError.error.code) {
        case "USER_NOT_FOUND":
          return {
            title: "Authentication error",
            description: "Your user account was not found. Please sign out and sign in again.",
          };
        case "SONG_NOT_FOUND":
          return {
            title: "Song not found",
            description: `The song "${itemLabel}" no longer exists.`,
          };
        case "ARRANGEMENT_NOT_FOUND":
          return {
            title: "Arrangement not found",
            description: `The arrangement "${itemLabel}" no longer exists.`,
          };
        case "ALREADY_FAVORITED":
          return {
            title: "Already in favorites",
            description: `${itemLabel} is already in your favorites.`,
          };
        case "NOT_FAVORITED":
          return {
            title: "Not in favorites",
            description: `${itemLabel} is not in your favorites.`,
          };
        case "VALIDATION_ERROR":
          return {
            title: "Invalid request",
            description: "The request was invalid. Please refresh the page and try again.",
          };
        case "INTERNAL_ERROR":
          return {
            title: "Server error",
            description: "A server error occurred. Please try again later.",
          };
        default:
          return {
            title: "Failed to update favorites",
            description: apiError.error.message || "An unexpected error occurred.",
          };
      }
    } catch {
      // If parsing fails, use the original error message
      return {
        title: "Failed to update favorites",
        description: error.message || "An unexpected error occurred.",
      };
    }
  }
  
  // Fallback for unknown error types
  return {
    title: "Failed to update favorites",
    description: "An unexpected error occurred. Please try again.",
  };
}

export default function FavoritesToggle({
  type,
  itemId,
  itemName,
  size = "default",
  variant = "ghost",
  className,
  showLabel = false,
  onToggle,
}: FavoritesToggleProps): ReactElement {
  const userId = useUserId();
  const { toast } = useToast();
  
  const { data: isFavorite, isLoading: checkLoading } = useCheckFavorite(type, itemId, userId || undefined);
  const addFavoriteMutation = useAddFavorite();
  const removeFavoriteMutation = useRemoveFavorite();

  const handleToggleFavorite = useCallback(async () => {
    if (!userId) {
      toast({
        title: "Authentication required",
        description: `Please sign in to save ${type}s to your favorites`,
        variant: "default",
      });
      return;
    }

    const itemLabel = itemName || `this ${type}`;
    const isCurrentlyFavorite = isFavorite?.isFavorite || false;

    try {
      if (isCurrentlyFavorite) {
        await removeFavoriteMutation.mutateAsync({
          type,
          itemId,
          userId,
        });
        
        toast({
          title: "Removed from favorites",
          description: `${itemLabel} has been removed from your favorites`,
        });
      } else {
        await addFavoriteMutation.mutateAsync({
          type,
          itemId,
          userId,
        });
        
        toast({
          title: "Added to favorites",
          description: `${itemLabel} has been added to your favorites`,
        });
      }
      
      onToggle?.(!isCurrentlyFavorite);
    } catch (error) {
      const errorInfo = getErrorMessage(error, type, itemName);
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    }
  }, [userId, type, itemId, itemName, isFavorite, onToggle]);

  const isActive = isFavorite?.isFavorite || false;
  const isPending = addFavoriteMutation.isPending || removeFavoriteMutation.isPending;
  const isDisabled = checkLoading || isPending;

  const iconSize = {
    sm: "h-3 w-3",
    default: "h-4 w-4",
    lg: "h-5 w-5",
    icon: "h-4 w-4",
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggleFavorite}
      disabled={isDisabled}
      className={cn(
        "transition-colors",
        isActive && "text-red-500 hover:text-red-600",
        className,
      )}
      title={isActive ? `Remove from favorite ${type}s` : `Add to favorite ${type}s`}
      aria-label={
        isActive 
          ? `Remove ${itemName || `this ${type}`} from favorites` 
          : `Add ${itemName || `this ${type}`} to favorites`
      }
      aria-pressed={isActive}
    >
      <Heart
        className={cn(
          iconSize[size],
          isActive && "fill-current",
          showLabel && "mr-2",
        )}
        aria-hidden="true"
      />
      {showLabel && (
        <span>
          {isActive ? "Favorited" : "Favorite"}
        </span>
      )}
    </Button>
  );
}