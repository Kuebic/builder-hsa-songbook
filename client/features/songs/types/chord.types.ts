import { z } from "zod";

/**
 * @fileoverview Type definitions for ChordDisplay components and ChordSheetJS integration
 * @module features/songs/types/chord.types
 */

// ==================== Core ChordDisplay Types ====================

/**
 * Props interface for the main ChordDisplay component
 */
export interface ChordDisplayProps {
  /** ChordPro format content to display */
  content: string;
  /** Transposition in semitones (-11 to +11) */
  transpose?: number;
  /** Font size variant for responsive design */
  fontSize?: "sm" | "base" | "lg" | "xl";
  /** Theme mode for optimal viewing */
  theme?: "light" | "dark" | "stage";
  /** Whether to show chord symbols above lyrics */
  showChords?: boolean;
  /** Whether to show transposition controls */
  showControls?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Callback when transposition changes */
  onTranspose?: (semitones: number) => void;
  /** Callback when parsing errors occur */
  onError?: (error: ChordParsingError) => void;
}

/**
 * Standardized error interface for chord parsing failures
 */
export interface ChordParsingError {
  /** Type of parsing error */
  type: "parse_error" | "format_error" | "transpose_error";
  /** Human-readable error message */
  message: string;
  /** Original content that caused the error */
  originalContent: string;
  /** Line number where error occurred (if applicable) */
  line?: number;
  /** Column number where error occurred (if applicable) */
  column?: number;
}

/**
 * State interface for transposition functionality
 */
export interface TranspositionState {
  /** Currently detected or set key */
  currentKey: string | null;
  /** Current transposition level in semitones */
  transpositionLevel: number;
  /** Array of available keys for selection */
  availableKeys: string[];
  /** Whether can transpose up (within bounds) */
  canTransposeUp: boolean;
  /** Whether can transpose down (within bounds) */
  canTransposeDown: boolean;
}

/**
 * Metadata extracted from ChordPro content
 */
export interface ChordSheetMeta {
  /** Song title from {title:} directive */
  title?: string;
  /** Artist name from {subtitle:} or {artist:} directive */
  artist?: string;
  /** Original key from {key:} directive */
  key?: string;
  /** Tempo from {tempo:} directive */
  tempo?: string;
  /** Time signature from {time:} directive */
  time?: string;
  /** Capo position from {capo:} directive */
  capo?: string;
  /** Additional custom metadata */
  [key: string]: string | undefined;
}

// ==================== Control Component Types ====================

/**
 * Props for ChordDisplayControls component
 */
export interface ChordDisplayControlsProps {
  /** Current transposition state */
  transpositionState: TranspositionState;
  /** Callback for transposition changes */
  onTranspose: (semitones: number) => void;
  /** Current display font size */
  fontSize?: "sm" | "base" | "lg" | "xl";
  /** Callback for font size changes */
  onFontSizeChange?: (size: "sm" | "base" | "lg" | "xl") => void;
  /** Whether chord visibility toggle is shown */
  showChordsToggle?: boolean;
  /** Current chord visibility state */
  chordsVisible?: boolean;
  /** Callback for chord visibility changes */
  onChordsVisibilityChange?: (visible: boolean) => void;
  /** Additional CSS classes */
  className?: string;
}

// ==================== Hook Return Types ====================

/**
 * Return type for useChordSheetParser hook
 */
export interface ChordSheetParserResult {
  /** Parsed ChordSheetJS Song object */
  parsedSong: any | null; // ChordSheetJS Song type
  /** Parsing error if occurred */
  error: ChordParsingError | null;
  /** Extracted metadata from the song */
  metadata: ChordSheetMeta | null;
  /** Whether parsing was successful */
  isValid: boolean;
  /** Whether parsing is in progress */
  isLoading: boolean;
}

/**
 * Return type for useChordTransposition hook
 */
export interface ChordTranspositionResult extends TranspositionState {
  /** Function to transpose by relative semitones */
  transpose: (semitones: number) => void;
  /** Function to transpose up by one semitone */
  transposeUp: () => void;
  /** Function to transpose down by one semitone */
  transposeDown: () => void;
  /** Function to reset transposition to 0 */
  reset: () => void;
  /** Function to set absolute transposition level */
  setTransposition: (level: number) => void;
}

// ==================== Utility Types ====================

/**
 * Valid musical keys for transposition
 */
