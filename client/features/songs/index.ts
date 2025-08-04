// Public exports for songs feature
export { default as SongCard } from "./components/SongCard";
export { default as SongsPage } from "./components/SongsPage";
export { default as SongDetailPage } from "./components/SongDetailPage";

// Hooks
export { useSongSearch } from "./hooks/useSongSearch";
export * from "./hooks/useSongsAPI";
export * from "./hooks/useArrangements";

// Types and utilities
export type { Song, ClientSong, ChordChart, SongFilters } from "./types/song.types";
export { songToClientFormat } from "./types/song.types";
