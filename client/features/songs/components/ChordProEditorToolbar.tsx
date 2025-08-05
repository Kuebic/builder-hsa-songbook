/**
 * @fileoverview Enhanced toolbar for ChordPro editor with comprehensive tools
 * @module features/songs/components/ChordProEditorToolbar
 */

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  FileText,
  FolderOpen,
  Save,
  Undo,
  Redo,
  Plus,
  Minus,
  RotateCcw,
  Type,
  Eye,
  EyeOff,
  HelpCircle,
  Download,
  Upload,
  Music,
  Keyboard,
  Settings,
  ChevronDown,
} from "lucide-react";

export interface ChordProEditorToolbarProps {
  // File operations
  onNew?: () => void;
  onOpen?: () => void;
  onSave?: () => void;
  onSaveAs?: () => void;
  onExport?: (format: 'pdf' | 'html' | 'txt') => void;
  
  // Edit operations
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  
  // Insert operations
  onInsertChord?: (chord: string) => void;
  onInsertDirective?: (directive: string) => void;
  onInsertSection?: (section: string) => void;
  
  // Transposition
  currentKey?: string;
  transpositionLevel?: number;
  canTransposeUp?: boolean;
  canTransposeDown?: boolean;
  onTranspose?: (semitones: number) => void;
  onTransposeReset?: () => void;
  
  // View options
  fontSize?: number;
  onFontSizeChange?: (size: number) => void;
  theme?: 'light' | 'dark' | 'stage';
  onThemeChange?: (theme: 'light' | 'dark' | 'stage') => void;
  showChords?: boolean;
  onShowChordsChange?: (show: boolean) => void;
  
  // State indicators
  hasUnsavedChanges?: boolean;
  isLoading?: boolean;
  readOnly?: boolean;
  
  // Help
  onShowHelp?: () => void;
  
  className?: string;
}

// Common insert options
const COMMON_CHORDS = ['C', 'G', 'Am', 'F', 'D', 'Em', 'Dm', 'A', 'E', 'Bm'];
const COMMON_DIRECTIVES = [
  { value: '{title: }', label: 'Title' },
  { value: '{subtitle: }', label: 'Subtitle/Artist' },
  { value: '{key: }', label: 'Key' },
  { value: '{tempo: }', label: 'Tempo' },
  { value: '{comment: }', label: 'Comment' },
  { value: '{capo: }', label: 'Capo' },
];
const COMMON_SECTIONS = [
  { value: '{start_of_chorus}\n\n{end_of_chorus}', label: 'Chorus' },
  { value: '{start_of_verse}\n\n{end_of_verse}', label: 'Verse' },
  { value: '{start_of_bridge}\n\n{end_of_bridge}', label: 'Bridge' },
  { value: '{start_of_tab}\n\n{end_of_tab}', label: 'Tab' },
];

/**
 * Enhanced toolbar for ChordPro editor with comprehensive functionality
 */
