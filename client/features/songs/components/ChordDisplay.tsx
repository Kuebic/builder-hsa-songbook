/**
 * @fileoverview Main ChordDisplay component with ChordSheetJS integration
 * @module features/songs/components/ChordDisplay
 */

import { memo, useMemo, useCallback } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LoadingSpinner } from "@/shared/components/LoadingSpinner";
import { cn } from "@/lib/utils";
import { AlertTriangle, Music, RefreshCw } from "lucide-react";
import { ChordProPreviewErrorBoundary } from "./ChordProPreviewErrorBoundary";
import { ChordDisplayControls } from "./ChordDisplayControls";
import { 
  ChordDisplayProps, 
  FONT_SIZE_CONFIG, 
  THEME_CONFIG,
  ChordDisplayPropsSchema, 
} from "../types/chord.types";
import { useChordSheetParser } from "../hooks/useChordSheetParser";
import { useChordTransposition } from "../hooks/useChordTransposition";
import { formatSongToHtml, transposeSong } from "../utils/chordSheetHelpers";

/**
 * ChordDisplay component with professional ChordSheetJS integration
 * 
 * Renders ChordPro format content using ChordSheetJS with support for transposition,
 * multiple themes, responsive design, and comprehensive error handling.
 * 
 * @component
 * @example
 * ```tsx
 * <ChordDisplay
 *   content="{title: Amazing Grace}\n{key: G}\n[G]Amazing [C]grace"
 *   transpose={2}
 *   theme="stage"
 *   showControls={true}
 *   onTranspose={(semitones) => console.log('Transposed:', semitones)}
 * />
 * ```
 */
