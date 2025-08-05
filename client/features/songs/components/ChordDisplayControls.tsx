/**
 * @fileoverview Controls component for ChordDisplay with transposition and display options
 * @module features/songs/components/ChordDisplayControls
 */

import { memo, useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  Minus, 
  Plus, 
  RotateCcw, 
  Eye, 
  EyeOff, 
  Type,
  Keyboard,
} from "lucide-react";
import { 
  ChordDisplayControlsProps, 
  FontSize, 
  FONT_SIZE_CONFIG, 
} from "../types/chord.types";

/**
 * ChordDisplayControls component providing transposition and display controls
 * 
 * Offers comprehensive controls for chord display including transposition buttons,
 * key display, font size adjustment, and chord visibility toggle with keyboard shortcuts.
 * 
 * @component
 * @example
 * ```tsx
 * <ChordDisplayControls
 *   transpositionState={transposition}
 *   onTranspose={(semitones) => handleTranspose(semitones)}
 *   fontSize="base"
 *   onFontSizeChange={(size) => setFontSize(size)}
 *   chordsVisible={true}
 *   onChordsVisibilityChange={(visible) => setChordsVisible(visible)}
 * />
 * ```
 */
export const ChordDisplayControls = memo<ChordDisplayControlsProps>(({
  transpositionState,
  onTranspose,
  fontSize = "base",
  onFontSizeChange,
  showChordsToggle = false,
  chordsVisible = true,
  onChordsVisibilityChange,
  className,
}) => {
  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Only handle shortcuts when Ctrl/Cmd is pressed
    if (!(event.ctrlKey || event.metaKey)) {return;}

    switch (event.key) {
      case "ArrowUp":
        event.preventDefault();
        if (transpositionState.canTransposeUp) {
          onTranspose(1);
        }
        break;
      case "ArrowDown":
        event.preventDefault();
        if (transpositionState.canTransposeDown) {
          onTranspose(-1);
        }
        break;
      case "0":
        event.preventDefault();
        onTranspose(-transpositionState.transpositionLevel); // Reset to 0
        break;
    }
  }, [transpositionState, onTranspose]);

  // Register keyboard shortcuts
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  // Memoize font size options for performance
  const fontSizeOptions = useMemo(() => {
    return Object.entries(FONT_SIZE_CONFIG).map(([key, config]) => ({
      value: key as FontSize,
      label: config.label,
    }));
  }, []);

  // Format transposition display
  const transpositionDisplay = useMemo(() => {
    const level = transpositionState.transpositionLevel;
    if (level === 0) {return "0";}
    return level > 0 ? `+${level}` : `${level}`;
  }, [transpositionState.transpositionLevel]);

  // Determine current key display
  const currentKeyDisplay = useMemo(() => {
    return transpositionState.currentKey || "C";
  }, [transpositionState.currentKey]);

  return (
    <TooltipProvider>
      <div className={cn(
        "chord-display-controls",
        "flex flex-wrap items-center gap-3 p-3 bg-muted/50 rounded-lg border",
        className,
      )}>
        {/* Transposition Controls */}
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">Transpose:</Label>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onTranspose(-1)}
                disabled={!transpositionState.canTransposeDown}
                aria-label="Transpose down one semitone"
                className="h-8 w-8 p-0"
              >
                <Minus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-center">
                <p>Transpose Down</p>
                <p className="text-xs opacity-75">Ctrl + ↓</p>
              </div>
            </TooltipContent>
          </Tooltip>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="min-w-[3rem] justify-center">
              {currentKeyDisplay}
            </Badge>
            <Badge variant="outline" className="min-w-[2.5rem] justify-center text-xs">
              {transpositionDisplay}
            </Badge>
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onTranspose(1)}
                disabled={!transpositionState.canTransposeUp}
                aria-label="Transpose up one semitone"
                className="h-8 w-8 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-center">
                <p>Transpose Up</p>
                <p className="text-xs opacity-75">Ctrl + ↑</p>
              </div>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onTranspose(-transpositionState.transpositionLevel)}
                disabled={transpositionState.transpositionLevel === 0}
                aria-label="Reset transposition to original key"
                className="h-8 w-8 p-0"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-center">
                <p>Reset to Original Key</p>
                <p className="text-xs opacity-75">Ctrl + 0</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-border" />

        {/* Font Size Control */}
        {onFontSizeChange && (
          <>
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium flex items-center gap-1">
                <Type className="h-4 w-4" />
                Size:
              </Label>
              <Select value={fontSize} onValueChange={onFontSizeChange}>
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fontSizeOptions.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-border" />
          </>
        )}

        {/* Chord Visibility Toggle */}
        {showChordsToggle && onChordsVisibilityChange && (
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium flex items-center gap-1">
              {chordsVisible ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
              Chords:
            </Label>
            <Switch
              checked={chordsVisible}
              onCheckedChange={onChordsVisibilityChange}
              aria-label="Toggle chord visibility"
            />
          </div>
        )}

        {/* Keyboard Shortcuts Indicator */}
        <div className="ml-auto">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-60">
                <Keyboard className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              <div className="space-y-2">
                <p className="font-medium">Keyboard Shortcuts:</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between gap-4">
                    <span>Transpose Up:</span>
                    <code className="bg-background px-1 rounded">Ctrl + ↑</code>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Transpose Down:</span>
                    <code className="bg-background px-1 rounded">Ctrl + ↓</code>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Reset:</span>
                    <code className="bg-background px-1 rounded">Ctrl + 0</code>
                  </div>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
});

ChordDisplayControls.displayName = "ChordDisplayControls";

/**
 * Custom comparison function for React.memo optimization
 */
const arePropsEqual = (
  prevProps: ChordDisplayControlsProps, 
  nextProps: ChordDisplayControlsProps,
): boolean => {
  // Compare primitive props
  if (
    prevProps.fontSize !== nextProps.fontSize ||
    prevProps.showChordsToggle !== nextProps.showChordsToggle ||
    prevProps.chordsVisible !== nextProps.chordsVisible ||
    prevProps.className !== nextProps.className
  ) {
    return false;
  }

  // Compare callback functions by reference
  if (
    prevProps.onTranspose !== nextProps.onTranspose ||
    prevProps.onFontSizeChange !== nextProps.onFontSizeChange ||
    prevProps.onChordsVisibilityChange !== nextProps.onChordsVisibilityChange
  ) {
    return false;
  }

  // Compare transposition state object
  const prevState = prevProps.transpositionState;
  const nextState = nextProps.transpositionState;
  
  if (
    prevState.currentKey !== nextState.currentKey ||
    prevState.transpositionLevel !== nextState.transpositionLevel ||
    prevState.canTransposeUp !== nextState.canTransposeUp ||
    prevState.canTransposeDown !== nextState.canTransposeDown
  ) {
    return false;
  }

  // Compare availableKeys array (shallow comparison)
  if (prevState.availableKeys.length !== nextState.availableKeys.length) {
    return false;
  }
  for (let i = 0; i < prevState.availableKeys.length; i++) {
    if (prevState.availableKeys[i] !== nextState.availableKeys[i]) {
      return false;
    }
  }

  return true;
};

// Export memoized component with custom comparison
export default memo(ChordDisplayControls, arePropsEqual);