/**
 * @fileoverview Utility functions for ChordSheetJS integration and chord processing
 * @module features/songs/utils/chordSheetHelpers
 */

import { ChordProParser, HtmlDivFormatter, Song } from "chordsheetjs";
import { ChordParsingError, ChordSheetMeta, MusicalKey, MUSICAL_KEYS, TRANSPOSITION_BOUNDS } from "../types/chord.types";

// ==================== Parser Instances ====================

/**
 * Singleton ChordProParser instance for performance optimization
 * Reusing parser instances prevents unnecessary object creation
 */
let chordProParserInstance: ChordProParser | null = null;

/**
 * Get or create the singleton ChordProParser instance
 */
export function getChordProParser(): ChordProParser {
  if (!chordProParserInstance) {
    chordProParserInstance = new ChordProParser();
  }
  return chordProParserInstance;
}

/**
 * Singleton HtmlDivFormatter instance for performance optimization
 */
let htmlDivFormatterInstance: HtmlDivFormatter | null = null;

/**
 * Get or create the singleton HtmlDivFormatter instance
 */
export function getHtmlDivFormatter(): HtmlDivFormatter {
  if (!htmlDivFormatterInstance) {
    htmlDivFormatterInstance = new HtmlDivFormatter();
  }
  return htmlDivFormatterInstance;
}

// ==================== Core ChordSheetJS Functions ====================

/**
 * Parse ChordPro content using ChordSheetJS with comprehensive error handling
 * @param content - Raw ChordPro format content
 * @returns Parsed Song object or null if parsing fails
 */
export function parseChordProContent(content: string): { song: Song | null; error: ChordParsingError | null } {
  if (!content || content.trim() === "") {
    return {
      song: null,
      error: {
        type: "parse_error",
        message: "Content cannot be empty",
        originalContent: content,
      },
    };
  }

  try {
    const parser = getChordProParser();
    const song = parser.parse(content);
    return { song, error: null };
  } catch (error) {
    const chordError: ChordParsingError = {
      type: "parse_error",
      message: error instanceof Error ? error.message : "Unknown parsing error",
      originalContent: content,
    };

    // Try to extract line/column information if available
    if (error instanceof Error && error.message.includes("line")) {
      const lineMatch = error.message.match(/line (\d+)/);
      if (lineMatch) {
        chordError.line = parseInt(lineMatch[1], 10);
      }
    }

    return { song: null, error: chordError };
  }
}

/**
 * Format a ChordSheetJS Song object to HTML with sanitization
 * @param song - ChordSheetJS Song object
 * @returns Formatted and sanitized HTML string
 */
export function formatSongToHtml(song: Song): string {
  try {
    const formatter = getHtmlDivFormatter();
    const htmlOutput = formatter.format(song);
    return sanitizeHtmlOutput(htmlOutput);
  } catch (error) {
    console.error("[ChordSheetHelpers] Format error:", error);
    return '<div class="chord-error">Error formatting chord sheet</div>';
  }
}

/**
 * Transpose a song and return the result with error handling
 * @param song - Original ChordSheetJS Song object
 * @param semitones - Number of semitones to transpose (-11 to +11)
 * @returns Transposed song or original song if transposition fails
 */
export function transposeSong(
  song: Song,
  semitones: number,
): { transposedSong: Song; error: ChordParsingError | null } {
  // Validate transposition bounds
  if (semitones < TRANSPOSITION_BOUNDS.MIN || semitones > TRANSPOSITION_BOUNDS.MAX) {
    return {
      transposedSong: song,
      error: {
        type: "transpose_error",
        message: `Transposition must be between ${TRANSPOSITION_BOUNDS.MIN} and ${TRANSPOSITION_BOUNDS.MAX} semitones`,
        originalContent: "",
      },
    };
  }

  // No transposition needed
  if (semitones === 0) {
    return { transposedSong: song, error: null };
  }

  try {
    const transposedSong = song.transpose(semitones);
    return { transposedSong, error: null };
  } catch (error) {
    return {
      transposedSong: song,
      error: {
        type: "transpose_error",
        message: error instanceof Error ? error.message : "Transposition failed",
        originalContent: "",
      },
    };
  }
}

// ==================== HTML Sanitization ====================

/**
 * Sanitize ChordSheetJS HTML output for safe rendering
 * This is a basic sanitization - in production, consider using DOMPurify
 * @param htmlOutput - Raw HTML output from ChordSheetJS formatter
 * @returns Sanitized HTML string
 */