export const ChordDisplay = memo<ChordDisplayProps>(({
  content,
  transpose = 0,
  fontSize = "base",
  theme = "light",
  showChords = true,
  showControls = false,
  className,
  onTranspose,
  onError,
}) => {
  // Validate props using Zod schema
  const validationResult = useMemo(() => {
    return ChordDisplayPropsSchema.safeParse({
      content,
      transpose,
      fontSize,
      theme,
      showChords,
      showControls,
      className,
    });
  }, [content, transpose, fontSize, theme, showChords, showControls, className]);

  // Parse ChordPro content
  const { parsedSong, error: parseError, metadata, isValid, isLoading } = useChordSheetParser(content, {
    enablePerformanceMeasurement: process.env.NODE_ENV === "development",
    enableValidation: true,
  });

  // Set up transposition with detected key
  const transposition = useChordTransposition({
    initialTranspose: transpose,
    metadata: metadata || undefined,
    content,
    onTranspositionChange: useCallback((level: number) => {
      onTranspose?.(level);
    }, [onTranspose]),
    enableKeyDetection: true,
  });

  // Create transposed song when needed
  const displaySong = useMemo(() => {
    if (!parsedSong) {return null;}
    if (transposition.transpositionLevel === 0) {return parsedSong;}
    
    const { transposedSong, error } = transposeSong(parsedSong, transposition.transpositionLevel);
    if (error) {
      onError?.(error);
      return parsedSong; // Fall back to original song
    }
    return transposedSong;
  }, [parsedSong, transposition.transpositionLevel, onError]);

  // Format song to HTML
  const formattedHtml = useMemo(() => {
    if (!displaySong) {return "";}
    return formatSongToHtml(displaySong);
  }, [displaySong]);

  // Handle prop validation errors
  const propValidationError = useMemo(() => {
    if (!validationResult.success) {
      const error = {
        type: "format_error" as const,
        message: `Invalid props: ${validationResult.error.issues.map(i => i.message).join(", ")}`,
        originalContent: content,
      };
      onError?.(error);
      return error;
    }
    return null;
  }, [validationResult, content, onError]);

  // Combine all CSS classes with theme-aware styling
  const containerClasses = cn(
    // Base chord display classes
    "chord-display prose dark:prose-invert max-w-none",
    // Font size classes
    FONT_SIZE_CONFIG[fontSize].classes,
    // Theme classes
    THEME_CONFIG[theme].classes,
    // Conditional classes
    {
      "chord-display--no-chords": !showChords,
      "chord-display--loading": isLoading,
    },
    // Custom className
    className,
  );

  // Handle transposition controls
  const handleTranspose = useCallback((semitones: number) => {
    transposition.transpose(semitones);
  }, [transposition]);

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("chord-display-loading", containerClasses)}>
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner message="Parsing chord sheet..." />
        </div>
      </div>
    );
  }

  // Prop validation error
  if (propValidationError) {
    return (
      <div className={containerClasses}>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Configuration Error</AlertTitle>
          <AlertDescription>{propValidationError.message}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Parsing error
  if (parseError || !isValid || !displaySong) {
    return (
      <div className={containerClasses}>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Chord Parsing Error</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>{parseError?.message || "Unable to parse chord content"}</p>
            {parseError?.line && (
              <p className="text-sm text-muted-foreground">
                Error on line {parseError.line}
              </p>
            )}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="h-3 w-3" />
                Try again
              </button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Empty content
  if (!content || content.trim() === "") {
    return (
      <div className={containerClasses}>
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Music className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg font-medium">No chord content</p>
          <p className="text-sm">Add ChordPro formatted lyrics and chords to see them here</p>
        </div>
      </div>
    );
  }

  return (
    <ChordProPreviewErrorBoundary>
      <div className={containerClasses}>
        {/* Controls */}
        {showControls && (
          <div className="chord-display-controls mb-4 border-b pb-4">
            <ChordDisplayControls
              transpositionState={transposition}
              onTranspose={handleTranspose}
              fontSize={fontSize}
              showChordsToggle={true}
              chordsVisible={showChords}
              onChordsVisibilityChange={() => {
                // This would need to be handled by parent component
                // since showChords is a prop, not internal state
              }}
            />
          </div>
        )}

        {/* Main content */}
        <div 
          className="chord-display-content"
          role="region"
          aria-label="Chord Chart"
          aria-describedby="chord-display-instructions"
          tabIndex={0}
        >
          {/* Metadata display */}
          {metadata && (metadata.title || metadata.artist) && (
            <div className="chord-display-metadata mb-6 text-center">
              {metadata.title && (
                <h2 className="text-2xl font-bold mb-1">{metadata.title}</h2>
              )}
              {metadata.artist && (
                <p className="text-lg text-muted-foreground mb-2">{metadata.artist}</p>
              )}
              {(metadata.key || transposition.currentKey) && (
                <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                  <span>Key: {transposition.currentKey || metadata.key}</span>
                  {metadata.tempo && <span>Tempo: {metadata.tempo}</span>}
                  {metadata.time && <span>Time: {metadata.time}</span>}
                  {metadata.capo && <span>Capo: {metadata.capo}</span>}
                </div>
              )}
            </div>
          )}

          {/* Chord content */}
          <div 
            className="chord-display-formatted"
            dangerouslySetInnerHTML={{ __html: formattedHtml }}
          />

          {/* Hidden instructions for screen readers */}
          <div id="chord-display-instructions" className="sr-only">
            Chord chart with lyrics and chord symbols. 
            {showControls && "Use the controls above to transpose or adjust display options."}
            {transposition.currentKey && ` Currently in the key of ${transposition.currentKey}.`}
            {transposition.transpositionLevel !== 0 && 
              ` Transposed ${transposition.transpositionLevel > 0 ? "up" : "down"} by ${Math.abs(transposition.transpositionLevel)} semitone${Math.abs(transposition.transpositionLevel) !== 1 ? "s" : ""}.`
            }
          </div>
        </div>
      </div>
    </ChordProPreviewErrorBoundary>
  );
});

ChordDisplay.displayName = "ChordDisplay";

/**
 * Custom comparison function for React.memo optimization
 * Prevents unnecessary re-renders when props haven't meaningfully changed
 */
const arePropsEqual = (prevProps: ChordDisplayProps, nextProps: ChordDisplayProps): boolean => {
  // Compare primitive props
  if (
    prevProps.content !== nextProps.content ||
    prevProps.transpose !== nextProps.transpose ||
    prevProps.fontSize !== nextProps.fontSize ||
    prevProps.theme !== nextProps.theme ||
    prevProps.showChords !== nextProps.showChords ||
    prevProps.showControls !== nextProps.showControls ||
    prevProps.className !== nextProps.className
  ) {
    return false;
  }

  // Compare callback functions by reference (parent should use useCallback)
  if (
    prevProps.onTranspose !== nextProps.onTranspose ||
    prevProps.onError !== nextProps.onError
  ) {
    return false;
  }

  return true;
};

// Export the memoized component with custom comparison
export default memo(ChordDisplay, arePropsEqual);