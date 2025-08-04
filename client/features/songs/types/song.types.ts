export interface Song {
  id: string;
  title: string;
  artist: string;
  key: string;
  tempo: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  themes: string[];
  viewCount: number;
  avgRating: number;
  basicChords: string[];
  lastUsed?: Date;
  isFavorite: boolean;
}

export interface ChordChart {
  songId: string;
  content: string;
  capo?: number;
  structure: string[];
}

export interface SongFilters {
  searchQuery: string;
  key: string;
  difficulty: string;
  themes: string[];
}