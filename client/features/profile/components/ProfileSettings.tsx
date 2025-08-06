import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";
import { UserProfile, UserPrivacySettings } from "@features/profile/types/profile.types";
import { useUpdateProfile } from "@features/profile/hooks/useUpdateProfile";
import { ProfileInfoCard } from "./ProfileInfoCard";
import { PreferencesCard } from "./PreferencesCard";
import { PrivacySettingsCard } from "./PrivacySettingsCard";

interface ProfileSettingsProps {
  profile: UserProfile;
  onUpdate?: () => void;
}

export function ProfileSettings({ profile, onUpdate }: ProfileSettingsProps) {
  const { toast } = useToast();
  const {
    updateProfile,
    updatePrivacy,
    isUpdating,
    profileError,
    privacyError,
  } = useUpdateProfile();

  const [formData, setFormData] = useState({
    name: profile.name,
    bio: profile.profile?.bio || "",
    website: profile.profile?.website || "",
    location: profile.profile?.location || "",
    defaultKey: profile.preferences?.defaultKey || "none",
    fontSize: profile.preferences?.fontSize || 16,
    theme: profile.preferences?.theme || "light" as "light" | "dark" | "stage",
  });

  // Privacy settings state
  const [privacyData, setPrivacyData] = useState<UserPrivacySettings>({
    isPublic: profile.profilePrivacy?.isPublic || false,
    showFavorites: profile.profilePrivacy?.showFavorites || false,
    showActivity: profile.profilePrivacy?.showActivity || false,
    showContributions: profile.profilePrivacy?.showContributions ?? true, // Default true for ministry value
    showReviews: profile.profilePrivacy?.showReviews || false,
    allowContact: profile.profilePrivacy?.allowContact || false,
    showStats: profile.profilePrivacy?.showStats || false,
    showBio: profile.profilePrivacy?.showBio || false,
    showLocation: profile.profilePrivacy?.showLocation || false,
    showWebsite: profile.profilePrivacy?.showWebsite || false,
  });

  // Cascade effect - disable dependent settings when profile is private
  useEffect(() => {
    if (!privacyData.isPublic) {
      setPrivacyData((prev) => ({
        ...prev,
        showFavorites: false,
        showActivity: false,
        showReviews: false,
        allowContact: false,
        showStats: false,
        showBio: false,
        showLocation: false,
        showWebsite: false,
        // showContributions can remain true even if profile is private (ministry value)
      }));
    }
  }, [privacyData.isPublic]);

  const handleFormChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePrivacyChange = (field: keyof UserPrivacySettings, value: boolean) => {
    setPrivacyData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Update profile information
      await updateProfile(profile._id, {
        name: formData.name,
        profile: {
          bio: formData.bio,
          website: formData.website,
          location: formData.location,
        },
        preferences: {
          defaultKey: formData.defaultKey === "none" ? undefined : formData.defaultKey,
          fontSize: formData.fontSize,
          theme: formData.theme,
        },
      });

      // Update privacy settings
      await updatePrivacy(profile._id, {
        profilePrivacy: privacyData,
      });

      toast({
        title: "Profile updated",
        description:
          "Your profile and privacy settings have been successfully updated.",
      });

      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      // Check which update failed
      if (profileError) {
        toast({
          title: "Profile update failed",
          description:
            "Failed to update your profile information. Please try again.",
          variant: "destructive",
        });
      }

      if (privacyError) {
        toast({
          title: "Privacy update failed",
          description:
            "Failed to update your privacy settings. Please try again.",
          variant: "destructive",
        });
      }

      if (!profileError && !privacyError) {
        toast({
          title: "Update failed",
          description: "Failed to update your settings. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ProfileInfoCard
        formData={{
          name: formData.name,
          bio: formData.bio,
          website: formData.website,
          location: formData.location,
        }}
        onChange={handleFormChange}
      />

      <PreferencesCard
        formData={{
          defaultKey: formData.defaultKey,
          fontSize: formData.fontSize,
          theme: formData.theme,
        }}
        onChange={handleFormChange}
      />

      <PrivacySettingsCard
        privacyData={privacyData}
        onChange={handlePrivacyChange}
      />

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => window.location.reload()}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isUpdating}>
          <Save className="w-4 h-4 mr-2" />
          {isUpdating ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
