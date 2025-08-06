import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import { useSubmitVerse } from "@features/songs/hooks/useVerses";
import { verseSubmitSchema } from "@features/songs/types/song.types";
import type { z } from "zod";

type VerseSubmitFormData = z.infer<typeof verseSubmitSchema>;

export interface VerseSubmitFormProps {
  songId: string;
  onSubmit: () => void;
  onCancel: () => void;
}

export default function VerseSubmitForm({
  songId,
  onSubmit,
  onCancel,
}: VerseSubmitFormProps) {
  const submitVerse = useSubmitVerse();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<VerseSubmitFormData>({
    resolver: zodResolver(verseSubmitSchema),
    defaultValues: {
      type: "bible",
    },
  });

  const selectedType = watch("type");

  const onSubmitForm = async (data: VerseSubmitFormData) => {
    try {
      await submitVerse.mutateAsync({
        songId,
        ...data,
      });
      onSubmit();
    } catch (error) {
      // Error handling is done in the mutation hook
      console.error("Failed to submit verse:", error);
    }
  };

  const getPlaceholderText = (type: string) => {
    switch (type) {
      case "bible":
        return "e.g., Ephesians 2:8-9, Romans 3:23-24";
      case "tf":
        return "e.g., TF 123:4, TF 45:2-3";
      case "tm":
        return "e.g., TM 67:1, TM 12:3-4";
      default:
        return "Enter the reference";
    }
  };

  return (
    <Card className="border-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Submit a Biblical Reference</CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
          {/* Reference Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Source Type</Label>
            <Select
              value={selectedType}
              onValueChange={(value) =>
                setValue("type", value as "bible" | "tf" | "tm")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select source type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bible">Bible</SelectItem>
                <SelectItem value="tf">Talks from Favorites</SelectItem>
                <SelectItem value="tm">The Mission</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reference */}
          <div className="space-y-2">
            <Label htmlFor="reference">Reference</Label>
            <Input
              id="reference"
              placeholder={getPlaceholderText(selectedType)}
              {...register("reference")}
            />
            {errors.reference && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {errors.reference.message}
              </p>
            )}
          </div>

          {/* Text */}
          <div className="space-y-2">
            <Label htmlFor="text">
              {selectedType === "bible" ? "Verse Text" : "Quote Text"}
            </Label>
            <Textarea
              id="text"
              placeholder={
                selectedType === "bible"
                  ? "Enter the verse text..."
                  : "Enter the quote text..."
              }
              rows={4}
              {...register("text")}
            />
            {errors.text && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {errors.text.message}
              </p>
            )}
          </div>

          {/* Help text */}
          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
            <p className="font-medium mb-1">Guidelines:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>
                Choose verses or quotes that relate to the song's themes or
                message
              </li>
              <li>Include the complete reference for easy verification</li>
              <li>Submissions will be reviewed before appearing publicly</li>
              <li>
                Be respectful and contribute meaningfully to the discussion
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "Submitting..." : "Submit Reference"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
