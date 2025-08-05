import {
  Search,
  Filter,
  Grid,
  List,
  TrendingUp,
  Clock,
  Star,
  Music,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SPIRITUAL_CATEGORIES } from "@features/categories/utils/categoryMappings";
import { getCategoryById } from "@features/categories";
import { FilterState, ViewMode, SortOption } from "../../hooks/useFilteredSongs";

export interface SongsFilterBarProps {
  filters: FilterState;
  availableKeys: string[];
  availableThemes: string[];
  isPending: boolean;
  hasActiveFilters: boolean;
  onFilterChange: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onClearFilters: () => void;
}

export function SongsFilterBar({
  filters,
  availableKeys,
  availableThemes,
  isPending,
  hasActiveFilters,
  onFilterChange,
  onClearFilters,
}: SongsFilterBarProps) {
  return (
    <div className="space-y-4 mb-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search songs, artists, or themes..."
          value={filters.searchQuery}
          onChange={(e) => onFilterChange('searchQuery', e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-muted-foreground" />

          <Select 
            value={filters.selectedKey} 
            onValueChange={(value) => onFilterChange('selectedKey', value)}
          >
            <SelectTrigger className="w-24">
              <SelectValue placeholder="Key" />
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

          <Select 
            value={filters.selectedDifficulty} 
            onValueChange={(value) => onFilterChange('selectedDifficulty', value)}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>

          <Select 
            value={filters.selectedTheme} 
            onValueChange={(value) => onFilterChange('selectedTheme', value)}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Theme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Themes</SelectItem>
              {availableThemes.map((theme) => (
                <SelectItem key={theme} value={theme}>
                  {theme}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={filters.selectedCategory} 
            onValueChange={(value) => onFilterChange('selectedCategory', value)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {SPIRITUAL_CATEGORIES.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.sortBy}
            onValueChange={(value) => onFilterChange('sortBy', value as SortOption)}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4" />
                  Recent
                </div>
              </SelectItem>
              <SelectItem value="popular">
                <div className="flex items-center">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Popular
                </div>
              </SelectItem>
              <SelectItem value="rating">
                <div className="flex items-center">
                  <Star className="mr-2 h-4 w-4" />
                  Top Rated
                </div>
              </SelectItem>
              <SelectItem value="title">
                <div className="flex items-center">
                  <Music className="mr-2 h-4 w-4" />
                  A-Z
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {hasActiveFilters && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onClearFilters}
              disabled={isPending}
            >
              Clear Filters
            </Button>
          )}

          <div className="flex border rounded-md">
            <Button
              variant={filters.viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => onFilterChange('viewMode', 'grid')}
              className="rounded-r-none"
              disabled={isPending}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={filters.viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => onFilterChange('viewMode', 'list')}
              className="rounded-l-none"
              disabled={isPending}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.searchQuery && (
            <Badge variant="secondary">{`Search: "${filters.searchQuery}"`}</Badge>
          )}
          {filters.selectedKey && filters.selectedKey !== "all" && (
            <Badge variant="secondary">Key: {filters.selectedKey}</Badge>
          )}
          {filters.selectedDifficulty && filters.selectedDifficulty !== "all" && (
            <Badge variant="secondary">Difficulty: {filters.selectedDifficulty}</Badge>
          )}
          {filters.selectedTheme && filters.selectedTheme !== "all" && (
            <Badge variant="secondary">Theme: {filters.selectedTheme}</Badge>
          )}
          {filters.selectedCategory && filters.selectedCategory !== "all" && (
            <Badge variant="secondary">
              Category: {getCategoryById(filters.selectedCategory)?.name || filters.selectedCategory}
            </Badge>
          )}
          {filters.sortBy !== "recent" && (
            <Badge variant="secondary">Sort: {filters.sortBy}</Badge>
          )}
        </div>
      )}
    </div>
  );
}