export type MusicalKey =
  | "C"
  | "C#"
  | "Db"
  | "D"
  | "D#"
  | "Eb"
  | "E"
  | "F"
  | "F#"
  | "Gb"
  | "G"
  | "G#"
  | "Ab"
  | "A"
  | "A#"
  | "Bb"
  | "B";

/**
 * Font size variants for responsive chord display
 */
export type FontSize = "sm" | "base" | "lg" | "xl";

/**
 * Theme variants for optimal viewing in different contexts
 */
export type DisplayTheme = "light" | "dark" | "stage";

/**
 * ChordSheetJS formatter output options
 */
export interface FormatterOptions {
  /** Whether to include chord diagrams */
  chordDiagrams?: boolean;
  /** Custom chord style classes */
  chordStyle?: string;
  /** Custom lyric style classes */
  lyricStyle?: string;
  /** Whether to transpose chord names in output */
  transposeChordNames?: boolean;
}

// ==================== Zod Validation Schemas ====================

/**
 * Zod schema for ChordDisplayProps validation
 */
export const ChordDisplayPropsSchema = z.object({
  content: z.string(), // Allow empty content - component handles it gracefully
  transpose: z.number().int().min(-11).max(11).optional(),
  fontSize: z.enum(["sm", "base", "lg", "xl"]).optional(),
  theme: z.enum(["light", "dark", "stage"]).optional(),
  showChords: z.boolean().optional(),
  showControls: z.boolean().optional(),
  className: z.string().optional(),
});

/**
 * Zod schema for transposition level validation
 */
export const TranspositionLevelSchema = z.number().int().min(-11).max(11);

/**
 * Zod schema for musical key validation
 */
export const MusicalKeySchema = z.enum([
  "C",
  "C#",
  "Db",
  "D",
  "D#",
  "Eb",
  "E",
  "F",
  "F#",
  "Gb",
  "G",
  "G#",
  "Ab",
  "A",
  "A#",
  "Bb",
  "B",
]);

/**
 * Zod schema for font size validation
 */
export const FontSizeSchema = z.enum(["sm", "base", "lg", "xl"]);

/**
 * Zod schema for theme validation
 */
export const DisplayThemeSchema = z.enum(["light", "dark", "stage"]);

// ==================== Constants ====================

/**
 * Array of all valid musical keys in chromatic order
 */
export const MUSICAL_KEYS: MusicalKey[] = [
  "C",
  "C#",
  "Db",
  "D",
  "D#",
  "Eb",
  "E",
  "F",
  "F#",
  "Gb",
  "G",
  "G#",
  "Ab",
  "A",
  "A#",
  "Bb",
  "B",
];

/**
 * Font size configuration with Tailwind CSS classes
 */
export const FONT_SIZE_CONFIG: Record<
  FontSize,
  { label: string; classes: string }
> = {
  sm: { label: "Small", classes: "chord-size-sm" },
  base: { label: "Medium", classes: "chord-size-base" },
  lg: { label: "Large", classes: "chord-size-lg" },
  xl: { label: "Extra Large", classes: "chord-size-xl" },
} as const;

/**
 * Theme configuration with CSS classes
 */
export const THEME_CONFIG: Record<
  DisplayTheme,
  { label: string; classes: string }
> = {
  light: { label: "Light", classes: "chord-display--light" },
  dark: { label: "Dark", classes: "chord-display--dark" },
  stage: { label: "Stage", classes: "chord-display--stage" },
} as const;

/**
 * Transposition bounds for safety
 */
export const TRANSPOSITION_BOUNDS = {
  MIN: -11,
  MAX: 11,
} as const;

// ==================== Type Guards ====================

/**
 * Type guard to check if a value is a valid musical key
 */
export function isMusicalKey(value: string): value is MusicalKey {
  return MUSICAL_KEYS.includes(value as MusicalKey);
}

/**
 * Type guard to check if a value is a valid font size
 */
export function isFontSize(value: string): value is FontSize {
  return ["sm", "base", "lg", "xl"].includes(value);
}

/**
 * Type guard to check if a value is a valid theme
 */
export function isDisplayTheme(value: string): value is DisplayTheme {
  return ["light", "dark", "stage"].includes(value);
}

/**
 * Type guard to check if an error is a ChordParsingError
 */
export function isChordParsingError(error: any): error is ChordParsingError {
  return (
    typeof error === "object" &&
    error !== null &&
    typeof error.type === "string" &&
    typeof error.message === "string" &&
    typeof error.originalContent === "string"
  );
}
