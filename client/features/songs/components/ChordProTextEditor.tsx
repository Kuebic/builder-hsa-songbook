/**
 * @fileoverview Enhanced ChordPro text editor with syntax highlighting and auto-completion
 * @module features/songs/components/ChordProTextEditor
 */

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChevronDown, X } from "lucide-react";
import { SyntaxHighlighter } from "./SyntaxHighlighter";

interface ChordProTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave?: () => void;
  readOnly?: boolean;
  fontSize?: number;
  className?: string;
  placeholder?: string;
}

interface AutoCompleteItem {
  type: "directive" | "chord" | "section";
  text: string;
  description: string;
  insertText: string;
}

// Common ChordPro directives and their descriptions
const CHORD_PRO_DIRECTIVES: AutoCompleteItem[] = [
  { type: "directive", text: "{title: }", description: "Song title", insertText: "{title: }" },
  { type: "directive", text: "{subtitle: }", description: "Artist or subtitle", insertText: "{subtitle: }" },
  { type: "directive", text: "{artist: }", description: "Artist name", insertText: "{artist: }" },
  { type: "directive", text: "{key: }", description: "Song key", insertText: "{key: }" },
  { type: "directive", text: "{tempo: }", description: "Song tempo", insertText: "{tempo: }" },
  { type: "directive", text: "{time: }", description: "Time signature", insertText: "{time: }" },
  { type: "directive", text: "{capo: }", description: "Capo position", insertText: "{capo: }" },
  { type: "directive", text: "{comment: }", description: "Comment text", insertText: "{comment: }" },
  { type: "directive", text: "{c: }", description: "Comment (short)", insertText: "{c: }" },
  { type: "section", text: "{start_of_chorus}", description: "Begin chorus section", insertText: "{start_of_chorus}\n\n{end_of_chorus}" },
  { type: "section", text: "{soc}", description: "Begin chorus (short)", insertText: "{soc}\n\n{eoc}" },
  { type: "section", text: "{start_of_verse}", description: "Begin verse section", insertText: "{start_of_verse}\n\n{end_of_verse}" },
  { type: "section", text: "{sov}", description: "Begin verse (short)", insertText: "{sov}\n\n{eov}" },
  { type: "section", text: "{start_of_bridge}", description: "Begin bridge section", insertText: "{start_of_bridge}\n\n{end_of_bridge}" },
  { type: "section", text: "{sob}", description: "Begin bridge (short)", insertText: "{sob}\n\n{eob}" },
  { type: "section", text: "{start_of_tab}", description: "Begin tab section", insertText: "{start_of_tab}\n\n{end_of_tab}" },
  { type: "section", text: "{sot}", description: "Begin tab (short)", insertText: "{sot}\n\n{eot}" },
];

// Common chords for auto-completion
const COMMON_CHORDS: AutoCompleteItem[] = [
  { type: "chord", text: "[C]", description: "C major", insertText: "[C]" },
  { type: "chord", text: "[G]", description: "G major", insertText: "[G]" },
  { type: "chord", text: "[Am]", description: "A minor", insertText: "[Am]" },
  { type: "chord", text: "[F]", description: "F major", insertText: "[F]" },
  { type: "chord", text: "[D]", description: "D major", insertText: "[D]" },
  { type: "chord", text: "[Em]", description: "E minor", insertText: "[Em]" },
  { type: "chord", text: "[Dm]", description: "D minor", insertText: "[Dm]" },
  { type: "chord", text: "[A]", description: "A major", insertText: "[A]" },
  { type: "chord", text: "[E]", description: "E major", insertText: "[E]" },
  { type: "chord", text: "[Bm]", description: "B minor", insertText: "[Bm]" },
];

/**
 * Enhanced ChordPro text editor with syntax highlighting and auto-completion
 */