export function sanitizeHtmlOutput(htmlOutput: string): string {
  // Basic XSS prevention - remove script tags and event handlers
  return htmlOutput
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/on\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/vbscript:/gi, "")
    .replace(/data:/gi, "");
}

// ==================== Metadata Extraction ====================

/**
 * Extract metadata from a ChordSheetJS Song object
 * @param song - ChordSheetJS Song object
 * @returns Metadata object with title, artist, key, etc.
 */
export function extractSongMetadata(song: Song): ChordSheetMeta {
  const metadata: ChordSheetMeta = {};

  try {
    // Extract standard ChordPro directives
    if (song.title) {metadata.title = Array.isArray(song.title) ? song.title[0] : song.title;}
    if (song.subtitle) {metadata.artist = Array.isArray(song.subtitle) ? song.subtitle[0] : song.subtitle;}
    if (song.artist) {metadata.artist = Array.isArray(song.artist) ? song.artist[0] : song.artist;}
    if (song.key) {metadata.key = Array.isArray(song.key) ? song.key[0] : song.key;}
    if (song.tempo) {metadata.tempo = (Array.isArray(song.tempo) ? song.tempo[0] : song.tempo).toString();}
    if (song.time) {metadata.time = Array.isArray(song.time) ? song.time[0] : song.time;}
    if (song.capo) {metadata.capo = (Array.isArray(song.capo) ? song.capo[0] : song.capo).toString();}

    // Extract any additional custom metadata
    const customKeys = ["composer", "lyricist", "copyright", "album", "year"];
    for (const key of customKeys) {
      const value = (song as any)[key];
      if (value) {
        metadata[key] = value.toString();
      }
    }
  } catch (error) {
    console.warn("[ChordSheetHelpers] Metadata extraction warning:", error);
  }

  return metadata;
}

// ==================== Key Detection and Transposition ====================

/**
 * Detect the musical key from ChordPro content or metadata
 * @param content - ChordPro content string
 * @param metadata - Optional metadata object
 * @returns Detected key or null if not found
 */
export function detectMusicalKey(content: string, metadata?: ChordSheetMeta): MusicalKey | null {
  // First check metadata
  if (metadata?.key && isValidMusicalKey(metadata.key)) {
    return metadata.key as MusicalKey;
  }

  // Try to find {key:} directive in content
  const keyDirectiveMatch = content.match(/\{key:\s*([^}]+)\}/i);
  if (keyDirectiveMatch) {
    const keyValue = keyDirectiveMatch[1].trim();
    if (isValidMusicalKey(keyValue)) {
      return keyValue as MusicalKey;
    }
  }

  // Try to analyze chord progression (basic heuristic)
  const chords = extractChordsFromContent(content);
  if (chords.length > 0) {
    return guessKeyFromChords(chords);
  }

  return null;
}

/**
 * Calculate the target key after transposition
 * @param originalKey - Original musical key
 * @param semitones - Transposition in semitones
 * @returns Target key after transposition
 */
export function calculateTransposedKey(originalKey: MusicalKey, semitones: number): MusicalKey {
  const keyIndex = MUSICAL_KEYS.indexOf(originalKey);
  if (keyIndex === -1) {return originalKey;}

  const newIndex = (keyIndex + semitones + MUSICAL_KEYS.length) % MUSICAL_KEYS.length;
  return MUSICAL_KEYS[newIndex];
}

/**
 * Get all available transposition keys from a starting key
 * @param _originalKey - Starting musical key (unused - all keys are available)
 * @returns Array of all 12 possible keys
 */
export function getAvailableKeys(_originalKey?: MusicalKey): MusicalKey[] {
  // Return all musical keys - user can transpose to any key
  return [...MUSICAL_KEYS];
}

// ==================== Chord Analysis ====================

/**
 * Extract chord names from ChordPro content
 * @param content - ChordPro format content
 * @returns Array of unique chord names
 */
