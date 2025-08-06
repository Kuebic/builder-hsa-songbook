import { useState, useEffect } from "react";
import { Song, SongFilters } from "@features/songs/types/song.types";

export function useSongSearch(songs: Song[], filters: SongFilters) {
  const [filteredSongs, setFilteredSongs] = useState<Song[]>(songs);

  useEffect(() => {
    let filtered = songs;

    // Search filter
    if (filters.searchQuery.trim()) {
      filtered = filtered.filter(
        (song) =>
          song.title
            .toLowerCase()
            .includes(filters.searchQuery.toLowerCase()) ||
          song.artist
            ?.toLowerCase()
            .includes(filters.searchQuery.toLowerCase()) ||
          song.themes.some((theme) =>
            theme.toLowerCase().includes(filters.searchQuery.toLowerCase()),
          ),
      );
    }

    // Key filter
    if (filters.key !== "all") {
      filtered = filtered.filter((song) => song.key === filters.key);
    }

    // Difficulty filter
    if (filters.difficulty !== "all") {
      filtered = filtered.filter(
        (song) => song.difficulty === filters.difficulty,
      );
    }

    // Theme filter
    if (filters.themes.length > 0) {
      filtered = filtered.filter((song) =>
        filters.themes.some((theme) => song.themes.includes(theme)),
      );
    }

    setFilteredSongs(filtered);
  }, [songs, filters]);

  return filteredSongs;
}
