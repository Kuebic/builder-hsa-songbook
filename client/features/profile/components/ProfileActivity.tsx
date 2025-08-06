import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Music,
  FileMusic,
  ListMusic,
  MessageSquare,
  Star,
  Clock,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { useProfileActivity } from "@features/profile/hooks/useProfileActivity";
import { LoadingSpinner } from "@/shared/components/LoadingSpinner";
import { ProfileActivity as ProfileActivityType } from "@features/profile/types/profile.types";

interface ProfileActivityProps {
  userId: string;
}

export function ProfileActivity({ userId }: ProfileActivityProps) {
  const { data: activities, isLoading, error } = useProfileActivity(userId);

  if (isLoading) {
    return <LoadingSpinner message="Loading activity..." />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Failed to load activity
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No recent activity</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getActivityIcon = (type: ProfileActivityType["type"]) => {
    switch (type) {
      case "song_created":
        return Music;
      case "arrangement_created":
        return FileMusic;
      case "setlist_created":
        return ListMusic;
      case "verse_submitted":
        return MessageSquare;
      case "review_posted":
        return Star;
      default:
        return Clock;
    }
  };

  const getActivityColor = (type: ProfileActivityType["type"]) => {
    switch (type) {
      case "song_created":
        return "bg-blue-100 text-blue-600";
      case "arrangement_created":
        return "bg-green-100 text-green-600";
      case "setlist_created":
        return "bg-purple-100 text-purple-600";
      case "verse_submitted":
        return "bg-yellow-100 text-yellow-600";
      case "review_posted":
        return "bg-orange-100 text-orange-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getActivityLabel = (type: ProfileActivityType["type"]) => {
    switch (type) {
      case "song_created":
        return "Created a song";
      case "arrangement_created":
        return "Added an arrangement";
      case "setlist_created":
        return "Created a setlist";
      case "verse_submitted":
        return "Submitted a verse";
      case "review_posted":
        return "Posted a review";
      default:
        return "Activity";
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities.map((activity, index) => {
              const Icon = getActivityIcon(activity.type);
              const colorClass = getActivityColor(activity.type);

              return (
                <div
                  key={`${activity.type}-${activity.timestamp}-${index}`}
                  className="flex items-start gap-4"
                >
                  <div className={`p-2 rounded-lg ${colorClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {getActivityLabel(activity.type)}
                    </p>
                    <Link
                      to={`/${activity.type.includes("song") ? "songs" : activity.type.includes("arrangement") ? "arrangements" : "setlists"}/${activity.details.id}`}
                      className="text-sm text-primary hover:underline truncate block"
                    >
                      {activity.details.title}
                    </Link>
                    {activity.details.subtitle && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {activity.details.subtitle}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(activity.timestamp), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border"></div>
            {activities.slice(0, 10).map((activity, index) => {
              const Icon = getActivityIcon(activity.type);
              const colorClass = getActivityColor(activity.type);

              return (
                <div
                  key={`timeline-${activity.type}-${activity.timestamp}-${index}`}
                  className="relative flex items-start gap-4 pb-6"
                >
                  <div
                    className={`relative z-10 p-2 rounded-full ${colorClass} bg-background border-2 border-border`}
                  >
                    <Icon className="w-3 h-3" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {getActivityLabel(activity.type)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activity.details.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(
                        new Date(activity.timestamp),
                        "MMM d, yyyy 'at' h:mm a",
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
