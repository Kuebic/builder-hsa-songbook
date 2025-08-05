import {
  TrendingUp,
  Music,
  Users,
  Calendar,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSongsStats } from "../../songs/hooks/useSongsAPI";
import { CategoryGrid } from "@features/categories";


export default function BrowseTabs() {
  // Fetch stats for overview cards
  const { data: stats, isLoading: statsLoading } = useSongsStats();

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
            {stats?.mostPopularViews || 0}
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
          <div className="text-2xl font-bold">
            {stats?.topContributors || 1}
          </div>
          <p className="text-xs text-muted-foreground">
            active community members
          </p>
        </CardContent>
      </Card>
    </div>
  );



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
          <CategoryGrid maxCategories={6} onCategorySelect={() => {}} />
        </TabsContent>

        <TabsContent value="setlists" className="space-y-6">
          <Card className="p-8 text-center">
            <CardContent>
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Setlists Coming Soon
              </h3>
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
                Discover what&apos;s popular in the worship community.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
