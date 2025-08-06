import { CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Save, X, AlertCircle } from "lucide-react";

interface ChordProEditorHeaderProps {
  songTitle: string;
  readOnly: boolean;
  hasChanges: boolean;
  isLoading: boolean;
  onSave: () => void;
  onCancel: () => void;
}

export function ChordProEditorHeader({
  songTitle,
  readOnly,
  hasChanges,
  isLoading,
  onSave,
  onCancel,
}: ChordProEditorHeaderProps) {
  return (
    <CardHeader className="border-b">
      <div className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {readOnly ? "View Arrangement" : "ChordPro Editor"} - {songTitle}
        </CardTitle>
        <div className="flex items-center gap-2">
          {!readOnly && hasChanges && (
            <Badge variant="secondary" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              Unsaved changes
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={onCancel}>
            <X className="mr-2 h-4 w-4" />
            {readOnly ? "Close" : "Cancel"}
          </Button>
          {!readOnly && (
            <Button size="sm" onClick={onSave} disabled={!hasChanges || isLoading}>
              <Save className="mr-2 h-4 w-4" />
              {isLoading ? "Saving..." : "Save"}
            </Button>
          )}
        </div>
      </div>
    </CardHeader>
  );
}