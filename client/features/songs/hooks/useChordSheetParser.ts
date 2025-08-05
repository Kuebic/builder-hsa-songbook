/**
 * @fileoverview React hook for ChordSheetJS parsing with caching and error handling
 * @module features/songs/hooks/useChordSheetParser
 */

import { useMemo, useState, useCallback } from "react";
import type { Song } from "chordsheetjs";
import { 
  ChordSheetParserResult, 
  ChordParsingError, 
  ChordSheetMeta, 
} from "../types/chord.types";
import { 
  parseChordProContent, 
  extractSongMetadata, 
  validateChordProContent,
  measureChordOperation,
  createCacheKey, 
} from "../utils/chordSheetHelpers";

/**
 * Options for the useChordSheetParser hook
 */
interface UseChordSheetParserOptions {
  /** Whether to enable performance measurement in development */
  enablePerformanceMeasurement?: boolean;
  /** Whether to validate content before parsing */
  enableValidation?: boolean;
  /** Custom cache key prefix */
  cacheKeyPrefix?: string;
}

/**
 * Internal cache for parsed results to avoid re-parsing unchanged content
 * This is a simple in-memory cache - in production, consider using React Query
 */
const parseCache = new Map<string, { song: Song; metadata: ChordSheetMeta; timestamp: number }>();

/**
 * Cache cleanup interval (5 minutes)
 */
const CACHE_CLEANUP_INTERVAL = 5 * 60 * 1000;

/**
 * Maximum cache size to prevent memory leaks
 */
const MAX_CACHE_SIZE = 100;

/**
 * React hook for parsing ChordPro content using ChordSheetJS
 * 
 * Provides performance-optimized parsing with caching, error handling,
 * and metadata extraction. Results are memoized to prevent unnecessary
 * re-parsing of unchanged content.
 * 
 * @param content - ChordPro format content to parse
 * @param options - Configuration options for the parser
 * @returns Parser result with song, error, metadata, and status information
 * 
 * @example
 * ```tsx
 * const { parsedSong, error, metadata, isValid, isLoading } = useChordSheetParser(chordProContent);
 * 
 * if (error) {
 *   return <div>Error: {error.message}</div>;
 * }
 * 
 * if (parsedSong) {
 *   return <ChordDisplay song={parsedSong} metadata={metadata} />;
 * }
 * ```
 */
export function useChordSheetParser(
  content: string,
  options: UseChordSheetParserOptions = {},
): ChordSheetParserResult {
  const {
    enablePerformanceMeasurement = process.env.NODE_ENV === "development",
    enableValidation = true,
    cacheKeyPrefix = "chord_parser",
  } = options;

  const [isLoading, setIsLoading] = useState(false);

  /**
   * Clean up old cache entries to prevent memory leaks
   */
  const cleanupCache = useCallback(() => {
    const now = Date.now();
    const entries = Array.from(parseCache.entries());
    
    // Remove entries older than 5 minutes or if cache is too large
    const shouldCleanup = entries.length > MAX_CACHE_SIZE || 
      entries.some(([, value]) => now - value.timestamp > CACHE_CLEANUP_INTERVAL);
    
    if (shouldCleanup) {
      // Sort by timestamp and keep only the most recent entries
      const sortedEntries = entries
        .sort((a, b) => b[1].timestamp - a[1].timestamp)
        .slice(0, Math.floor(MAX_CACHE_SIZE * 0.8)); // Keep 80% of max size
      
      parseCache.clear();
      sortedEntries.forEach(([key, value]) => {
        parseCache.set(key, value);
      });
    }
  }, []);

  /**
   * Main parsing logic with caching and error handling
   */
  const parseResult = useMemo((): Omit<ChordSheetParserResult, "isLoading"> => {
    // Early return for empty content
    if (!content || content.trim() === "") {
      return {
        parsedSong: null,
        error: {
          type: "parse_error",
          message: "Content cannot be empty",
          originalContent: content,
        },
        metadata: null,
        isValid: false,
      };
    }

    // Generate cache key
    const cacheKey = `${cacheKeyPrefix}_${createCacheKey(content)}`;

    // Check cache first
    const cachedResult = parseCache.get(cacheKey);
    if (cachedResult) {
      return {
        parsedSong: cachedResult.song,
        error: null,
        metadata: cachedResult.metadata,
        isValid: true,
      };
    }

    // Validate content if enabled
    if (enableValidation) {
      const validation = validateChordProContent(content);
      if (!validation.isValid) {
        const error: ChordParsingError = {
          type: "parse_error",
          message: `Validation failed: ${validation.errors.join(", ")}`,
          originalContent: content,
        };
        return {
          parsedSong: null,
          error,
          metadata: null,
          isValid: false,
        };
      }
    }

    // Parse content with optional performance measurement
    const parseOperation = () => parseChordProContent(content);
    
    const { result: parseResult, duration } = enablePerformanceMeasurement
      ? measureChordOperation(parseOperation, `Parse ChordPro (${content.length} chars)`)
      : { result: parseOperation(), duration: 0 };

    // Handle parsing errors
    if (parseResult.error || !parseResult.song) {
      return {
        parsedSong: null,
        error: parseResult.error || {
          type: "parse_error",
          message: "Unknown parsing error",
          originalContent: content,
        },
        metadata: null,
        isValid: false,
      };
    }

    // Extract metadata from parsed song
    const extractMetadataOperation = () => extractSongMetadata(parseResult.song!);
    
    const metadata = enablePerformanceMeasurement
      ? measureChordOperation(extractMetadataOperation, "Extract metadata").result
      : extractMetadataOperation();

    // Cache successful parse result
    parseCache.set(cacheKey, {
      song: parseResult.song,
      metadata,
      timestamp: Date.now(),
    });

    // Cleanup cache periodically
    cleanupCache();

    // Log performance info in development
    if (enablePerformanceMeasurement && process.env.NODE_ENV === "development") {
      console.log(`[useChordSheetParser] Total parsing time: ${duration.toFixed(2)}ms`);
    }

    return {
      parsedSong: parseResult.song,
      error: null,
      metadata,
      isValid: true,
    };
  }, [content, cacheKeyPrefix, enableValidation, enablePerformanceMeasurement, cleanupCache]);

  /**
   * Simulate loading state for very large content
   * In practice, ChordSheetJS parsing is usually very fast
   */
  const simulateLoadingForLargeContent = useCallback(() => {
    if (content.length > 10000) { // > 10KB
      setIsLoading(true);
      const timer = setTimeout(() => setIsLoading(false), 50);
      return () => clearTimeout(timer);
    }
    setIsLoading(false);
  }, [content.length]);

  // Simulate loading for large content
  useMemo(() => {
    const cleanup = simulateLoadingForLargeContent();
    return cleanup;
  }, [simulateLoadingForLargeContent]);

  return {
    ...parseResult,
    isLoading,
  };
}

