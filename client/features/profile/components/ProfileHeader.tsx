import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Calendar,
  Globe,
  MapPin,
  Clock,
  Edit,
  UserPlus,
  Mail,
} from "lucide-react";
import { UserProfile } from "@features/profile/types/profile.types";

interface ProfileHeaderProps {
  profile: UserProfile;
  isOwnProfile: boolean;
  onUpdate?: () => void;
}

export function ProfileHeader({
  profile,
  isOwnProfile,
  onUpdate,
}: ProfileHeaderProps) {
  const initials = profile.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "destructive";
      case "MODERATOR":
        return "default";
      default:
        return "secondary";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "Administrator";
      case "MODERATOR":
        return "Moderator";
      default:
        return "Member";
    }
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col md:flex-row gap-6">
        <Avatar className="w-24 h-24 md:w-32 md:h-32">
          <AvatarImage
            src={`https://api.dicebear.com/7.x/initials/svg?seed=${profile.email}`}
          />
          <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{profile.name}</h1>
                <Badge variant={getRoleBadgeVariant(profile.role)}>
                  {getRoleLabel(profile.role)}
                </Badge>
              </div>

              {profile.profile?.bio && (
                <p className="text-muted-foreground mt-2 max-w-2xl">
                  {profile.profile.bio}
                </p>
              )}

              <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                {profile.profile?.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{profile.profile.location}</span>
                  </div>
                )}

                {profile.profile?.website && (
                  <a
                    href={profile.profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                    <span>Website</span>
                  </a>
                )}

                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Joined {format(new Date(profile.createdAt), "MMMM yyyy")}
                  </span>
                </div>

                {profile.lastLoginAt && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>
                      Last seen {format(new Date(profile.lastLoginAt), "PPp")}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {isOwnProfile ? (
                <Button onClick={onUpdate} variant="outline">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button variant="outline" size="sm">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Follow
                  </Button>
                  <Button variant="outline" size="sm">
                    <Mail className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
