// Public exports for songs feature
export { default as SongCard } from "./components/SongCard";
export type { SongCardProps } from "./components/SongCard";
export { default as SongsPage } from "./components/SongsPage";
export { default as SongDetailPage } from "./components/SongDetailPage";

// Extracted components
export { StarRating } from "./components/StarRating";
export type { StarRatingProps } from "./components/StarRating";
export { ReviewCard } from "./components/ReviewCard";
export type { ReviewCardProps } from "./components/ReviewCard";
export { ReviewsSummary } from "./components/ReviewsSummary";
export type { ReviewsSummaryProps } from "./components/ReviewsSummary";
export { SongsSearchBar } from "./components/SongsSearchBar";
export type { SongsSearchBarProps } from "./components/SongsSearchBar";

// ChordDisplay components
export { ChordDisplay, default as ChordDisplayComponent } from "./components/ChordDisplay";
export { ChordDisplayControls, default as ChordDisplayControlsComponent } from "./components/ChordDisplayControls";

// Hooks
export { useSongSearch } from "./hooks/useSongSearch";
export * from "./hooks/useSongsAPI";
export * from "./hooks/useArrangements";

// ChordDisplay hooks
export { 
  useChordSheetParser, 
  useChordSheetParserCallback, 
  useChordSheetParserCache, 
} from "./hooks/useChordSheetParser";
export { 
  useChordTransposition, 
  useKeyTransposition, 
  useTargetKeyTransposition, 
} from "./hooks/useChordTransposition";

// Review hooks
export {
  useReviewsByArrangement,
  useCreateOrUpdateReview,
  useMarkReviewHelpful,
  useReportReview,
} from "./hooks/useReviews";

// Types and utilities
export type { Song, ClientSong, ChordChart, SongFilters } from "./types/song.types";
export { songToClientFormat } from "./types/song.types";

// ChordDisplay types
export type {
  ChordDisplayProps,
  ChordDisplayControlsProps,
  ChordParsingError,
  TranspositionState,
  ChordSheetMeta,
  ChordSheetParserResult,
  ChordTranspositionResult,
  MusicalKey,
  FontSize,
  DisplayTheme,
  FormatterOptions,
} from "./types/chord.types";

export {
  ChordDisplayPropsSchema,
  TranspositionLevelSchema,
  MusicalKeySchema,
  FontSizeSchema,
  DisplayThemeSchema,
  MUSICAL_KEYS,
  FONT_SIZE_CONFIG,
  THEME_CONFIG,
  TRANSPOSITION_BOUNDS,
  isMusicalKey,
  isFontSize,
  isDisplayTheme,
  isChordParsingError,
} from "./types/chord.types";

// ChordDisplay utilities
export {
  getChordProParser,
  getHtmlDivFormatter,
  parseChordProContent,
  formatSongToHtml,
  transposeSong,
  sanitizeHtmlOutput,
  extractSongMetadata,
  detectMusicalKey,
  calculateTransposedKey,
  getAvailableKeys,
  extractChordsFromContent,
  isValidChord,
  isValidMusicalKey,
  validateChordProContent,
  measureChordOperation,
  createCacheKey,
  createChordParsingError,
  normalizeChordError,
} from "./utils/chordSheetHelpers";
