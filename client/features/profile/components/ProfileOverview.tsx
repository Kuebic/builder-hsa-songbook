import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { UserProfile } from "@features/profile/types/profile.types";
import {
  Music,
  FileMusic,
  ListMusic,
} from "lucide-react";

interface ProfileOverviewProps {
  profile: UserProfile;
}

export function ProfileOverview({ profile }: ProfileOverviewProps) {
  // Calculate contribution level based on total contributions
  const totalContributions =
    profile.stats.songsCreated +
    profile.stats.arrangementsCreated +
    profile.stats.setlistsCreated;

  const getContributionLevel = (total: number) => {
    if (total >= 100) {
      return { level: "Expert", progress: 100, color: "text-purple-600" };
    }
    if (total >= 50) {
      return {
        level: "Advanced",
        progress: (total / 100) * 100,
        color: "text-blue-600",
      };
    }
    if (total >= 20) {
      return {
        level: "Intermediate",
        progress: (total / 50) * 100,
        color: "text-green-600",
      };
    }
    if (total >= 5) {
      return {
        level: "Contributor",
        progress: (total / 20) * 100,
        color: "text-yellow-600",
      };
    }
    return {
      level: "Newcomer",
      progress: (total / 5) * 100,
      color: "text-gray-600",
    };
  };

  const contributionLevel = getContributionLevel(totalContributions);

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Contribution Level</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span
                className={`text-lg font-semibold ${contributionLevel.color}`}
              >
                {contributionLevel.level}
              </span>
              <span className="text-sm text-muted-foreground">
                {totalContributions} total contributions
              </span>
            </div>
            <Progress value={contributionLevel.progress} className="h-2" />
            <p className="text-sm text-muted-foreground">
              Keep contributing to reach the next level!
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Music className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {profile.stats.songsCreated}
                </p>
                <p className="text-xs text-muted-foreground">Songs</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileMusic className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {profile.stats.arrangementsCreated}
                </p>
                <p className="text-xs text-muted-foreground">Arrangements</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ListMusic className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {profile.stats.setlistsCreated}
                </p>
                <p className="text-xs text-muted-foreground">Setlists</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {profile.preferences && (
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Default Key</span>
                <Badge variant="outline">
                  {profile.preferences.defaultKey || "Not set"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Theme</span>
                <Badge variant="outline">{profile.preferences.theme || "light"}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Font Size</span>
                <Badge variant="outline">{profile.preferences.fontSize || 16}px</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {profile.role !== "USER" && (
        <Card>
          <CardHeader>
            <CardTitle>Moderator Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              As a {profile.role.toLowerCase()}, you have access to additional
              moderation tools and features.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
