import { useState, useEffect, useCallback, useMemo, memo } from "react";
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
import { useChordTransposition } from "../hooks/useChordTransposition";
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
  debounceMs?: number;
  fontSize?: number;
  theme?: "light" | "dark" | "stage";
}

function ChordProEditor({
  initialContent,
  songTitle,
  onSave,
  onCancel,
  isLoading = false,
  readOnly = false,
  debounceMs = 300,
  fontSize = 14, // eslint-disable-line @typescript-eslint/no-unused-vars
  theme = "light", // eslint-disable-line @typescript-eslint/no-unused-vars
}: ChordProEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [debouncedContent, setDebouncedContent] = useState(initialContent);
  const [hasChanges, setHasChanges] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCorrupted, setIsCorrupted] = useState(false);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Debounced content update for live preview
  const debouncedUpdateContent = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    const debouncedFn = (newContent: string) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setDebouncedContent(newContent);
      }, debounceMs);
    };

    debouncedFn.cancel = () => clearTimeout(timeoutId);
    return debouncedFn;
  }, [debounceMs]);

  useEffect(() => {
    setHasChanges(content !== initialContent);
    debouncedUpdateContent(content);
    return () => {
      debouncedUpdateContent.cancel?.();
    };
  }, [content, initialContent, debouncedUpdateContent]);

  useEffect(() => {
    // Check if initial content appears corrupted
    setIsCorrupted(isCorruptedChordData(initialContent));
  }, [initialContent]);

  // Set up transposition hook
  const transposition = useChordTransposition({
    initialTranspose: 0,
    content: debouncedContent,
    enableKeyDetection: true,
  });

  const handleSave = useCallback(() => {
    onSave(content);
  }, [content, onSave]);

  const handleCancel = useCallback(() => {
    if (hasChanges) {
      setShowCancelDialog(true);
    } else {
      onCancel();
    }
  }, [hasChanges, onCancel]);

  const confirmCancel = useCallback(() => {
    setShowCancelDialog(false);
    onCancel();
  }, [onCancel]);

  const handleFixCorruptedData = useCallback(() => {
    // Clear corrupted data and replace with empty template
    const cleanTemplate = `{title: ${songTitle.split(" - ")[0]}}
{key: C}

[C]Add your lyrics and chords here...`;
    setContent(cleanTemplate);
    setIsCorrupted(false);
  }, [songTitle]);

  // Enhanced editor functions
  const handleUndo = useCallback(() => {
    if (undoStack.length > 0) {
      const previousContent = undoStack[undoStack.length - 1];
      setRedoStack((prev) => [...prev, content]);
      setUndoStack((prev) => prev.slice(0, -1));
      setContent(previousContent);
    }
  }, [content, undoStack]);

  const handleRedo = useCallback(() => {
    if (redoStack.length > 0) {
      const nextContent = redoStack[redoStack.length - 1];
      setUndoStack((prev) => [...prev, content]);
      setRedoStack((prev) => prev.slice(0, -1));
      setContent(nextContent);
    }
  }, [content, redoStack]);

  const handleContentChange = useCallback(
    (newContent: string) => {
      // Add to undo stack if significant change
      if (Math.abs(newContent.length - content.length) > 1) {
        setUndoStack((prev) => [...prev.slice(-19), content]); // Keep last 20 states
        setRedoStack([]);
      }
      setContent(newContent);
    },
    [content],
  );

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
          onChange={handleContentChange}
          debouncedContent={debouncedContent}
          readOnly={readOnly}
          isMobile={isMobile}
          undoStack={undoStack}
          redoStack={redoStack}
          transposition={transposition}
          onUndo={handleUndo}
          onRedo={handleRedo}
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

// Performance comparison function for React.memo
const arePropsEqual = (
  prevProps: ChordProEditorProps,
  nextProps: ChordProEditorProps,
): boolean => {
  // Compare primitive props
  return (
    prevProps.initialContent === nextProps.initialContent &&
    prevProps.songTitle === nextProps.songTitle &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.readOnly === nextProps.readOnly &&
    prevProps.debounceMs === nextProps.debounceMs &&
    prevProps.fontSize === nextProps.fontSize &&
    prevProps.theme === nextProps.theme &&
    // Functions should be memoized by parent
    prevProps.onSave === nextProps.onSave &&
    prevProps.onCancel === nextProps.onCancel
  );
};

// Export memoized component with custom comparison
export default memo(ChordProEditor, arePropsEqual);
