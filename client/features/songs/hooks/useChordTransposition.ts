/**
 * @fileoverview React hook for chord transposition with bounds checking and key detection
 * @module features/songs/hooks/useChordTransposition
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import { 
  ChordTranspositionResult, 
  MusicalKey, 
  ChordSheetMeta,
  TRANSPOSITION_BOUNDS,
  TranspositionLevelSchema, 
} from "../types/chord.types";
import { 
  detectMusicalKey, 
  calculateTransposedKey, 
  getAvailableKeys, 
  isValidMusicalKey, 
} from "../utils/chordSheetHelpers";

/**
 * Options for the useChordTransposition hook
 */
interface UseChordTranspositionOptions {
  /** Initial transposition level */
  initialTranspose?: number;
  /** Original key of the song (if known) */
  originalKey?: MusicalKey;
  /** Metadata for key detection */
  metadata?: ChordSheetMeta;
  /** ChordPro content for key detection */
  content?: string;
  /** Callback when transposition changes */
  onTranspositionChange?: (level: number, currentKey: MusicalKey | null) => void;
  /** Whether to detect key automatically from content/metadata */
  enableKeyDetection?: boolean;
}

/**
 * React hook for managing chord transposition with bounds checking and key detection
 * 
 * Provides state management for transposition levels, key detection, and bounds validation.
 * Automatically detects the original key from content or metadata and calculates
 * the current key based on transposition level.
 * 
 * @param options - Configuration options for transposition behavior
 * @returns Transposition state and control functions
 * 
 * @example
 * ```tsx
 * const transposition = useChordTransposition({
 *   content: chordProContent,
 *   metadata: songMetadata,
 *   onTranspositionChange: (level, key) => {
 *     console.log(`Transposed to ${key} (${level > 0 ? '+' : ''}${level})`);
 *   }
 * });
 * 
 * return (
 *   <div>
 *     <button onClick={transposition.transposeUp} disabled={!transposition.canTransposeUp}>
 *       Transpose Up
 *     </button>
 *     <span>Current Key: {transposition.currentKey || 'Unknown'}</span>
 *     <button onClick={transposition.transposeDown} disabled={!transposition.canTransposeDown}>
 *       Transpose Down
 *     </button>
 *   </div>
 * );
 * ```
 */
export function useChordTransposition(
  options: UseChordTranspositionOptions = {},
): ChordTranspositionResult {
  const {
    initialTranspose = 0,
    originalKey: providedOriginalKey,
    metadata,
    content,
    onTranspositionChange,
    enableKeyDetection = true,
  } = options;

  // Validate initial transpose level
  const validatedInitialTranspose = useMemo(() => {
    const result = TranspositionLevelSchema.safeParse(initialTranspose);
    return result.success ? initialTranspose : 0;
  }, [initialTranspose]);

  // State for transposition level
  const [transpositionLevel, setTranspositionLevel] = useState(validatedInitialTranspose);

  // Detect original key from content, metadata, or provided key
  const originalKey = useMemo((): MusicalKey | null => {
    // Use provided key if valid
    if (providedOriginalKey && isValidMusicalKey(providedOriginalKey)) {
      return providedOriginalKey;
    }

    // Detect key from content/metadata if enabled
    if (enableKeyDetection) {
      if (content) {
        return detectMusicalKey(content, metadata);
      }
      if (metadata?.key && isValidMusicalKey(metadata.key)) {
        return metadata.key as MusicalKey;
      }
    }

    return null;
  }, [providedOriginalKey, content, metadata, enableKeyDetection]);

  // Calculate current key based on transposition
  const currentKey = useMemo((): MusicalKey | null => {
    if (!originalKey) {return null;}
    if (transpositionLevel === 0) {return originalKey;}
    
    try {
      return calculateTransposedKey(originalKey, transpositionLevel);
    } catch (error) {
      console.warn("[useChordTransposition] Key calculation error:", error);
      return originalKey;
    }
  }, [originalKey, transpositionLevel]);

  // Calculate available keys for selection
  const availableKeys = useMemo((): MusicalKey[] => {
    return getAvailableKeys(originalKey || undefined);
  }, [originalKey]);

  // Calculate bounds for transposition controls
  const canTransposeUp = useMemo(() => {
    return transpositionLevel < TRANSPOSITION_BOUNDS.MAX;
  }, [transpositionLevel]);

  const canTransposeDown = useMemo(() => {
    return transpositionLevel > TRANSPOSITION_BOUNDS.MIN;
  }, [transpositionLevel]);

  // Transpose by relative semitones with bounds checking
  const transpose = useCallback((semitones: number) => {
    const newLevel = transpositionLevel + semitones;
    const clampedLevel = Math.max(
      TRANSPOSITION_BOUNDS.MIN,
      Math.min(TRANSPOSITION_BOUNDS.MAX, newLevel),
    );
    
    if (clampedLevel !== transpositionLevel) {
      setTranspositionLevel(clampedLevel);
    }
  }, [transpositionLevel]);

  // Transpose up by one semitone
  const transposeUp = useCallback(() => {
    if (canTransposeUp) {
      transpose(1);
    }
  }, [transpose, canTransposeUp]);

  // Transpose down by one semitone
  const transposeDown = useCallback(() => {
    if (canTransposeDown) {
      transpose(-1);
    }
  }, [transpose, canTransposeDown]);

  // Set absolute transposition level
  const setTransposition = useCallback((level: number) => {
    const result = TranspositionLevelSchema.safeParse(level);
    if (result.success) {
      setTranspositionLevel(level);
    } else {
      console.warn("[useChordTransposition] Invalid transposition level:", level);
    }
  }, []);

  // Reset transposition to original key
  const reset = useCallback(() => {
    setTranspositionLevel(0);
  }, []);

  // Notify when transposition changes
  useEffect(() => {
    if (onTranspositionChange) {
      onTranspositionChange(transpositionLevel, currentKey);
    }
  }, [transpositionLevel, currentKey, onTranspositionChange]);

  return {
    currentKey,
    transpositionLevel,
    availableKeys,
    canTransposeUp,
    canTransposeDown,
    transpose,
    transposeUp,
    transposeDown,
    reset,
    setTransposition,
  };
}