/**
 * Alternative hook for when you need to parse content on-demand rather than reactively
 * Useful for scenarios where you want to control when parsing happens
 * 
 * @param options - Configuration options for the parser
 * @returns Object with parse function and last result
 * 
 * @example
 * ```tsx
 * const { parseContent, lastResult, isLoading } = useChordSheetParserCallback();
 * 
 * const handleParse = () => {
 *   const result = parseContent(chordProContent);
 *   if (result.error) {
 *     console.error('Parse error:', result.error);
 *   }
 * };
 * ```
 */
export function useChordSheetParserCallback(
  options: UseChordSheetParserOptions = {},
): {
  parseContent: (content: string) => ChordSheetParserResult;
  lastResult: ChordSheetParserResult | null;
  isLoading: boolean;
  clearCache: () => void;
} {
  const [lastResult, setLastResult] = useState<ChordSheetParserResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const parseContent = useCallback((content: string): ChordSheetParserResult => {
    setIsLoading(true);
    
    try {
      // Use the same parsing logic as the main hook, but without memoization
      const parseOperation = () => parseChordProContent(content);
      const parseResult = options.enablePerformanceMeasurement
        ? measureChordOperation(parseOperation, `Parse ChordPro (${content.length} chars)`).result
        : parseOperation();

      let result: ChordSheetParserResult;

      if (parseResult.error || !parseResult.song) {
        result = {
          parsedSong: null,
          error: parseResult.error || {
            type: "parse_error",
            message: "Unknown parsing error",
            originalContent: content,
          },
          metadata: null,
          isValid: false,
          isLoading: false,
        };
      } else {
        const metadata = extractSongMetadata(parseResult.song);
        result = {
          parsedSong: parseResult.song,
          error: null,
          metadata,
          isValid: true,
          isLoading: false,
        };
      }

      setLastResult(result);
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [options.enablePerformanceMeasurement]);

  const clearCache = useCallback(() => {
    parseCache.clear();
  }, []);

  return {
    parseContent,
    lastResult,
    isLoading,
    clearCache,
  };
}

/**
 * Hook to get cache statistics for debugging and monitoring
 * Only available in development mode
 * 
 * @returns Cache statistics object
 */
export function useChordSheetParserCache(): {
  cacheSize: number;
  cacheKeys: string[];
  clearCache: () => void;
} | null {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return useMemo(() => ({
    cacheSize: parseCache.size,
    cacheKeys: Array.from(parseCache.keys()),
    clearCache: () => parseCache.clear(),
  }), []);
}