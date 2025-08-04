import { useState, useEffect } from "react";
import { Layout } from "@/shared/components/Layout";
import { SongCard } from "@features/songs";
import { useSongs, useSongsStats } from "@features/songs/hooks/useSongsAPI";
import { useSongSearch } from "@features/songs";
import { ClientSong, SongFilters } from "@features/songs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Music,
  Search,
  Filter,
  Sparkles,
  Clock,
  Heart,
  TrendingUp,
  Users,
  BookOpen,
  PlusCircle,
} from "lucide-react";


export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKey, setSelectedKey] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Fetch songs from MongoDB
  const { data: songs = [], isLoading, error } = useSongs({
    limit: 50,
    isPublic: true
  });

  // Fetch dashboard stats
  const { data: stats } = useSongsStats();

  const [filteredSongs, setFilteredSongs] = useState<ClientSong[]>([]);

  useEffect(() => {
    if (!songs.length) {
      setFilteredSongs([]);
      return;
    }

    let filtered = songs;

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (song) =>
          song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          song.artist?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          song.themes.some((theme) =>
            theme.toLowerCase().includes(searchQuery.toLowerCase()),
          ),
      );
    }

    // Key filter
    if (selectedKey !== "all") {
      filtered = filtered.filter((song) => song.key === selectedKey);
    }

    // Difficulty filter
    if (selectedDifficulty !== "all") {
      filtered = filtered.filter(
        (song) => song.difficulty === selectedDifficulty,
      );
    }

    setFilteredSongs(filtered);
  }, [searchQuery, selectedKey, selectedDifficulty, songs]);

  const handleToggleFavorite = (songId: string) => {
    // TODO: Implement API call for toggling favorites
    console.log("Toggle favorite for song:", songId);
  };

  const handleAddToSetlist = (songId: string) => {
    // TODO: Implement add to setlist functionality
    console.log("Adding song to setlist:", songId);
  };

  const recentSongs = songs.filter((song) => song.lastUsed).slice(0, 4);
  const favoriteSongs = songs.filter((song) => song.isFavorite).slice(0, 4);
  const popularSongs = songs
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, 4);

  return (
    <Layout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="title text-worship">Welcome to HSA Songbook</h1>
            <p className="subtitle mt-2">
              Discover, organize, and share worship chord charts for your
              community
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 lg:mt-0">
            <Button className="bg-worship hover:bg-worship/90 text-worship-foreground">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Song
            </Button>
            <Button variant="outline">
              <BookOpen className="mr-2 h-4 w-4" />
              Create Setlist
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Songs</CardTitle>
              <Music className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(stats?.totalSongs || songs.length).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                +{stats?.recentlyAdded || 0} this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Setlists
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mockStats.totalSetlists}
              </div>
              <p className="text-xs text-muted-foreground">Across all users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Contributors
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mockStats.topContributors}
              </div>
              <p className="text-xs text-muted-foreground">Active this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trending</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {popularSongs[0]?.title.split(" ")[0] || "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">Most viewed song</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Access Tabs */}
        <Tabs defaultValue="recent" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="recent" className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Recent</span>
            </TabsTrigger>
            <TabsTrigger
              value="favorites"
              className="flex items-center space-x-2"
            >
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Favorites</span>
            </TabsTrigger>
            <TabsTrigger
              value="popular"
              className="flex items-center space-x-2"
            >
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Popular</span>
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center space-x-2">
              <Music className="h-4 w-4" />
              <span className="hidden sm:inline">Browse All</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recent" className="mt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Recently Used Songs</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {recentSongs.map((song) => (
                  <SongCard
                    key={song.id}
                    song={song}
                    onToggleFavorite={handleToggleFavorite}
                    onAddToSetlist={handleAddToSetlist}
                    variant="compact"
                  />
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="favorites" className="mt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Your Favorite Songs</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {favoriteSongs.map((song) => (
                  <SongCard
                    key={song.id}
                    song={song}
                    onToggleFavorite={handleToggleFavorite}
                    onAddToSetlist={handleAddToSetlist}
                    variant="compact"
                  />
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="popular" className="mt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Most Popular Songs</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {popularSongs.map((song) => (
                  <SongCard
                    key={song.id}
                    song={song}
                    onToggleFavorite={handleToggleFavorite}
                    onAddToSetlist={handleAddToSetlist}
                    variant="compact"
                  />
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="all" className="mt-6">
            <div className="space-y-6">
              {/* Search and Filters */}
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search songs, artists, themes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Select value={selectedKey} onValueChange={setSelectedKey}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Key" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Keys</SelectItem>
                      <SelectItem value="C">C</SelectItem>
                      <SelectItem value="D">D</SelectItem>
                      <SelectItem value="E">E</SelectItem>
                      <SelectItem value="F">F</SelectItem>
                      <SelectItem value="G">G</SelectItem>
                      <SelectItem value="A">A</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={selectedDifficulty}
                    onValueChange={setSelectedDifficulty}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Results */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {filteredSongs.length} songs found
                  </p>
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchQuery("")}
                    >
                      Clear search
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredSongs.map((song) => (
                    <SongCard
                      key={song.id}
                      song={song}
                      onToggleFavorite={handleToggleFavorite}
                      onAddToSetlist={handleAddToSetlist}
                    />
                  ))}
                </div>

                {filteredSongs.length === 0 && (
                  <div className="text-center py-12">
                    <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No songs found
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Try adjusting your search or filters
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedKey("all");
                        setSelectedDifficulty("all");
                      }}
                    >
                      Clear all filters
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
