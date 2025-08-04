import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  FileText, 
  Eye, 
  Save, 
  X,
  AlertCircle,
  Music,
} from "lucide-react";
import { ChordProPreviewErrorBoundary } from "./ChordProPreviewErrorBoundary";

interface ChordProEditorProps {
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
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    setHasChanges(content !== initialContent);
  }, [content, initialContent]);

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

  // Simple ChordPro preview renderer
  const renderPreview = () => {
    const lines = content.split("\n");
    return lines.map((line, index) => {
      // Handle ChordPro directives
      if (line.startsWith("{") && line.endsWith("}")) {
        const directive = line.slice(1, -1);
        const [key, value] = directive.split(":");
        
        switch (key.toLowerCase()) {
          case "title":
          case "t":
            return <h2 key={index} className="text-2xl font-bold mb-2">{value?.trim()}</h2>;
          case "subtitle":
          case "st":
            return <h3 key={index} className="text-lg text-muted-foreground mb-4">{value?.trim()}</h3>;
          case "comment":
          case "c":
            return <p key={index} className="text-sm italic text-muted-foreground my-2">{value?.trim()}</p>;
          case "chorus":
            return <div key={index} className="mt-4 mb-2 font-semibold">Chorus:</div>;
          case "verse":
            return <div key={index} className="mt-4 mb-2 font-semibold">Verse {value?.trim()}:</div>;
          default:
            return null;
        }
      }
      
      // Handle chord lines
      const chordRegex = /\[([^\]]+)\]/g;
      if (line.match(chordRegex)) {
        const parts = [];
        let lastIndex = 0;
        let match;
        
        while ((match = chordRegex.exec(line)) !== null) {
          if (match.index > lastIndex) {
            parts.push(
              <span key={`text-${index}-${lastIndex}`}>
                {line.slice(lastIndex, match.index)}
              </span>,
            );
          }
          parts.push(
            <span key={`chord-${index}-${match.index}`} className="text-primary font-bold">
              {match[1]}
            </span>,
          );
          lastIndex = match.index + match[0].length;
        }
        
        if (lastIndex < line.length) {
          parts.push(
            <span key={`text-${index}-${lastIndex}`}>
              {line.slice(lastIndex)}
            </span>,
          );
        }
        
        return <div key={index} className="my-1">{parts}</div>;
      }
      
      // Regular text line
      return <div key={index} className="my-1">{line || <br />}</div>;
    });
  };

  return (
    <>
      <Card>
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
        <CardContent className="p-0">
          {!readOnly && (
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
          
          <div className={`grid ${showPreview && !readOnly ? "md:grid-cols-2 divide-y md:divide-y-0 md:divide-x" : "grid-cols-1"}`}>
            {/* Editor Panel */}
            {!readOnly && (
              <div className={`${showPreview ? "md:border-r" : ""} p-4`}>
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
                    className="font-mono text-sm min-h-[500px] resize-none"
                    placeholder="Enter ChordPro formatted lyrics here..."
                    readOnly={readOnly}
                  />
                </div>
              </div>
            )}
            
            {/* Preview Panel */}
            {(showPreview || readOnly) && (
              <div className="p-4 overflow-auto max-h-[80vh]">
                <ChordProPreviewErrorBoundary>
                  <div className="prose dark:prose-invert max-w-none">
                    {content ? (
                      renderPreview()
                    ) : (
                      <div className="text-center text-muted-foreground py-8">
                        <Music className="h-12 w-12 mx-auto mb-2" />
                        <p>No content to preview</p>
                      </div>
                    )}
                  </div>
                </ChordProPreviewErrorBoundary>
              </div>
            )}
          </div>
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