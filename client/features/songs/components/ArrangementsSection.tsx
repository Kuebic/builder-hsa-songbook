import { useState, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ArrangementCard from "./ArrangementCard";
import type { ArrangementWithMetrics } from "@features/songs/types/song.types";

export interface ArrangementsSectionProps {
  arrangements: ArrangementWithMetrics[];
}

type SortOption = "rating" | "favorites" | "usage" | "recent";
type FilterOption = "all" | string;

export default function ArrangementsSection({
  arrangements,
}: ArrangementsSectionProps) {
  const [sortBy, setSortBy] = useState<SortOption>("rating");
  const [filterKey, setFilterKey] = useState<FilterOption>("all");
  const [filterDifficulty, setFilterDifficulty] = useState<FilterOption>("all");

  // Get available keys and difficulties from arrangements
  const availableKeys = useMemo(() => {
    const keys = new Set(
      arrangements.map((a) => a.metadata.key).filter(Boolean),
    );
    return Array.from(keys).sort();
  }, [arrangements]);

  const availableDifficulties = useMemo(() => {
    const difficulties = new Set(
      arrangements.map((a) => a.metadata.difficulty),
    );
    return Array.from(difficulties);
  }, [arrangements]);

  const sortedAndFilteredArrangements = useMemo(() => {
    let filtered = [...arrangements];

    // Apply filters
    if (filterKey !== "all") {
      filtered = filtered.filter((a) => a.metadata.key === filterKey);
    }
    if (filterDifficulty !== "all") {
      filtered = filtered.filter(
        (a) => a.metadata.difficulty === filterDifficulty,
      );
    }

    // Apply sorting
    switch (sortBy) {
      case "rating":
        return filtered.sort((a, b) => {
          const aRating = a.rating?.average || 0;
          const bRating = b.rating?.average || 0;
          return bRating - aRating;
        });
      case "favorites":
        return filtered.sort((a, b) => b.favoriteCount - a.favoriteCount);
      case "usage":
        return filtered.sort((a, b) => b.setlistCount - a.setlistCount);
      case "recent":
        return filtered.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      default:
        return filtered;
    }
  }, [arrangements, sortBy, filterKey, filterDifficulty]);

  if (arrangements.length === 0) {
    return (
      <div className="space-y-6 mt-8">
        <h2 className="text-2xl font-bold">Available Arrangements (0)</h2>
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg mb-2">No arrangements available yet</p>
          <p className="text-sm">
            Be the first to create an arrangement for this song.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          Available Arrangements ({sortedAndFilteredArrangements.length})
        </h2>
      </div>

      {/* Filters and Sorting */}
      <div className="flex gap-4 flex-wrap">
        <Select
          value={sortBy}
          onValueChange={(value: SortOption) => setSortBy(value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rating">Highest Rated</SelectItem>
            <SelectItem value="favorites">Most Favorited</SelectItem>
            <SelectItem value="usage">Most Used</SelectItem>
            <SelectItem value="recent">Most Recent</SelectItem>
          </SelectContent>
        </Select>

        {availableKeys.length > 1 && (
          <Select value={filterKey} onValueChange={setFilterKey}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="All Keys" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Keys</SelectItem>
              {availableKeys.map((key) => (
                <SelectItem key={key} value={key}>
                  {key}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {availableDifficulties.length > 1 && (
          <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              {availableDifficulties.map((difficulty) => (
                <SelectItem key={difficulty} value={difficulty}>
                  {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Arrangements List */}
      {sortedAndFilteredArrangements.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-lg mb-2">No arrangements match your filters</p>
          <p className="text-sm">
            Try adjusting your filters to see more results.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedAndFilteredArrangements.map((arrangement) => (
            <ArrangementCard key={arrangement._id} arrangement={arrangement} />
          ))}
        </div>
      )}
    </div>
  );
}
