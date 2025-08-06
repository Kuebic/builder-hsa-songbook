import { Card } from "@/components/ui/card";
import { Music, FileMusic, ListMusic, Trophy } from "lucide-react";
import { UserProfile } from "@features/profile/types/profile.types";

interface ProfileStatsProps {
  profile: UserProfile;
}

export function ProfileStats({ profile }: ProfileStatsProps) {
  const stats = [
    {
      label: "Songs Created",
      value: profile.stats.songsCreated,
      icon: Music,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      label: "Arrangements",
      value: profile.stats.arrangementsCreated,
      icon: FileMusic,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      label: "Setlists",
      value: profile.stats.setlistsCreated,
      icon: ListMusic,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      label: "Total Contributions",
      value:
        profile.stats.songsCreated +
        profile.stats.arrangementsCreated +
        profile.stats.setlistsCreated,
      icon: Trophy,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">
                  {stat.value.toLocaleString()}
                </p>
              </div>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