export function extractChordsFromContent(content: string): string[] {
  const chordRegex = /\[([A-G][#b]?[^/\]]*(?:\/[A-G][#b]?)?)\]/g;
  const matches = content.match(chordRegex);

  if (!matches) {return [];}

  return matches
    .map(match => match.slice(1, -1)) // Remove brackets
    .filter((chord, index, array) => array.indexOf(chord) === index) // Remove duplicates
    .filter(chord => chord.trim() !== ""); // Remove empty chords
}

/**
 * Validate if a chord name is properly formatted
 * @param chord - Chord name to validate
 * @returns True if chord is valid
 */
export function isValidChord(chord: string): boolean {
  // Basic chord validation - starts with note, optional accidental, optional extensions
  const chordPattern = /^[A-G][#b]?(?:m|maj|min|dim|aug|sus[24]?|\d+|add\d+|\/[A-G][#b]?)*$/;
  return chordPattern.test(chord);
}

/**
 * Guess musical key from chord progression using basic music theory
 * @param chords - Array of chord names
 * @returns Most likely key or null
 */
function guessKeyFromChords(chords: string[]): MusicalKey | null {
  if (chords.length === 0) {return null;}

  // Simplified key detection - look for common chord patterns
  const rootNotes = chords.map(chord => {
    const match = chord.match(/^([A-G][#b]?)/);
    return match ? match[1] : null;
  }).filter(Boolean);

  if (rootNotes.length === 0) {return null;}

  // Count frequency of root notes
  const noteFrequency = rootNotes.reduce((acc, note) => {
    if (note) {acc[note] = (acc[note] || 0) + 1;}
    return acc;
  }, {} as Record<string, number>);

  // Return the most frequent root note as likely key
  const mostFrequentNote = Object.entries(noteFrequency)
    .sort((a, b) => b[1] - a[1])[0]?.[0];

  return isValidMusicalKey(mostFrequentNote) ? mostFrequentNote as MusicalKey : null;
}

// ==================== Validation Functions ====================

/**
 * Check if a string is a valid musical key
 * @param key - String to validate
 * @returns True if valid musical key
 */
export function isValidMusicalKey(key: string): boolean {
  return MUSICAL_KEYS.includes(key as MusicalKey);
}

/**
 * Validate ChordPro content for common issues
 * @param content - ChordPro content to validate
 * @returns Validation result with any warnings
 */
export function validateChordProContent(content: string): {
  isValid: boolean;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (!content || content.trim() === "") {
    errors.push("Content cannot be empty");
    return { isValid: false, warnings, errors };
  }

  // Check for unmatched brackets
  const openBrackets = (content.match(/\[/g) || []).length;
  const closeBrackets = (content.match(/\]/g) || []).length;
  if (openBrackets !== closeBrackets) {
    errors.push(`Unmatched chord brackets: ${openBrackets} opening, ${closeBrackets} closing`);
  }

  // Check for malformed directives
  const directivePattern = /\{[^}]*\}/g;
  const directives = content.match(directivePattern) || [];
  for (const directive of directives) {
    if (!directive.includes(":") && !directive.match(/\{(chorus|verse|bridge|tag|comment|c)\}/i)) {
      warnings.push(`Possibly malformed directive: ${directive}`);
    }
  }

  // Check for invalid chord names
  const chords = extractChordsFromContent(content);
  for (const chord of chords) {
    if (!isValidChord(chord)) {
      warnings.push(`Possibly invalid chord: ${chord}`);
    }
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  };
}

// ==================== Performance Utilities ====================

/**
 * Measure performance of chord parsing operations
 * @param operation - Function to measure
 * @param label - Label for the operation
 * @returns Result of the operation and timing info
 */
export function measureChordOperation<T>(
  operation: () => T,
  label: string,
): { result: T; duration: number } {
  const startTime = performance.now();
  const result = operation();
  const duration = performance.now() - startTime;

  if (process.env.NODE_ENV === "development") {
    console.log(`[ChordSheetHelpers] ${label}: ${duration.toFixed(2)}ms`);
  }

  return { result, duration };
}

/**
 * Create a performance-optimized parser result cache key
 * @param content - ChordPro content  
 * @param transpose - Transposition level
 * @returns Cache key string
 */
export function createCacheKey(content: string, transpose: number = 0): string {
  // Simple hash function for cache key generation
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `chord_${hash}_t${transpose}`;
}

// ==================== Error Helpers ====================

/**
 * Create a standardized ChordParsingError
 * @param type - Error type
 * @param message - Error message
 * @param originalContent - Content that caused the error
 * @param line - Optional line number
 * @param column - Optional column number
 * @returns ChordParsingError object
 */
export function createChordParsingError(
  type: ChordParsingError["type"],
  message: string,
  originalContent: string,
  line?: number,
  column?: number,
): ChordParsingError {
  return {
    type,
    message,
    originalContent,
    line,
    column,
  };
}

/**
 * Convert generic errors to ChordParsingError format
 * @param error - Generic error object
 * @param originalContent - Content that caused the error
 * @returns ChordParsingError object
 */
export function normalizeChordError(error: unknown, originalContent: string): ChordParsingError {
  if (error instanceof Error) {
    return createChordParsingError("parse_error", error.message, originalContent);
  }
  
  return createChordParsingError(
    "parse_error",
    "Unknown error occurred during chord processing",
    originalContent,
  );
}