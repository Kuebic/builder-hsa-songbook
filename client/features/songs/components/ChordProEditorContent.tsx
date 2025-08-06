import { useRef, useCallback, useState } from "react";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, GripVertical } from "lucide-react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ChordDisplay } from "./ChordDisplay";
import { ChordProSyntaxHighlighter } from "./ChordProSyntaxHighlighter";
import { cn } from "@/lib/utils";

interface ChordProEditorContentProps {
  content: string;
  onChange: (content: string) => void;
  debouncedContent: string;
  readOnly: boolean;
  isMobile: boolean;
  undoStack: string[];
  redoStack: string[];
  transposition: any;
  onUndo: () => void;
  onRedo: () => void;
}

export function ChordProEditorContent({
  content,
  onChange,
  debouncedContent,
  readOnly,
  isMobile,
  undoStack, // eslint-disable-line @typescript-eslint/no-unused-vars
  redoStack, // eslint-disable-line @typescript-eslint/no-unused-vars
  transposition,
  onUndo, // eslint-disable-line @typescript-eslint/no-unused-vars
  onRedo, // eslint-disable-line @typescript-eslint/no-unused-vars
}: ChordProEditorContentProps) {
  const [showPreview, setShowPreview] = useState(true);
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleScroll = useCallback((e: React.UIEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    setScrollTop(target.scrollTop);
    setScrollLeft(target.scrollLeft);
  }, []);

  const EditorTextarea = () => (
    <div className="relative min-h-[400px] bg-background border rounded-md">
      <ChordProSyntaxHighlighter
        content={content}
        fontSize={14}
        theme="light"
        scrollTop={scrollTop}
        scrollLeft={scrollLeft}
      />
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        className={cn(
          "absolute inset-0 p-3 font-mono text-transparent bg-transparent",
          "caret-gray-900 selection:bg-blue-200/50",
          "resize-none outline-none",
          "text-sm leading-[1.5]",
        )}
        style={{ fontSize: "14px" }}
        placeholder={content ? "" : "Enter ChordPro formatted lyrics here..."}
        readOnly={readOnly}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
      />
    </div>
  );

  const QuickReference = () => (
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
  );

  return (
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

      {/* Mobile Layout */}
      {isMobile ? (
        <div className="h-full">
          {!readOnly && !showPreview && (
            <div className="h-full p-4 overflow-auto">
              <div className="space-y-4">
                <QuickReference />
                <EditorTextarea />
              </div>
            </div>
          )}

          {(showPreview || readOnly) && (
            <div className="h-full p-4 overflow-auto">
              <ChordDisplay
                content={debouncedContent}
                transpose={transposition.transpositionLevel}
                theme="light"
                showControls={true}
                className="max-w-none"
                onTranspose={transposition.transpose}
              />
            </div>
          )}
        </div>
      ) : (
        /* Desktop Layout */
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {!readOnly && (
            <>
              <ResizablePanel defaultSize={50} minSize={20} className="min-w-[300px]">
                <div className="h-full p-4 overflow-auto">
                  <div className="space-y-4">
                    <QuickReference />
                    <div className="relative min-h-[calc(100vh-20rem)] bg-background border rounded-md">
                      <ChordProSyntaxHighlighter
                        content={content}
                        fontSize={14}
                        theme="light"
                        scrollTop={scrollTop}
                        scrollLeft={scrollLeft}
                        className="min-h-[calc(100vh-20rem)]"
                      />
                      <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={(e) => onChange(e.target.value)}
                        onScroll={handleScroll}
                        className={cn(
                          "absolute inset-0 p-3 font-mono text-transparent bg-transparent",
                          "caret-gray-900 selection:bg-blue-200/50",
                          "resize-none outline-none",
                          "text-sm leading-[1.5] min-h-[calc(100vh-20rem)]",
                        )}
                        style={{ fontSize: "14px" }}
                        placeholder={content ? "" : "Enter ChordPro formatted lyrics here..."}
                        readOnly={readOnly}
                        spellCheck={false}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                      />
                    </div>
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

          <ResizablePanel
            defaultSize={readOnly ? 100 : 50}
            minSize={20}
            className="min-w-[300px]"
          >
            <div className="h-full p-4 overflow-auto">
              <ChordDisplay
                content={debouncedContent}
                transpose={transposition.transpositionLevel}
                theme="light"
                showControls={!readOnly}
                className="max-w-none"
                onTranspose={transposition.transpose}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </CardContent>
  );
}