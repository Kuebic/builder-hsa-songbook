import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SongDetailPage from "../SongDetailPage";

// Mock the Layout component
vi.mock("@/shared/components/Layout", () => ({
  Layout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock the hooks
vi.mock("../../hooks/useSongsAPI", () => ({
  useSongBySlug: vi.fn(),
}));

vi.mock("../../hooks/useArrangements", () => ({
  useArrangementsBySong: vi.fn(),
  useUpdateArrangement: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
  useCreateArrangement: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
  useDeleteArrangement: vi.fn(() => ({
    mutateAsync: vi.fn(),
  })),
  useRateArrangement: vi.fn(() => ({
    mutateAsync: vi.fn(),
  })),
}));

import { useSongBySlug } from "../../hooks/useSongsAPI";
import { useArrangementsBySong } from "../../hooks/useArrangements";

const mockSong = {
  id: "1",
  title: "Amazing Grace",
  artist: "John Newton",
  slug: "amazing-grace-jn-4k7p2",
  key: "G",
  tempo: 120,
  difficulty: "intermediate" as const,
  themes: ["worship", "grace", "salvation"],
  basicChords: ["G", "C", "D", "Em"],
  viewCount: 1250,
  avgRating: 4.5,
  isFavorite: false,
  lastUsed: new Date("2024-01-15T10:00:00Z"),
  chordData: "[G]Amazing [C]grace how [G]sweet the [D]sound",
};

const mockArrangements = [
  {
    _id: "arr1",
    name: "Acoustic Version",
    songIds: ["1"],
    createdBy: "John Doe",
    chordData: "[G]Amazing [C]grace",
    metadata: {
      key: "G",
      tempo: 120,
      difficulty: "intermediate" as const,
      isMashup: false,
    },
    createdAt: "2024-01-01T10:00:00Z",
    updatedAt: "2024-01-01T10:00:00Z",
    songs: [{ _id: "1", title: "Amazing Grace", artist: "John Newton" }],
    isDefault: true,
    usageInSetlists: 5,
  },
];

const renderWithRouter = (slug: string) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/songs/${slug}`]}>
        <Routes>
          <Route path="/songs/:slug" element={<SongDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe("SongDetailPage Component", () => {
  it("shows loading skeleton while fetching song data", () => {
    vi.mocked(useSongBySlug).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);
    
    vi.mocked(useArrangementsBySong).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as any);

    renderWithRouter("amazing-grace-jn-4k7p2");
    
    expect(screen.getByTestId("song-detail-skeleton")).toBeInTheDocument();
  });

  it("shows error message when song is not found", () => {
    vi.mocked(useSongBySlug).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("Not found"),
    } as any);
    
    vi.mocked(useArrangementsBySong).mockReturnValue({
      data: undefined,
      isLoading: false,
    } as any);

    renderWithRouter("non-existent-slug");
    
    expect(screen.getByText("Song not found")).toBeInTheDocument();
    expect(screen.getByText(/We couldn't find a song with the slug/)).toBeInTheDocument();
  });

  it("displays song details when data is loaded", async () => {
    vi.mocked(useSongBySlug).mockReturnValue({
      data: mockSong,
      isLoading: false,
      error: null,
    } as any);
    
    vi.mocked(useArrangementsBySong).mockReturnValue({
      data: mockArrangements,
      isLoading: false,
    } as any);

    renderWithRouter("amazing-grace-jn-4k7p2");
    
    await waitFor(() => {
      expect(screen.getByText("Amazing Grace")).toBeInTheDocument();
      expect(screen.getByText("John Newton")).toBeInTheDocument();
      expect(screen.getByText("Key: G")).toBeInTheDocument();
      expect(screen.getAllByText("120 BPM")[0]).toBeInTheDocument();
      expect(screen.getAllByText("intermediate")[0]).toBeInTheDocument();
    });
  });

  it("shows tabs for different content sections", async () => {
    vi.mocked(useSongBySlug).mockReturnValue({
      data: mockSong,
      isLoading: false,
      error: null,
    } as any);
    
    vi.mocked(useArrangementsBySong).mockReturnValue({
      data: mockArrangements,
      isLoading: false,
    } as any);

    renderWithRouter("amazing-grace-jn-4k7p2");
    
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /Song Info/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /Arrangements \(1\)/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /Rating & Reviews/i })).toBeInTheDocument();
    });
  });

  it("shows arrangement count in tab", async () => {
    vi.mocked(useSongBySlug).mockReturnValue({
      data: mockSong,
      isLoading: false,
      error: null,
    } as any);
    
    vi.mocked(useArrangementsBySong).mockReturnValue({
      data: mockArrangements,
      isLoading: false,
    } as any);

    renderWithRouter("amazing-grace-jn-4k7p2");
    
    // Just verify the tab shows the arrangement count
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /Arrangements \(1\)/i })).toBeInTheDocument();
    });
  });
});