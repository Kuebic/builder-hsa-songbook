import { memo } from "react";
import { ChevronRight, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CategoryCardProps } from "../types/category.types";
import { getCategoryById } from "../utils/categoryMappings";
import { getCategoryThemeColors, formatCategoryStats } from "../utils/categoryHelpers";

export const CategoryCard = memo<CategoryCardProps>(({ 
  category, 
  onClick, 
  isLoading = false 
}) => {
  const categoryConfig = getCategoryById(category.id);
  const themeColors = getCategoryThemeColors(category.id);
  const { formattedRating } = formatCategoryStats(category);
  
  const IconComponent = categoryConfig?.icon;
  
  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gray-200 w-9 h-9" />
              <div>
                <div className="h-5 bg-gray-200 rounded w-32 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-48" />
              </div>
            </div>
            <div className="w-5 h-5 bg-gray-200 rounded" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="h-8 w-8 bg-gray-200 rounded mb-1" />
                <div className="h-3 w-10 bg-gray-200 rounded" />
              </div>
              <div className="text-center">
                <div className="h-6 w-12 bg-gray-200 rounded mb-1" />
                <div className="h-3 w-12 bg-gray-200 rounded" />
              </div>
            </div>
            <div className="h-6 w-16 bg-gray-200 rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-20 bg-gray-200 rounded" />
            <div className="h-3 w-full bg-gray-200 rounded" />
            <div className="h-3 w-3/4 bg-gray-200 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!categoryConfig) {
    return (
      <Card className="opacity-50">
        <CardContent className="p-4">
          <div className="text-center text-sm text-muted-foreground">
            Category not found
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card
      className={cn(
        "group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
        "border-l-4",
        themeColors.border,
        "hover:shadow-lg"
      )}
      onClick={() => onClick(category.id)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={cn(
              "p-2 rounded-lg flex items-center justify-center",
              themeColors.background,
              themeColors.text
            )}>
              {IconComponent && <IconComponent className="h-5 w-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className={cn(
                "text-lg group-hover:text-primary transition-colors truncate",
                themeColors.text
              )}>
                {category.name}
              </CardTitle>
              {categoryConfig.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {categoryConfig.description}
                </p>
              )}
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{category.songCount}</div>
              <div className="text-xs text-muted-foreground">Songs</div>
            </div>
            {category.avgRating > 0 && (
              <div className="text-center">
                <div className="flex items-center justify-center">
                  <Star className="h-4 w-4 fill-current text-yellow-400 mr-1" />
                  <span className="text-lg font-semibold">{formattedRating}</span>
                </div>
                <div className="text-xs text-muted-foreground">Rating</div>
              </div>
            )}
          </div>
          
          {category.recentCount > 0 && (
            <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
              +{category.recentCount} recent
            </Badge>
          )}
        </div>
        
        {category.topSongs && category.topSongs.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground">Popular Songs:</div>
            {category.topSongs.slice(0, 2).map((song, index) => (
              <div 
                key={`${song.id}-${index}`} 
                className="text-xs text-muted-foreground truncate"
                title={`${song.title}${song.artist ? ` • ${song.artist}` : ''}`}
              >
                {song.title} {song.artist && `• ${song.artist}`}
              </div>
            ))}
            {category.topSongs.length > 2 && (
              <div className="text-xs text-muted-foreground">
                +{category.topSongs.length - 2} more songs
              </div>
            )}
          </div>
        )}
        
        {category.songCount === 0 && (
          <div className="text-center py-2">
            <div className="text-sm text-muted-foreground">No songs yet</div>
            <div className="text-xs text-muted-foreground mt-1">
              Be the first to add songs to this category
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

CategoryCard.displayName = "CategoryCard";