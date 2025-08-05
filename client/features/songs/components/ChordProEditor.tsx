import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  FileText,
  X,
  AlertCircle,
  GripVertical,
} from "lucide-react";
import { ChordDisplay } from "./ChordDisplay";
import { ChordProTextEditor } from "./ChordProTextEditor";
import { ChordProEditorToolbar } from "./ChordProEditorToolbar";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useChordTransposition } from "../hooks/useChordTransposition";
import { debounce } from "lodash";

export interface ChordProEditorProps {
  initialContent: string;
  songTitle: string;
  onSave: (content: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
  readOnly?: boolean;
  debounceMs?: number;
  fontSize?: number;
  theme?: 'light' | 'dark' | 'stage';
}

/**
 * Detects if chord data appears to be corrupted/encrypted
 * Common indicators: base64-like strings, binary data, unusual character patterns
 */
function isCorruptedChordData(data: string): boolean {
  if (!data || data.trim() === "") {return false;}
  
  // Check for base64-like patterns (long strings with only base64 characters)
  const base64Pattern = /^[A-Za-z0-9+/]{20,}={0,2}$/;
  if (base64Pattern.test(data.replace(/\s/g, ""))) {
    return true;
  }
  
  // Check for excessive non-printable characters
  // eslint-disable-next-line no-control-regex
  const nonPrintableCount = (data.match(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\xFF]/g) || []).length;
  if (nonPrintableCount > data.length * 0.1) { // More than 10% non-printable
    return true;
  }
  
  // Check for patterns that look like compressed data
  if (data.startsWith("�") || data.includes("\x00") || data.includes("\\x")) {
    return true;
  }
  
  return false;
}