export function ChordProEditorToolbar({
  // File operations
  onNew,
  onOpen,
  onSave,
  onSaveAs,
  onExport,
  
  // Edit operations
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  
  // Insert operations
  onInsertChord,
  onInsertDirective,
  onInsertSection,
  
  // Transposition
  currentKey = 'C',
  transpositionLevel = 0,
  canTransposeUp = true,
  canTransposeDown = true,
  onTranspose,
  onTransposeReset,
  
  // View options
  fontSize = 14,
  onFontSizeChange,
  theme = 'light',
  onThemeChange,
  showChords = true,
  onShowChordsChange,
  
  // State
  hasUnsavedChanges = false,
  isLoading = false,
  readOnly = false,
  
  // Help
  onShowHelp,
  
  className,
}: ChordProEditorToolbarProps) {
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);

  const transpositionDisplay = transpositionLevel === 0 ? '0' : 
    transpositionLevel > 0 ? `+${transpositionLevel}` : `${transpositionLevel}`;

  const fontSizeOptions = [
    { value: 12, label: 'XS' },
    { value: 14, label: 'S' },
    { value: 16, label: 'M' },
    { value: 18, label: 'L' },
    { value: 20, label: 'XL' },
    { value: 24, label: 'XXL' },
  ];

  return (
    <TooltipProvider>
      <div className={cn(
        "flex items-center gap-1 p-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "overflow-x-auto scrollbar-thin",
        className
      )}>
        {/* File Operations */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onNew}
                disabled={readOnly}
                className="h-8 px-2"
              >
                <FileText className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-center">
                <p>New</p>
                <p className="text-xs opacity-75">Ctrl+N</p>
              </div>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpen}
                disabled={readOnly}
                className="h-8 px-2"
              >
                <FolderOpen className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-center">
                <p>Open</p>
                <p className="text-xs opacity-75">Ctrl+O</p>
              </div>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onSave}
                disabled={readOnly || isLoading || !hasUnsavedChanges}
                className="h-8 px-2"
              >
                <Save className="h-4 w-4" />
                {hasUnsavedChanges && (
                  <span className="ml-1 h-1.5 w-1.5 bg-orange-500 rounded-full" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-center">
                <p>Save</p>
                <p className="text-xs opacity-75">Ctrl+S</p>
              </div>
            </TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2">
                <Download className="h-4 w-4" />
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Export As</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onExport?.('pdf')}>
                <Download className="h-4 w-4 mr-2" />
                PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport?.('html')}>
                <Download className="h-4 w-4 mr-2" />
                HTML
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport?.('txt')}>
                <Download className="h-4 w-4 mr-2" />
                Plain Text
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Edit Operations */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onUndo}
                disabled={!canUndo || readOnly}
                className="h-8 px-2"
              >
                <Undo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-center">
                <p>Undo</p>
                <p className="text-xs opacity-75">Ctrl+Z</p>
              </div>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onRedo}
                disabled={!canRedo || readOnly}
                className="h-8 px-2"
              >
                <Redo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-center">
                <p>Redo</p>
                <p className="text-xs opacity-75">Ctrl+Shift+Z</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Insert Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" disabled={readOnly} className="h-8 px-2">
              <Plus className="h-4 w-4" />
              <span className="ml-1 hidden sm:inline">Insert</span>
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48">
            <DropdownMenuLabel>Chords</DropdownMenuLabel>
            <div className="grid grid-cols-5 gap-1 p-2">
              {COMMON_CHORDS.map(chord => (
                <Button
                  key={chord}
                  variant="outline"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => onInsertChord?.(`[${chord}]`)}
                >
                  {chord}
                </Button>
              ))}
            </div>
            
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Directives</DropdownMenuLabel>
            {COMMON_DIRECTIVES.map(directive => (
              <DropdownMenuItem
                key={directive.value}
                onClick={() => onInsertDirective?.(directive.value)}
              >
                <Music className="h-4 w-4 mr-2" />
                {directive.label}
              </DropdownMenuItem>
            ))}
            
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Sections</DropdownMenuLabel>
            {COMMON_SECTIONS.map(section => (
              <DropdownMenuItem
                key={section.value}
                onClick={() => onInsertSection?.(section.value)}
              >
                <Music className="h-4 w-4 mr-2" />
                {section.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="h-6" />

        {/* Transpose Controls */}
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium hidden sm:inline">Transpose:</span>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onTranspose?.(-1)}
                disabled={!canTransposeDown}
                className="h-8 w-8 p-0"
              >
                <Minus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Transpose Down (Ctrl+↓)</TooltipContent>
          </Tooltip>

          <div className="flex items-center gap-1">
            <Badge variant="secondary" className="min-w-[2rem] justify-center">
              {currentKey}
            </Badge>
            <Badge variant="outline" className="min-w-[2rem] justify-center text-xs">
              {transpositionDisplay}
            </Badge>
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onTranspose?.(1)}
                disabled={!canTransposeUp}
                className="h-8 w-8 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Transpose Up (Ctrl+↑)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onTransposeReset}
                disabled={transpositionLevel === 0}
                className="h-8 w-8 p-0"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reset to Original Key (Ctrl+0)</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* View Options */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1">
                <Type className="h-4 w-4" />
                <Select value={fontSize.toString()} onValueChange={(value) => onFontSizeChange?.(parseInt(value))}>
                  <SelectTrigger className="w-16 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontSizeOptions.map(option => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TooltipTrigger>
            <TooltipContent>Font Size</TooltipContent>
          </Tooltip>

          <Select value={theme} onValueChange={onThemeChange}>
            <SelectTrigger className="w-20 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="stage">Stage</SelectItem>
            </SelectContent>
          </Select>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onShowChordsChange?.(!showChords)}
                className="h-8 px-2"
              >
                {showChords ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {showChords ? 'Hide Chords' : 'Show Chords'}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Right-aligned items */}
        <div className="ml-auto flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowKeyboardShortcuts(!showKeyboardShortcuts)}
                className="h-8 px-2"
              >
                <Keyboard className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Keyboard Shortcuts</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onShowHelp}
                className="h-8 px-2"
              >
                <HelpCircle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">ChordPro Help</TooltipContent>
          </Tooltip>
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <Badge variant="secondary" className="ml-2">
            Saving...
          </Badge>
        )}
      </div>

      {/* Keyboard Shortcuts Panel */}
      {showKeyboardShortcuts && (
        <div className="border-b bg-muted/50 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">File Operations</h4>
              <div className="space-y-1 text-muted-foreground">
                <div className="flex justify-between">
                  <span>New</span>
                  <code className="bg-background px-1 rounded">Ctrl+N</code>
                </div>
                <div className="flex justify-between">
                  <span>Save</span>
                  <code className="bg-background px-1 rounded">Ctrl+S</code>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Edit Operations</h4>
              <div className="space-y-1 text-muted-foreground">
                <div className="flex justify-between">
                  <span>Undo</span>
                  <code className="bg-background px-1 rounded">Ctrl+Z</code>
                </div>
                <div className="flex justify-between">
                  <span>Redo</span>
                  <code className="bg-background px-1 rounded">Ctrl+Shift+Z</code>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Transposition</h4>
              <div className="space-y-1 text-muted-foreground">
                <div className="flex justify-between">
                  <span>Transpose Up</span>
                  <code className="bg-background px-1 rounded">Ctrl+↑</code>
                </div>
                <div className="flex justify-between">
                  <span>Transpose Down</span>
                  <code className="bg-background px-1 rounded">Ctrl+↓</code>
                </div>
                <div className="flex justify-between">
                  <span>Reset</span>
                  <code className="bg-background px-1 rounded">Ctrl+0</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </TooltipProvider>
  );
}

export default ChordProEditorToolbar;
