import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Activity, BarChart3, Eye, FileText, Globe, Heart, Lock, Mail, MapPin, MessageSquare, Music
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserPrivacySettings } from "@features/profile/types/profile.types";

interface PrivacySettingsCardProps {
  privacyData: UserPrivacySettings;
  onChange: (field: keyof UserPrivacySettings, value: boolean) => void;
}

export function PrivacySettingsCard({ privacyData, onChange }: PrivacySettingsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Lock className="w-4 h-4 inline mr-2" />
          Privacy Settings
        </CardTitle>
        <CardDescription>
          Control what information is visible to other worship team members.
          {!privacyData.isPublic && (
            <span className="text-orange-600 font-medium">
              {" "}Your profile is currently private.
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Master Privacy Switch */}
        <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
          <div className="space-y-0.5">
            <Label className="text-base font-medium flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Public Profile
            </Label>
            <p className="text-sm text-muted-foreground">
              Allow other worship team members to see your profile information. When disabled, only basic information is visible.
            </p>
          </div>
          <Switch
            checked={privacyData.isPublic}
            onCheckedChange={(checked) => onChange("isPublic", checked)}
          />
        </div>

        {/* Dependent Settings */}
        <div className="space-y-3 pl-6 border-l-2 border-muted">
          <PrivacyToggle
            icon={<Heart className="w-4 h-4" />}
            label="Show Favorite Songs & Arrangements"
            description="Let others see which songs and arrangements you've favorited"
            checked={privacyData.showFavorites}
            disabled={!privacyData.isPublic}
            onChange={(checked) => onChange("showFavorites", checked)}
          />

          <PrivacyToggle
            icon={<Activity className="w-4 h-4" />}
            label="Show Activity Timeline"
            description="Display your recent songbook activity and verse submissions"
            checked={privacyData.showActivity}
            disabled={!privacyData.isPublic}
            onChange={(checked) => onChange("showActivity", checked)}
          />

          <PrivacyToggle
            icon={<MessageSquare className="w-4 h-4" />}
            label="Show Reviews & Comments"
            description="Make your reviews and comments on arrangements visible to others"
            checked={privacyData.showReviews}
            disabled={!privacyData.isPublic}
            onChange={(checked) => onChange("showReviews", checked)}
          />

          <PrivacyToggle
            icon={<BarChart3 className="w-4 h-4" />}
            label="Show Contribution Statistics"
            description="Display your songbook contribution counts and community engagement"
            checked={privacyData.showStats}
            disabled={!privacyData.isPublic}
            onChange={(checked) => onChange("showStats", checked)}
          />

          <PrivacyToggle
            icon={<FileText className="w-4 h-4" />}
            label="Show Bio"
            description="Make your personal bio visible on your profile"
            checked={privacyData.showBio}
            disabled={!privacyData.isPublic}
            onChange={(checked) => onChange("showBio", checked)}
          />

          <PrivacyToggle
            icon={<MapPin className="w-4 h-4" />}
            label="Show Location"
            description="Display your location to help connect with local musicians"
            checked={privacyData.showLocation}
            disabled={!privacyData.isPublic}
            onChange={(checked) => onChange("showLocation", checked)}
          />

          <PrivacyToggle
            icon={<Globe className="w-4 h-4" />}
            label="Show Website"
            description="Make your website or ministry link visible to others"
            checked={privacyData.showWebsite}
            disabled={!privacyData.isPublic}
            onChange={(checked) => onChange("showWebsite", checked)}
          />

          <PrivacyToggle
            icon={<Mail className="w-4 h-4" />}
            label="Allow Ministry Contact"
            description="Allow other users to see your email for worship ministry purposes"
            checked={privacyData.allowContact}
            disabled={!privacyData.isPublic}
            onChange={(checked) => onChange("allowContact", checked)}
          />
        </div>

        {/* Contributions - Independent setting */}
        <div className="p-4 rounded-lg border bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium flex items-center gap-2">
                <Music className="w-4 h-4" />
                Show My Contributions
              </Label>
              <p className="text-sm text-muted-foreground">
                Make your arrangements and verse submissions visible for ministry use. This helps the worship community even if your profile is private.
              </p>
            </div>
            <Switch
              checked={privacyData.showContributions}
              onCheckedChange={(checked) => onChange("showContributions", checked)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface PrivacyToggleProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}

function PrivacyToggle({ icon, label, description, checked, disabled, onChange }: PrivacyToggleProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label className={cn("flex items-center gap-2", disabled && "text-muted-foreground")}>
          {icon}
          {label}
        </Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}