export function ChordProTextEditor({
  value,
  onChange,
  onSave,
  readOnly = false,
  fontSize = 14,
  className,
  placeholder = "Enter ChordPro formatted lyrics here...",
}: ChordProTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showAutoComplete, setShowAutoComplete] = useState(false);
  const [autoCompleteItems, setAutoCompleteItems] = useState<AutoCompleteItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [triggerPosition, setTriggerPosition] = useState<{ start: number; end: number } | null>(null);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Handle auto-completion trigger
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    // Save to undo stack if this is a significant change
    if (Math.abs(newValue.length - value.length) > 1) {
      setUndoStack(prev => [...prev.slice(-19), value]); // Keep last 20 states
      setRedoStack([]);
    }
    
    onChange(newValue);

    // Check for auto-completion triggers
    const char = newValue[cursorPosition - 1];
    if (char === '{') {
      const items = CHORD_PRO_DIRECTIVES.filter(item => 
        item.text.toLowerCase().includes('')
      );
      setAutoCompleteItems(items);
      setShowAutoComplete(true);
      setSelectedIndex(0);
      setTriggerPosition({ start: cursorPosition - 1, end: cursorPosition });
    } else if (char === '[') {
      setAutoCompleteItems(COMMON_CHORDS);
      setShowAutoComplete(true);
      setSelectedIndex(0);
      setTriggerPosition({ start: cursorPosition - 1, end: cursorPosition });
    } else {
      setShowAutoComplete(false);
    }
  }, [value, onChange]);

  // Handle keyboard shortcuts and navigation
  // Handle scroll events for syntax highlighter synchronization
  const handleScroll = useCallback((e: React.UIEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    setScrollTop(target.scrollTop);
    setScrollLeft(target.scrollLeft);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Auto-completion navigation
    if (showAutoComplete) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % autoCompleteItems.length);
          return;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev === 0 ? autoCompleteItems.length - 1 : prev - 1);
          return;
        case 'Enter':
        case 'Tab':
          e.preventDefault();
          insertAutoComplete(autoCompleteItems[selectedIndex]);
          return;
        case 'Escape':
          e.preventDefault();
          setShowAutoComplete(false);
          return;
      }
    }

    // Editor shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 's':
          e.preventDefault();
          onSave?.();
          return;
        case 'z':
          if (e.shiftKey) {
            // Redo
            e.preventDefault();
            if (redoStack.length > 0) {
              const redoValue = redoStack[redoStack.length - 1];
              setUndoStack(prev => [...prev, value]);
              setRedoStack(prev => prev.slice(0, -1));
              onChange(redoValue);
            }
          } else {
            // Undo
            e.preventDefault();
            if (undoStack.length > 0) {
              const undoValue = undoStack[undoStack.length - 1];
              setRedoStack(prev => [...prev, value]);
              setUndoStack(prev => prev.slice(0, -1));
              onChange(undoValue);
            }
          }
          return;
      }
    }

    // Tab key handling
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = value.substring(0, start) + "    " + value.substring(end);
      onChange(newValue);
      
      // Set cursor position after the inserted spaces
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 4;
      }, 0);
    }

    // Auto-indent on Enter
    if (e.key === 'Enter') {
      const textarea = e.currentTarget;
      const lines = value.substring(0, textarea.selectionStart).split('\n');
      const currentLine = lines[lines.length - 1];
      const leadingSpaces = currentLine.match(/^(\s*)/)?.[1] || '';
      
      // Insert newline with same indentation
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = value.substring(0, start) + '\n' + leadingSpaces + value.substring(end);
      onChange(newValue);
      
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1 + leadingSpaces.length;
      }, 0);
      
      e.preventDefault();
    }
  }, [showAutoComplete, autoCompleteItems, selectedIndex, value, onChange, onSave, undoStack, redoStack]);

  // Insert auto-completion
  const insertAutoComplete = useCallback((item: AutoCompleteItem) => {
    if (!triggerPosition || !textareaRef.current) return;

    const textarea = textareaRef.current;
    const newValue = value.substring(0, triggerPosition.start) + 
                    item.insertText + 
                    value.substring(triggerPosition.end);
    
    onChange(newValue);
    setShowAutoComplete(false);
    
    // Position cursor appropriately
    setTimeout(() => {
      const cursorPos = triggerPosition.start + item.insertText.length;
      textarea.selectionStart = textarea.selectionEnd = cursorPos;
      textarea.focus();
    }, 0);
  }, [value, onChange, triggerPosition]);

  // Handle clicks outside auto-complete
  useEffect(() => {
    const handleClickOutside = () => {
      setShowAutoComplete(false);
    };
    
    if (showAutoComplete) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showAutoComplete]);

  const editorStyle = {
    fontSize: `${fontSize}px`,
    lineHeight: '1.5',
  };

  return (
    <div className={cn("relative w-full", className)}>
      {/* Syntax highlighting overlay */}
      <SyntaxHighlighter
        content={value}
        fontSize={fontSize}
        theme="light" // TODO: Use actual theme from props
        scrollTop={scrollTop}
        scrollLeft={scrollLeft}
      />

      {/* Main textarea with carefully tuned transparency */}
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onScroll={handleScroll}
        className={cn(
          "font-mono resize-none relative z-10",
          "min-h-[400px] w-full",
          "bg-transparent",
          "text-transparent caret-foreground",
          readOnly && "cursor-default"
        )}
        style={editorStyle}
        placeholder={placeholder}
        readOnly={readOnly}
        spellCheck={false}
      />

      {/* Auto-completion dropdown */}
      {showAutoComplete && autoCompleteItems.length > 0 && (
        <Card className="absolute z-20 mt-1 w-80 shadow-lg border">
          <CardContent className="p-0 max-h-60 overflow-y-auto">
            {autoCompleteItems.map((item, index) => (
              <div
                key={`${item.type}-${item.text}`}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 cursor-pointer border-b border-border last:border-b-0",
                  index === selectedIndex && "bg-accent"
                )}
                onClick={() => insertAutoComplete(item)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <Badge 
                  variant={item.type === 'directive' ? 'default' : item.type === 'chord' ? 'secondary' : 'outline'}
                  className="text-xs"
                >
                  {item.type}
                </Badge>
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-sm font-medium truncate">
                    {item.text}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {item.description}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
          <div className="px-3 py-2 bg-muted/50 border-t text-xs text-muted-foreground flex items-center gap-2">
            <span>↑↓ Navigate</span>
            <span>Tab/Enter Insert</span>
            <span>Esc Cancel</span>
          </div>
        </Card>
      )}

      {/* Status indicators */}
      {!readOnly && (
        <div className="absolute bottom-2 right-2 flex items-center gap-2 pointer-events-none">
          {undoStack.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {undoStack.length} changes
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

export default ChordProTextEditor;
