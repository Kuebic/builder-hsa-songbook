import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Music, Palette, Type } from "lucide-react";

const MUSICAL_KEYS = [
  "C", "C#", "Db", "D", "D#", "Eb", "E", "F", "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B",
];

interface PreferencesCardProps {
  formData: {
    defaultKey: string;
    fontSize: number;
    theme: "light" | "dark" | "stage";
  };
  onChange: (field: string, value: string | number) => void;
}

export function PreferencesCard({ formData, onChange }: PreferencesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferences</CardTitle>
        <CardDescription>Customize your experience</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="defaultKey">
            <Music className="w-4 h-4 inline mr-2" />
            Default Key
          </Label>
          <Select
            value={formData.defaultKey}
            onValueChange={(value) => onChange("defaultKey", value)}
          >
            <SelectTrigger id="defaultKey">
              <SelectValue placeholder="Select a key" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No default</SelectItem>
              {MUSICAL_KEYS.map((key) => (
                <SelectItem key={key} value={key}>
                  {key}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="theme">
            <Palette className="w-4 h-4 inline mr-2" />
            Theme
          </Label>
          <Select
            value={formData.theme}
            onValueChange={(value: "light" | "dark" | "stage") => onChange("theme", value)}
          >
            <SelectTrigger id="theme">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="stage">Stage (High Contrast)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fontSize">
            <Type className="w-4 h-4 inline mr-2" />
            Font Size: {formData.fontSize}px
          </Label>
          <Slider
            id="fontSize"
            min={12}
            max={32}
            step={2}
            value={[formData.fontSize]}
            onValueChange={(value) => onChange("fontSize", value[0])}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>12px</span>
            <span>32px</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}