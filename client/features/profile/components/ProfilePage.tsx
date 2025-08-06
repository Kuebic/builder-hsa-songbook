import { useState } from "react";
import { useParams } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileHeader } from "./ProfileHeader";
import { ProfileStats } from "./ProfileStats";
import { ProfileOverview } from "./ProfileOverview";
import { ProfileFavorites } from "./ProfileFavorites";
import { ProfileContributions } from "./ProfileContributions";
import { ProfileActivity } from "./ProfileActivity";
import { ProfileSettings } from "./ProfileSettings";
import { useProfile } from "@features/profile/hooks/useProfile";
import { LoadingSpinner } from "@/shared/components/LoadingSpinner";
import { Layout } from "@/shared/components/Layout";
import { ProfileTab } from "@features/profile/types/profile.types";

export function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser, isLoaded: isClerkLoaded } = useUser();
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");

  // If no userId in params, show current user's profile
  const profileUserId = userId || currentUser?.id;

  const {
    data: profile,
    isLoading,
    error,
    refetch,
  } = useProfile(profileUserId);

  // Check if viewing own profile
  const isOwnProfile = currentUser?.id === profileUserId;

  if (!isClerkLoaded || isLoading) {
    return (
      <Layout>
        <LoadingSpinner message="Loading profile..." />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600">
              Error loading profile
            </h2>
            <p className="text-muted-foreground mt-2">{error.message}</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Profile not found</h2>
            <p className="text-muted-foreground mt-2">
              The user profile you're looking for doesn't exist.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <ProfileHeader
          profile={profile}
          isOwnProfile={isOwnProfile}
          onUpdate={refetch}
        />

        <ProfileStats profile={profile} />

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as ProfileTab)}
          className="mt-8"
        >
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
            <TabsTrigger value="contributions">Contributions</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            {isOwnProfile && (
              <TabsTrigger value="settings">Settings</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <ProfileOverview profile={profile} />
          </TabsContent>

          <TabsContent value="favorites" className="mt-6">
            <ProfileFavorites userId={profile._id} />
          </TabsContent>

          <TabsContent value="contributions" className="mt-6">
            <ProfileContributions userId={profile._id} />
          </TabsContent>

          <TabsContent value="activity" className="mt-6">
            <ProfileActivity userId={profile._id} />
          </TabsContent>

          {isOwnProfile && (
            <TabsContent value="settings" className="mt-6">
              <ProfileSettings profile={profile} onUpdate={refetch} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </Layout>
  );
}