/**
 * Hook for calculating transposition between two specific keys
 * Useful for key-to-key transposition without managing state
 * 
 * @param fromKey - Source key
 * @param toKey - Target key
 * @returns Transposition information
 * 
 * @example
 * ```tsx
 * const transposition = useKeyTransposition('C', 'G');
 * console.log(`Transpose ${transposition.semitones} semitones`); // "Transpose 7 semitones"
 * ```
 */
export function useKeyTransposition(
  fromKey: MusicalKey | null,
  toKey: MusicalKey | null,
): {
  semitones: number;
  isValid: boolean;
  error?: string;
} {
  return useMemo(() => {
    if (!fromKey || !toKey) {
      return {
        semitones: 0,
        isValid: false,
        error: "Both source and target keys must be provided",
      };
    }

    if (!isValidMusicalKey(fromKey) || !isValidMusicalKey(toKey)) {
      return {
        semitones: 0,
        isValid: false,
        error: "Invalid musical key provided",
      };
    }

    try {
      // Calculate semitones between keys
      const keyOrder = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
      const fromIndex = keyOrder.indexOf(fromKey.replace("b", "#")); // Normalize flats to sharps
      const toIndex = keyOrder.indexOf(toKey.replace("b", "#"));

      if (fromIndex === -1 || toIndex === -1) {
        return {
          semitones: 0,
          isValid: false,
          error: "Could not calculate semitones between keys",
        };
      }

      let semitones = toIndex - fromIndex;
      
      // Normalize to range [-11, 11]
      if (semitones > 6) {
        semitones -= 12;
      } else if (semitones < -6) {
        semitones += 12;
      }

      return {
        semitones,
        isValid: true,
      };
    } catch (error) {
      return {
        semitones: 0,
        isValid: false,
        error: error instanceof Error ? error.message : "Unknown error calculating transposition",
      };
    }
  }, [fromKey, toKey]);
}

/**
 * Hook for transposing to a specific target key
 * Combines useChordTransposition with automatic target key calculation
 * 
 * @param options - Configuration options including target key
 * @returns Enhanced transposition result with target key functions
 * 
 * @example
 * ```tsx
 * const transposition = useTargetKeyTransposition({
 *   content: chordProContent,
 *   targetKey: 'G'
 * });
 * 
 * return (
 *   <button onClick={transposition.transposeToTarget}>
 *     Transpose to {transposition.targetKey}
 *   </button>
 * );
 * ```
 */
export function useTargetKeyTransposition(
  options: UseChordTranspositionOptions & { targetKey?: MusicalKey },
): ChordTranspositionResult & {
  targetKey: MusicalKey | null;
  transposeToTarget: () => void;
  canTransposeToTarget: boolean;
} {
  const { targetKey, ...transpositionOptions } = options;
  
  const transposition = useChordTransposition(transpositionOptions);
  const keyTransposition = useKeyTransposition(
    transposition.currentKey as MusicalKey | null, 
    targetKey || null,
  );

  const transposeToTarget = useCallback(() => {
    if (keyTransposition.isValid && targetKey) {
      // Calculate required transposition from original key to target key
      const originalKey = options.originalKey || transposition.currentKey;
      if (originalKey && isValidMusicalKey(originalKey)) {
        const originalToTargetTransposition = useKeyTransposition(originalKey as MusicalKey, targetKey);
        
        if (originalToTargetTransposition.isValid) {
          transposition.setTransposition(originalToTargetTransposition.semitones);
        }
      }
    }
  }, [keyTransposition.isValid, targetKey, transposition, options.originalKey]);

  const canTransposeToTarget = useMemo(() => {
    return keyTransposition.isValid && targetKey !== null;
  }, [keyTransposition.isValid, targetKey]);

  return {
    ...transposition,
    targetKey: targetKey || null,
    transposeToTarget,
    canTransposeToTarget,
  };
}