import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Globe, MapPin, User } from "lucide-react";

interface ProfileInfoCardProps {
  formData: {
    name: string;
    bio: string;
    website: string;
    location: string;
  };
  onChange: (field: string, value: string) => void;
}

export function ProfileInfoCard({ formData, onChange }: ProfileInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>Update your public profile information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">
            <User className="w-4 h-4 inline mr-2" />
            Display Name
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => onChange("name", e.target.value)}
            placeholder="Your name"
            maxLength={100}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={formData.bio}
            onChange={(e) => onChange("bio", e.target.value)}
            placeholder="Tell us about yourself..."
            maxLength={500}
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            {formData.bio.length}/500 characters
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">
            <Globe className="w-4 h-4 inline mr-2" />
            Website
          </Label>
          <Input
            id="website"
            type="url"
            value={formData.website}
            onChange={(e) => onChange("website", e.target.value)}
            placeholder="https://example.com"
            maxLength={200}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">
            <MapPin className="w-4 h-4 inline mr-2" />
            Location
          </Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => onChange("location", e.target.value)}
            placeholder="City, Country"
            maxLength={100}
          />
        </div>
      </CardContent>
    </Card>
  );
}