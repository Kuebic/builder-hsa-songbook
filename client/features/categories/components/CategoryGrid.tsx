import { useCallback, useDeferredValue, useTransition } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { CategoryCard } from "./CategoryCard";
import { useCategoryStats } from "../hooks/useCategoryStats";
import type { CategoryGridProps } from "../types/category.types";

function CategoryGridSkeleton({ count = 6 }: { count: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="space-y-4">
          <Skeleton className="h-48 w-full" />
        </div>
      ))}
    </div>
  );
}

function CategoryGridError({ onRetry }: { onRetry: () => void }) {
  return (
    <Alert className="border-destructive">
      <AlertDescription className="flex items-center justify-between">
        <span>Failed to load categories. Please try again.</span>
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      </AlertDescription>
    </Alert>
  );
}

export function CategoryGrid({ 
  onCategorySelect, 
  maxCategories = 6, 
  className 
}: CategoryGridProps) {
  const navigate = useNavigate();
  const { data: categoryStats, isLoading, error, refetch } = useCategoryStats({
    limit: maxCategories,
    sortBy: 'popularity',
    includeEmpty: false,
  });
  
  const deferredStats = useDeferredValue(categoryStats);
  const [isPending, startTransition] = useTransition();
  
  const handleCategoryClick = useCallback((categoryId: string) => {
    startTransition(() => {
      // Call the callback if provided (for backward compatibility)
      if (onCategorySelect) {
        onCategorySelect(categoryId);
      }
      // Navigate to the category browser page
      navigate(`/categories/${categoryId}`);
    });
  }, [onCategorySelect, navigate]);
  
  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);
  
  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Browse by Category</h2>
          <Skeleton className="h-10 w-32" />
        </div>
        <CategoryGridSkeleton count={maxCategories} />
      </div>
    );
  }
  
  if (error || !deferredStats) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Browse by Category</h2>
          <Button variant="outline" asChild>
            <Link to="/songs">View All Songs</Link>
          </Button>
        </div>
        <CategoryGridError onRetry={handleRetry} />
      </div>
    );
  }
  
  if (deferredStats.length === 0) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Browse by Category</h2>
          <Button variant="outline" asChild>
            <Link to="/songs">View All Songs</Link>
          </Button>
        </div>
        <Alert>
          <AlertDescription>
            No categories available yet. Categories will appear as songs are added to the collection.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  const displayedStats = deferredStats.slice(0, maxCategories);
  
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Browse by Category</h2>
          <p className="text-muted-foreground mt-1">
            Discover songs organized by spiritual themes and traditions
          </p>
        </div>
        <Button 
          variant="outline" 
          asChild
          disabled={isPending}
        >
          <Link to="/songs">View All Songs</Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedStats.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            onClick={handleCategoryClick}
            isLoading={isPending}
          />
        ))}
      </div>
      
      {isPending && (
        <div className="flex items-center justify-center py-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
            <span>Loading category...</span>
          </div>
        </div>
      )}
      
      {deferredStats.length > maxCategories && (
        <div className="flex justify-center pt-4">
          <Button variant="ghost" asChild>
            <Link to="/songs">
              View All {deferredStats.length} Categories
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}

// Compact version for smaller spaces
export function CategoryGridCompact({ 
  onCategorySelect, 
  maxCategories = 4,
  className 
}: CategoryGridProps) {
  const navigate = useNavigate();
  const { data: categoryStats, isLoading, error } = useCategoryStats({
    limit: maxCategories,
    sortBy: 'popularity',
    includeEmpty: false,
  });
  
  const [isPending, startTransition] = useTransition();
  
  const handleCategoryClick = useCallback((categoryId: string) => {
    startTransition(() => {
      // Call the callback if provided (for backward compatibility)
      if (onCategorySelect) {
        onCategorySelect(categoryId);
      }
      // Navigate to the category browser page
      navigate(`/categories/${categoryId}`);
    });
  }, [onCategorySelect, navigate]);
  
  if (isLoading) {
    return (
      <div className={cn("space-y-3", className)}>
        <h3 className="text-lg font-semibold">Popular Categories</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: maxCategories }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }
  
  if (error || !categoryStats || categoryStats.length === 0) {
    return null; // Fail silently in compact mode
  }
  
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Popular Categories</h3>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/songs">View All</Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {categoryStats.slice(0, maxCategories).map((category) => (
          <div
            key={category.id}
            className={cn(
              "p-3 rounded-lg border cursor-pointer transition-all duration-200",
              "hover:shadow-md hover:border-primary/50",
              isPending && "opacity-50 pointer-events-none"
            )}
            onClick={() => handleCategoryClick(category.id)}
          >
            <div className="text-sm font-medium truncate">{category.name}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {category.songCount} songs
            </div>
            {category.recentCount > 0 && (
              <div className="text-xs text-green-600 mt-1">
                +{category.recentCount} recent
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}