export default function ChordProEditor({
  initialContent,
  songTitle,
  onSave,
  onCancel,
  isLoading = false,
  readOnly = false,
  debounceMs = 300,
  fontSize = 14,
  theme = 'light',
}: ChordProEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [debouncedContent, setDebouncedContent] = useState(initialContent);
  const [hasChanges, setHasChanges] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [isCorrupted, setIsCorrupted] = useState(false);
  const [editorFontSize, setEditorFontSize] = useState(fontSize);
  const [displayTheme, setDisplayTheme] = useState(theme);
  const [showChords, setShowChords] = useState(true);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Debounced content update for live preview
  const debouncedUpdateContent = useMemo(
    () => debounce((newContent: string) => {
      setDebouncedContent(newContent);
    }, debounceMs),
    [debounceMs]
  );

  useEffect(() => {
    setHasChanges(content !== initialContent);
    debouncedUpdateContent(content);
    return () => {
      debouncedUpdateContent.cancel();
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
      setRedoStack(prev => [...prev, content]);
      setUndoStack(prev => prev.slice(0, -1));
      setContent(previousContent);
    }
  }, [content, undoStack]);

  const handleRedo = useCallback(() => {
    if (redoStack.length > 0) {
      const nextContent = redoStack[redoStack.length - 1];
      setUndoStack(prev => [...prev, content]);
      setRedoStack(prev => prev.slice(0, -1));
      setContent(nextContent);
    }
  }, [content, redoStack]);

  const handleContentChange = useCallback((newContent: string) => {
    // Add to undo stack if significant change
    if (Math.abs(newContent.length - content.length) > 1) {
      setUndoStack(prev => [...prev.slice(-19), content]); // Keep last 20 states
      setRedoStack([]);
    }
    setContent(newContent);
  }, [content]);

  const handleInsertAtCursor = useCallback((text: string) => {
    // This would need textarea ref to get cursor position
    // For now, append to end
    setContent(prev => prev + text);
  }, []);

  const handleExport = useCallback((format: 'pdf' | 'html' | 'txt') => {
    // TODO: Implement export functionality
    console.log('Export as:', format);
  }, []);

  const handleShowHelp = useCallback(() => {
    // TODO: Implement help modal
    console.log('Show help');
  }, []);


  return (
    <>
      <Card className="chord-pro-editor-container h-full">
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
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
              >
                <X className="mr-2 h-4 w-4" />
                {readOnly ? "Close" : "Cancel"}
              </Button>
              {!readOnly && (
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={!hasChanges || isLoading}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isLoading ? "Saving..." : "Save"}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        {/* Corrupted Data Warning */}
        {isCorrupted && (
          <div className="border-b bg-destructive/10 px-4 py-3">
            <Alert className="border-destructive/20">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Corrupted Chord Data Detected</AlertTitle>
              <AlertDescription className="mt-2">
                The chord data appears to be corrupted or encrypted. This may happen with older songs 
                that had compression issues.
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
        
        <CardContent className="p-0 h-[calc(100vh-12rem)]">
          {!readOnly && isMobile && (
            <div className="border-b px-4 py-2 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="gap-2"
              >
                <Eye className={`h-4 w-4 ${!showPreview ? "opacity-50" : ""}`} />
                {showPreview ? "Hide Preview" : "Show Preview"}
              </Button>
            </div>
          )}
          
          {/* Mobile Layout - Stacked */}
          {isMobile ? (
            <div className="h-full">
              {!readOnly && !showPreview && (
                <div className="h-full p-4 overflow-auto">
                  <div className="space-y-4">
                    <div className="bg-muted/50 rounded-md p-3 text-sm">
                      <p className="font-medium mb-2">ChordPro Quick Reference:</p>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• Chords: [C] [G] [Am] [F]</li>
                        <li>• Title: {"{title: Song Title}"}</li>
                        <li>• Artist: {"{subtitle: Artist Name}"}</li>
                        <li>• Comments: {"{comment: This is a comment}"}</li>
                        <li>• Sections: {"{chorus}"} {"{verse: 1}"}</li>
                      </ul>
                    </div>
                    
                    <Textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="font-mono text-sm min-h-[400px] resize-none"
                      placeholder="Enter ChordPro formatted lyrics here..."
                      readOnly={readOnly}
                    />
                  </div>
                </div>
              )}
              
              {(showPreview || readOnly) && (
                <div className="h-full p-4 overflow-auto">
                  <ChordDisplay
                    content={content}
                    theme="light"
                    showControls={true}
                    className="max-w-none"
                  />
                </div>
              )}
            </div>
          ) : (
            /* Desktop Layout - Resizable Split Panes */
            <ResizablePanelGroup
              direction="horizontal"
              className="h-full"
            >
              {/* Editor Panel */}
              {!readOnly && (
                <>
                  <ResizablePanel
                    defaultSize={50}
                    minSize={20}
                    className="min-w-[300px]"
                  >
                    <div className="h-full p-4 overflow-auto">
                      <div className="space-y-4">
                        <div className="bg-muted/50 rounded-md p-3 text-sm">
                          <p className="font-medium mb-2">ChordPro Quick Reference:</p>
                          <ul className="space-y-1 text-muted-foreground">
                            <li>• Chords: [C] [G] [Am] [F]</li>
                            <li>• Title: {"{title: Song Title}"}</li>
                            <li>• Artist: {"{subtitle: Artist Name}"}</li>
                            <li>• Comments: {"{comment: This is a comment}"}</li>
                            <li>• Sections: {"{chorus}"} {"{verse: 1}"}</li>
                          </ul>
                        </div>
                        
                        <Textarea
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          className="font-mono text-sm min-h-[calc(100vh-20rem)] resize-none"
                          placeholder="Enter ChordPro formatted lyrics here..."
                          readOnly={readOnly}
                        />
                      </div>
                    </div>
                  </ResizablePanel>
                  
                  <ResizableHandle withHandle className="bg-border">
                    <div className="flex h-full w-full items-center justify-center">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </ResizableHandle>
                </>
              )}
              
              {/* Preview Panel */}
              <ResizablePanel
                defaultSize={readOnly ? 100 : 50}
                minSize={20}
                className="min-w-[300px]"
              >
                <div className="h-full p-4 overflow-auto">
                  <ChordDisplay
                    content={content}
                    theme="light"
                    showControls={true}
                    className="max-w-none"
                  />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          )}
        </CardContent>
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
