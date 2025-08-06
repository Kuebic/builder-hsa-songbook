import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useSongSearch } from "../useSongSearch";
import { Song, SongFilters } from "../../types/song.types";

const mockSongs: Song[] = [
  {
    _id: "1",
    title: "Amazing Grace",
    artist: "John Newton",
    key: "G",
    tempo: 120,
    difficulty: "intermediate",
    themes: ["worship", "grace", "salvation"],
    source: "Traditional",
    lyrics: "Amazing grace how sweet the sound...",
    notes: "Classic hymn",
    metadata: {
      createdBy: "user1",
      isPublic: true,
      ratings: {
        average: 4.5,
        count: 10,
      },
      views: 150,
    },
    documentSize: 2048,
    chordData: "[G]Amazing [C]grace how [G]sweet the [D]sound",
    slug: "amazing-grace",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    timeSignature: "4/4",
  },
  {
    _id: "2",
    title: "How Great Thou Art",
    artist: "Carl Boberg",
    key: "C",
    tempo: 80,
    difficulty: "beginner",
    themes: ["praise", "worship"],
    source: "Traditional",
    lyrics: "O Lord my God, when I in awesome wonder...",
    notes: "Beautiful hymn",
    metadata: {
      createdBy: "user2",
      isPublic: true,
      ratings: {
        average: 4.8,
        count: 15,
      },
      views: 200,
    },
    documentSize: 1536,
    chordData: "[C]O Lord my [F]God, when [G]I in awesome [C]wonder",
    slug: "how-great-thou-art",
    createdAt: "2024-01-02T00:00:00Z",
    updatedAt: "2024-01-02T00:00:00Z",
    timeSignature: "4/4",
  },
  {
    _id: "3",
    title: "Oceans (Where Feet May Fail)",
    artist: "Hillsong United",
    key: "D",
    tempo: 140,
    difficulty: "advanced",
    themes: ["faith", "trust", "surrender"],
    source: "Hillsong",
    lyrics: "You call me out upon the waters...",
    notes: "Modern worship song",
    metadata: {
      createdBy: "user3",
      isPublic: true,
      ratings: {
        average: 4.9,
        count: 20,
      },
      views: 300,
    },
    documentSize: 3072,
    chordData: "[D]You call me [A]out upon the [Bm]waters",
    slug: "oceans-where-feet-may-fail",
    createdAt: "2024-01-03T00:00:00Z",
    updatedAt: "2024-01-03T00:00:00Z",
    timeSignature: "4/4",
  },
  {
    _id: "4",
    title: "What a Friend We Have in Jesus",
    artist: "Joseph M. Scriven",
    key: "F",
    tempo: 90,
    difficulty: "beginner",
    themes: ["friendship", "comfort", "prayer"],
    source: "Traditional",
    lyrics: "What a friend we have in Jesus...",
    notes: "Comforting hymn",
    metadata: {
      createdBy: "user4",
      isPublic: true,
      ratings: {
        average: 4.2,
        count: 8,
      },
      views: 100,
    },
    documentSize: 1792,
    chordData: "[F]What a friend we [C]have in [Dm]Jesus",
    slug: "what-a-friend-we-have-in-jesus",
    createdAt: "2024-01-04T00:00:00Z",
    updatedAt: "2024-01-04T00:00:00Z",
    timeSignature: "3/4",
  },
];

const defaultFilters: SongFilters = {
  searchQuery: "",
  key: "all",
  difficulty: "all",
  themes: [],
};

