import { useState, useMemo } from "react";
import { Search, Filter, Grid, List, TrendingUp, Clock, Star, Music, Users, Calendar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSongs, useSongsStats } from "../../songs/hooks/useSongsAPI";
import SongCard from "../../songs/components/SongCard";
import { ClientSong } from "../../songs/types/song.types";

type ViewMode = "grid" | "list";
type SortOption = "recent" | "popular" | "title" | "rating";

export default function BrowseTabs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [selectedKey, setSelectedKey] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [selectedTheme, setSelectedTheme] = useState<string>("all");

  // Fetch songs and stats
  const { data: songs = [], isLoading: songsLoading, error: songsError } = useSongs();
  const { data: stats, isLoading: statsLoading } = useSongsStats();

  // Filter and sort songs
  const filteredSongs = useMemo(() => {
    let filtered = songs.filter((song) => {
      const matchesSearch = !searchQuery ||
        song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        song.artist?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesKey = !selectedKey || selectedKey === "all" || song.key === selectedKey;
      const matchesDifficulty = !selectedDifficulty || selectedDifficulty === "all" || song.difficulty === selectedDifficulty;
      const matchesTheme = !selectedTheme || selectedTheme === "all" || song.themes.includes(selectedTheme);

      return matchesSearch && matchesKey && matchesDifficulty && matchesTheme;
    });

    // Sort songs
    switch (sortBy) {
      case "popular":
        filtered.sort((a, b) => b.viewCount - a.viewCount);
        break;
      case "rating":
        filtered.sort((a, b) => b.avgRating - a.avgRating);
        break;
      case "title":
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "recent":
      default:
        // Already sorted by recent (assuming API returns in creation order)
        break;
    }

    return filtered;
  }, [songs, searchQuery, selectedKey, selectedDifficulty, selectedTheme, sortBy]);

  // Get unique values for filters
  const availableKeys = useMemo(() => {
    const keys = [...new Set(songs.map(song => song.key).filter(Boolean))];
    return keys.sort();
  }, [songs]);

  const availableThemes = useMemo(() => {
    const themes = [...new Set(songs.flatMap(song => song.themes))];
    return themes.sort();
  }, [songs]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedKey("all");
    setSelectedDifficulty("all");
    setSelectedTheme("all");
    setSortBy("recent");
  };

  const hasActiveFilters = searchQuery || (selectedKey && selectedKey !== "all") || (selectedDifficulty && selectedDifficulty !== "all") || (selectedTheme && selectedTheme !== "all") || sortBy !== "recent";

  const renderStatsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Songs</CardTitle>
          <Music className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.totalSongs || 0}</div>
          <p className="text-xs text-muted-foreground">
            {stats?.recentlyAdded || 0} added this week
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Setlists</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.totalSetlists || 0}</div>
          <p className="text-xs text-muted-foreground">Organized collections</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Most Popular</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {songs.length > 0 ? Math.max(...songs.map(s => s.viewCount)) : 0}
          </div>
          <p className="text-xs text-muted-foreground">views on top song</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Contributors</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.topContributors || 1}</div>
          <p className="text-xs text-muted-foreground">active community members</p>
        </CardContent>
      </Card>
    </div>
  );

  const renderSearchAndFilters = () => (
    <div className="space-y-4 mb-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search songs, artists, or themes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          
          <Select value={selectedKey} onValueChange={setSelectedKey}>
            <SelectTrigger className="w-24">
              <SelectValue placeholder="Key" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Keys</SelectItem>
              {availableKeys.map(key => (
                <SelectItem key={key} value={key}>{key}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
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

          <Select value={selectedTheme} onValueChange={setSelectedTheme}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Theme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Themes</SelectItem>
              {availableThemes.map(theme => (
                <SelectItem key={theme} value={theme}>{theme}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
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
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
          
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="rounded-r-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {searchQuery && (
            <Badge variant="secondary">
              Search: "{searchQuery}"
            </Badge>
          )}
          {selectedKey && selectedKey !== "all" && (
            <Badge variant="secondary">
              Key: {selectedKey}
            </Badge>
          )}
          {selectedDifficulty && selectedDifficulty !== "all" && (
            <Badge variant="secondary">
              Difficulty: {selectedDifficulty}
            </Badge>
          )}
          {selectedTheme && selectedTheme !== "all" && (
            <Badge variant="secondary">
              Theme: {selectedTheme}
            </Badge>
          )}
          {sortBy !== "recent" && (
            <Badge variant="secondary">
              Sort: {sortBy}
            </Badge>
          )}
        </div>
      )}
    </div>
  );

  const renderSongsList = () => {
    if (songsLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (songsError) {
      return (
        <Card className="p-8 text-center">
          <CardContent>
            <p className="text-muted-foreground">
              Unable to load songs. Please try again later.
            </p>
          </CardContent>
        </Card>
      );
    }

    if (filteredSongs.length === 0) {
      return (
        <Card className="p-8 text-center">
          <CardContent>
            <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No songs found</h3>
            <p className="text-muted-foreground mb-4">
              {hasActiveFilters 
                ? "Try adjusting your filters to find more songs."
                : "Be the first to add songs to the community!"
              }
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      );
    }

    return (
      <div className={viewMode === "grid" 
        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        : "space-y-3"
      }>
        {filteredSongs.map((song) => (
          <SongCard 
            key={song.id} 
            song={song} 
            variant={viewMode === "list" ? "compact" : "default"}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {!statsLoading && renderStatsCards()}

      <Tabs defaultValue="songs" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="songs" className="flex items-center gap-2">
            <Music className="h-4 w-4" />
            Songs
          </TabsTrigger>
          <TabsTrigger value="setlists" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Setlists
          </TabsTrigger>
          <TabsTrigger value="trending" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Trending
          </TabsTrigger>
        </TabsList>

        <TabsContent value="songs" className="space-y-6">
          {renderSearchAndFilters()}
          
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                Browse Songs {filteredSongs.length > 0 && (
                  <span className="text-sm text-muted-foreground ml-2">
                    ({filteredSongs.length} {filteredSongs.length === 1 ? 'song' : 'songs'})
                  </span>
                )}
              </h2>
            </div>
            {renderSongsList()}
          </div>
        </TabsContent>

        <TabsContent value="setlists" className="space-y-6">
          <Card className="p-8 text-center">
            <CardContent>
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Setlists Coming Soon</h3>
              <p className="text-muted-foreground">
                Setlist browsing and management features are being developed.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trending" className="space-y-6">
          <Card className="p-8 text-center">
            <CardContent>
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Trending Content</h3>
              <p className="text-muted-foreground">
                Discover what's popular in the worship community.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
