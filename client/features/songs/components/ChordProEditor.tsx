import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertCircle } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { isCorruptedChordData } from "./ChordProEditorHelpers";
import { ChordProEditorHeader } from "./ChordProEditorHeader";
import { ChordProEditorContent } from "./ChordProEditorContent";

export interface ChordProEditorProps {
  initialContent: string;
  songTitle: string;
  onSave: (content: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
  readOnly?: boolean;
}


export default function ChordProEditor({
  initialContent,
  songTitle,
  onSave,
  onCancel,
  isLoading = false,
  readOnly = false,
}: ChordProEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [hasChanges, setHasChanges] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCorrupted, setIsCorrupted] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    setHasChanges(content !== initialContent);
  }, [content, initialContent]);

  useEffect(() => {
    // Check if initial content appears corrupted
    setIsCorrupted(isCorruptedChordData(initialContent));
  }, [initialContent]);

  const handleSave = () => {
    onSave(content);
  };

  const handleCancel = () => {
    if (hasChanges) {
      setShowCancelDialog(true);
    } else {
      onCancel();
    }
  };

  const confirmCancel = () => {
    setShowCancelDialog(false);
    onCancel();
  };

  const handleFixCorruptedData = () => {
    // Clear corrupted data and replace with empty template
    const cleanTemplate = `{title: ${songTitle.split(" - ")[0]}}
{key: C}

[C]Add your lyrics and chords here...`;
    setContent(cleanTemplate);
    setIsCorrupted(false);
  };


  return (
    <>
      <Card className="chord-pro-editor-container h-full">
        <ChordProEditorHeader
          songTitle={songTitle}
          readOnly={readOnly}
          hasChanges={hasChanges}
          isLoading={isLoading}
          onSave={handleSave}
          onCancel={handleCancel}
        />

        {/* Corrupted Data Warning */}
        {isCorrupted && (
          <div className="border-b bg-destructive/10 px-4 py-3">
            <Alert className="border-destructive/20">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Corrupted Chord Data Detected</AlertTitle>
              <AlertDescription className="mt-2">
                The chord data appears to be corrupted or encrypted. This may
                happen with older songs that had compression issues.
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleFixCorruptedData}
                    className="bg-background"
                  >
                    Replace with Clean Template
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCorrupted(false)}
                    className="text-muted-foreground"
                  >
                    Continue Anyway
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}

        <ChordProEditorContent
          content={content}
          onChange={setContent}
          readOnly={readOnly}
          isMobile={isMobile}
        />
      </Card>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to discard them?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancel}>
              Discard changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