describe("useSongSearch Hook", () => {
  describe("Basic Functionality", () => {
    it("returns all songs when no filters are applied", () => {
      const { result } = renderHook(() =>
        useSongSearch(mockSongs, defaultFilters),
      );

      expect(result.current).toHaveLength(4);
      expect(result.current).toEqual(mockSongs);
    });

    it("updates filtered songs when songs array changes", () => {
      const { result, rerender } = renderHook(
        ({ songs }) => useSongSearch(songs, defaultFilters),
        { initialProps: { songs: mockSongs.slice(0, 2) } },
      );

      expect(result.current).toHaveLength(2);

      rerender({ songs: mockSongs });
      expect(result.current).toHaveLength(4);
    });
  });

  describe("Search Query Filtering", () => {
    it("filters songs by title", () => {
      const filters: SongFilters = {
        ...defaultFilters,
        searchQuery: "Amazing",
      };
      const { result } = renderHook(() => useSongSearch(mockSongs, filters));

      expect(result.current).toHaveLength(1);
      expect(result.current[0].title).toBe("Amazing Grace");
    });

    it("filters songs by artist", () => {
      const filters: SongFilters = {
        ...defaultFilters,
        searchQuery: "Hillsong",
      };
      const { result } = renderHook(() => useSongSearch(mockSongs, filters));

      expect(result.current).toHaveLength(1);
      expect(result.current[0].artist).toBe("Hillsong United");
    });

    it("filters songs by themes", () => {
      const filters: SongFilters = { ...defaultFilters, searchQuery: "faith" };
      const { result } = renderHook(() => useSongSearch(mockSongs, filters));

      expect(result.current).toHaveLength(1);
      expect(result.current[0].themes).toContain("faith");
    });

    it("is case insensitive", () => {
      const filters: SongFilters = {
        ...defaultFilters,
        searchQuery: "AMAZING",
      };
      const { result } = renderHook(() => useSongSearch(mockSongs, filters));

      expect(result.current).toHaveLength(1);
      expect(result.current[0].title).toBe("Amazing Grace");
    });

    it("handles partial matches", () => {
      const filters: SongFilters = { ...defaultFilters, searchQuery: "Great" };
      const { result } = renderHook(() => useSongSearch(mockSongs, filters));

      expect(result.current).toHaveLength(1);
      expect(result.current[0].title).toBe("How Great Thou Art");
    });

    it("returns empty array when no matches found", () => {
      const filters: SongFilters = {
        ...defaultFilters,
        searchQuery: "NonExistentSong",
      };
      const { result } = renderHook(() => useSongSearch(mockSongs, filters));

      expect(result.current).toHaveLength(0);
    });

    it("handles empty search query", () => {
      const filters: SongFilters = { ...defaultFilters, searchQuery: "" };
      const { result } = renderHook(() => useSongSearch(mockSongs, filters));

      expect(result.current).toEqual(mockSongs);
    });

    it("handles whitespace-only search query", () => {
      const filters: SongFilters = { ...defaultFilters, searchQuery: "   " };
      const { result } = renderHook(() => useSongSearch(mockSongs, filters));

      expect(result.current).toEqual(mockSongs);
    });
  });

  describe("Key Filtering", () => {
    it("filters songs by key", () => {
      const filters: SongFilters = { ...defaultFilters, key: "G" };
      const { result } = renderHook(() => useSongSearch(mockSongs, filters));

      expect(result.current).toHaveLength(1);
      expect(result.current[0].key).toBe("G");
    });

    it("shows all songs when key is 'all'", () => {
      const filters: SongFilters = { ...defaultFilters, key: "all" };
      const { result } = renderHook(() => useSongSearch(mockSongs, filters));

      expect(result.current).toHaveLength(4);
    });

    it("returns empty array when no songs match key", () => {
      const filters: SongFilters = { ...defaultFilters, key: "E" };
      const { result } = renderHook(() => useSongSearch(mockSongs, filters));

      expect(result.current).toHaveLength(0);
    });

    it("filters multiple songs with same key", () => {
      // Add another song in key C
      const songsWithMultipleC = [
        ...mockSongs,
        {
          ...mockSongs[1],
          id: "5",
          title: "Another C Song",
        },
      ];

      const filters: SongFilters = { ...defaultFilters, key: "C" };
      const { result } = renderHook(() =>
        useSongSearch(songsWithMultipleC, filters),
      );

      expect(result.current).toHaveLength(2);
      expect(result.current.every((song) => song.key === "C")).toBe(true);
    });
  });

  describe("Difficulty Filtering", () => {
    it("filters songs by difficulty", () => {
      const filters: SongFilters = {
        ...defaultFilters,
        difficulty: "beginner",
      };
      const { result } = renderHook(() => useSongSearch(mockSongs, filters));

      expect(result.current).toHaveLength(2);
      expect(
        result.current.every((song) => song.difficulty === "beginner"),
      ).toBe(true);
    });

    it("shows all songs when difficulty is 'all'", () => {
      const filters: SongFilters = { ...defaultFilters, difficulty: "all" };
      const { result } = renderHook(() => useSongSearch(mockSongs, filters));

      expect(result.current).toHaveLength(4);
    });

    it("filters intermediate difficulty", () => {
      const filters: SongFilters = {
        ...defaultFilters,
        difficulty: "intermediate",
      };
      const { result } = renderHook(() => useSongSearch(mockSongs, filters));

      expect(result.current).toHaveLength(1);
      expect(result.current[0].difficulty).toBe("intermediate");
    });

    it("filters advanced difficulty", () => {
      const filters: SongFilters = {
        ...defaultFilters,
        difficulty: "advanced",
      };
      const { result } = renderHook(() => useSongSearch(mockSongs, filters));

      expect(result.current).toHaveLength(1);
      expect(result.current[0].difficulty).toBe("advanced");
    });
  });

  describe("Theme Filtering", () => {
    it("filters songs by single theme", () => {
      const filters: SongFilters = { ...defaultFilters, themes: ["worship"] };
      const { result } = renderHook(() => useSongSearch(mockSongs, filters));

      expect(result.current).toHaveLength(2);
      expect(
        result.current.every((song) => song.themes.includes("worship")),
      ).toBe(true);
    });

    it("filters songs by multiple themes (OR logic)", () => {
      const filters: SongFilters = {
        ...defaultFilters,
        themes: ["faith", "comfort"],
      };
      const { result } = renderHook(() => useSongSearch(mockSongs, filters));

      expect(result.current).toHaveLength(2);
      // Should include songs with either "faith" OR "comfort"
      expect(result.current.some((song) => song.themes.includes("faith"))).toBe(
        true,
      );
      expect(
        result.current.some((song) => song.themes.includes("comfort")),
      ).toBe(true);
    });

    it("shows all songs when themes array is empty", () => {
      const filters: SongFilters = { ...defaultFilters, themes: [] };
      const { result } = renderHook(() => useSongSearch(mockSongs, filters));

      expect(result.current).toHaveLength(4);
    });

    it("returns empty array when no songs match theme", () => {
      const filters: SongFilters = {
        ...defaultFilters,
        themes: ["nonexistent"],
      };
      const { result } = renderHook(() => useSongSearch(mockSongs, filters));

      expect(result.current).toHaveLength(0);
    });
  });

  describe("Combined Filtering", () => {
    it("applies search query and key filter together", () => {
      const filters: SongFilters = {
        ...defaultFilters,
        searchQuery: "worship",
        key: "G",
      };
      const { result } = renderHook(() => useSongSearch(mockSongs, filters));

      expect(result.current).toHaveLength(1);
      expect(result.current[0].title).toBe("Amazing Grace");
      expect(result.current[0].key).toBe("G");
      expect(result.current[0].themes.includes("worship")).toBe(true);
    });

    it("applies search query and difficulty filter together", () => {
      const filters: SongFilters = {
        ...defaultFilters,
        searchQuery: "worship",
        difficulty: "beginner",
      };
      const { result } = renderHook(() => useSongSearch(mockSongs, filters));

      expect(result.current).toHaveLength(1);
      expect(result.current[0].title).toBe("How Great Thou Art");
      expect(result.current[0].difficulty).toBe("beginner");
    });

    it("applies key and difficulty filter together", () => {
      const filters: SongFilters = {
        ...defaultFilters,
        key: "F",
        difficulty: "beginner",
      };
      const { result } = renderHook(() => useSongSearch(mockSongs, filters));

      expect(result.current).toHaveLength(1);
      expect(result.current[0].title).toBe("What a Friend We Have in Jesus");
    });

    it("applies all filters together", () => {
      const filters: SongFilters = {
        searchQuery: "worship",
        key: "C",
        difficulty: "beginner",
        themes: ["praise"],
      };
      const { result } = renderHook(() => useSongSearch(mockSongs, filters));

      expect(result.current).toHaveLength(1);
      expect(result.current[0].title).toBe("How Great Thou Art");
    });

    it("returns empty array when combined filters exclude all songs", () => {
      const filters: SongFilters = {
        searchQuery: "worship",
        key: "F", // No worship songs in key F
        difficulty: "all",
        themes: [],
      };
      const { result } = renderHook(() => useSongSearch(mockSongs, filters));

      expect(result.current).toHaveLength(0);
    });
  });

  describe("Filter Updates", () => {
    it("updates results when filters change", () => {
      const { result, rerender } = renderHook(
        ({ filters }) => useSongSearch(mockSongs, filters),
        { initialProps: { filters: defaultFilters } },
      );

      // Initially should show all songs
      expect(result.current).toHaveLength(4);

      // Update to filter by key
      const newFilters: SongFilters = { ...defaultFilters, key: "G" };
      rerender({ filters: newFilters });

      expect(result.current).toHaveLength(1);
      expect(result.current[0].key).toBe("G");
    });

    it("handles rapid filter changes", () => {
      const { result, rerender } = renderHook(
        ({ filters }) => useSongSearch(mockSongs, filters),
        { initialProps: { filters: defaultFilters } },
      );

      // Apply search filter
      rerender({ filters: { ...defaultFilters, searchQuery: "Amazing" } });
      expect(result.current).toHaveLength(1);

      // Change to key filter
      rerender({ filters: { ...defaultFilters, key: "C" } });
      expect(result.current).toHaveLength(1);
      expect(result.current[0].key).toBe("C");

      // Clear all filters
      rerender({ filters: defaultFilters });
      expect(result.current).toHaveLength(4);
    });
  });

  describe("Edge Cases", () => {
    it("handles empty songs array", () => {
      const { result } = renderHook(() => useSongSearch([], defaultFilters));

      expect(result.current).toHaveLength(0);
    });

    it("handles songs with undefined artist", () => {
      const songsWithUndefinedArtist = [
        {
          ...mockSongs[0],
          artist: undefined,
        },
      ];

      const filters: SongFilters = { ...defaultFilters, searchQuery: "John" };
      const { result } = renderHook(() =>
        useSongSearch(songsWithUndefinedArtist, filters),
      );

      expect(result.current).toHaveLength(0);
    });

    it("handles songs with empty themes array", () => {
      const songsWithEmptyThemes = [
        {
          ...mockSongs[0],
          themes: [],
        },
      ];

      const filters: SongFilters = { ...defaultFilters, themes: ["worship"] };
      const { result } = renderHook(() =>
        useSongSearch(songsWithEmptyThemes, filters),
      );

      expect(result.current).toHaveLength(0);
    });
  });
});
