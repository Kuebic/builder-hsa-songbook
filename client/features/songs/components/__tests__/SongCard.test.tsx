import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import SongCard from "../SongCard";
import { ClientSong } from "../../types/song.types";

// Mock the React Router Link component
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    Link: ({ children, to, ...props }: any) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  };
});

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  Heart: () => <div data-testid="heart-icon" />,
  MoreHorizontal: () => <div data-testid="more-horizontal-icon" />,
  Play: () => <div data-testid="play-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  Star: () => <div data-testid="star-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  Copy: () => <div data-testid="copy-icon" />,
  Edit: () => <div data-testid="edit-icon" />,
  Share: () => <div data-testid="share-icon" />,
}));

const mockSong: ClientSong = {
  id: "1",
  title: "Amazing Grace",
  artist: "John Newton",
  slug: "amazing-grace-jn-4k7p2",
  key: "G",
  tempo: 120,
  difficulty: "intermediate",
  themes: ["worship", "grace", "salvation"],
  basicChords: ["G", "C", "D", "Em"],
  viewCount: 1250,
  avgRating: 4.5,
  isFavorite: false,
  lastUsed: new Date("2024-01-15T10:00:00Z"),
  chordData: "[G]Amazing [C]grace how [G]sweet the [D]sound",
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("SongCard Component", () => {
  describe("Basic Rendering", () => {
    it("renders song title and artist correctly", () => {
      renderWithRouter(<SongCard song={mockSong} />);
      
      expect(screen.getByText("Amazing Grace")).toBeInTheDocument();
      expect(screen.getByText("John Newton")).toBeInTheDocument();
    });

    it("displays song metadata (key, tempo, difficulty)", () => {
      renderWithRouter(<SongCard song={mockSong} />);
      
      expect(screen.getByText("Key: G")).toBeInTheDocument();
      expect(screen.getByText("120 BPM")).toBeInTheDocument();
      expect(screen.getByText("intermediate")).toBeInTheDocument();
    });

    it("shows view count and rating", () => {
      renderWithRouter(<SongCard song={mockSong} />);
      
      expect(screen.getByText("1.3k")).toBeInTheDocument(); // 1250 formatted as 1.3k
      expect(screen.getByText("4.5")).toBeInTheDocument();
    });

    it("displays basic chords preview", () => {
      renderWithRouter(<SongCard song={mockSong} />);
      
      expect(screen.getByText("G")).toBeInTheDocument();
      expect(screen.getByText("C")).toBeInTheDocument();
      expect(screen.getByText("D")).toBeInTheDocument();
      expect(screen.getByText("Em")).toBeInTheDocument();
    });

    it("shows theme badges", () => {
      renderWithRouter(<SongCard song={mockSong} />);
      
      expect(screen.getByText("worship")).toBeInTheDocument();
      expect(screen.getByText("grace")).toBeInTheDocument();
      expect(screen.getByText("salvation")).toBeInTheDocument();
    });

    it("displays last used date", () => {
      renderWithRouter(<SongCard song={mockSong} />);
      
      expect(screen.getByText(/Used/)).toBeInTheDocument();
    });
  });

  describe("Difficulty Badge Colors", () => {
    it("shows correct colors for beginner difficulty", () => {
      const beginnerSong = { ...mockSong, difficulty: "beginner" as const };
      renderWithRouter(<SongCard song={beginnerSong} />);
      
      const difficultyBadge = screen.getByText("beginner");
      expect(difficultyBadge).toHaveClass("bg-green-100", "text-green-800");
    });

    it("shows correct colors for intermediate difficulty", () => {
      renderWithRouter(<SongCard song={mockSong} />);
      
      const difficultyBadge = screen.getByText("intermediate");
      expect(difficultyBadge).toHaveClass("bg-yellow-100", "text-yellow-800");
    });

    it("shows correct colors for advanced difficulty", () => {
      const advancedSong = { ...mockSong, difficulty: "advanced" as const };
      renderWithRouter(<SongCard song={advancedSong} />);
      
      const difficultyBadge = screen.getByText("advanced");
      expect(difficultyBadge).toHaveClass("bg-red-100", "text-red-800");
    });
  });

  describe("Compact Variant", () => {
    it("renders compact layout correctly", () => {
      renderWithRouter(<SongCard song={mockSong} variant="compact" />);
      
      expect(screen.getByText("Amazing Grace")).toBeInTheDocument();
      expect(screen.getByText("John Newton")).toBeInTheDocument();
      expect(screen.getByText("G")).toBeInTheDocument();
      expect(screen.getByText("120 BPM")).toBeInTheDocument();
      
      // Should not show full details in compact mode
      expect(screen.queryByText("Common chords:")).not.toBeInTheDocument();
      expect(screen.queryByText("worship")).not.toBeInTheDocument();
    });

    it("handles song without tempo in compact mode", () => {
      const songWithoutTempo = { ...mockSong, tempo: undefined };
      renderWithRouter(<SongCard song={songWithoutTempo} variant="compact" />);
      
      expect(screen.getByText("G")).toBeInTheDocument();
      expect(screen.queryByText("BPM")).not.toBeInTheDocument();
    });
  });

  describe("Interaction Handling", () => {
    it("calls onToggleFavorite when heart button is clicked", async () => {
      const onToggleFavorite = vi.fn();
      renderWithRouter(
        <SongCard song={mockSong} onToggleFavorite={onToggleFavorite} />
      );
      
      const heartButton = screen.getByTestId("heart-icon").closest("button");
      fireEvent.click(heartButton!);
      
      expect(onToggleFavorite).toHaveBeenCalledWith("1");
    });

    it("shows favorite state correctly", () => {
      const favoriteSong = { ...mockSong, isFavorite: true };
      renderWithRouter(<SongCard song={favoriteSong} />);
      
      const heartIcon = screen.getByTestId("heart-icon");
      // Check that the heart icon has the favorite styling (from the component logic)
      expect(heartIcon.closest("button")).toBeInTheDocument();
    });

    it("has dropdown menu button that can be clicked", () => {
      const onAddToSetlist = vi.fn();
      renderWithRouter(
        <SongCard song={mockSong} onAddToSetlist={onAddToSetlist} />
      );
      
      const moreButton = screen.getByTestId("more-horizontal-icon").closest("button");
      expect(moreButton).toBeInTheDocument();
      expect(moreButton).toHaveAttribute("aria-haspopup", "menu");
      
      // Test that button is clickable without errors
      expect(() => fireEvent.click(moreButton!)).not.toThrow();
    });

    it("prevents link navigation when dropdown menu is clicked", () => {
      renderWithRouter(<SongCard song={mockSong} />);
      
      const moreButton = screen.getByTestId("more-horizontal-icon").closest("button");
      const clickEvent = new MouseEvent("click", { bubbles: true });
      
      // Mock preventDefault
      const preventDefaultSpy = vi.spyOn(clickEvent, "preventDefault");
      
      fireEvent(moreButton!, clickEvent);
      
      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe("Hover States", () => {
    it("shows play button on hover", async () => {
      renderWithRouter(<SongCard song={mockSong} />);
      
      // The hover state is managed by the Card component
      const cardElement = screen.getByText("Amazing Grace").closest('[class*="cursor-pointer"]');
      fireEvent.mouseEnter(cardElement!);
      
      await waitFor(() => {
        expect(screen.getByTestId("play-icon")).toBeInTheDocument();
      });
    });

    it("hides play button when not hovering", () => {
      renderWithRouter(<SongCard song={mockSong} />);
      
      const cardElement = screen.getByText("Amazing Grace").closest('[class*="cursor-pointer"]');
      fireEvent.mouseLeave(cardElement!);
      
      expect(screen.queryByTestId("play-icon")).not.toBeInTheDocument();
    });
  });

  describe("Actions Visibility", () => {
    it("shows action buttons when showActions is true (default)", () => {
      renderWithRouter(<SongCard song={mockSong} />);
      
      expect(screen.getByTestId("more-horizontal-icon")).toBeInTheDocument();
    });

    it("hides action buttons when showActions is false", () => {
      renderWithRouter(<SongCard song={mockSong} showActions={false} />);
      
      expect(screen.queryByTestId("more-horizontal-icon")).not.toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles song without artist", () => {
      const songWithoutArtist = { ...mockSong, artist: undefined };
      renderWithRouter(<SongCard song={songWithoutArtist} />);
      
      expect(screen.getByText("Amazing Grace")).toBeInTheDocument();
      // Should not crash or show undefined
    });

    it("handles song without tempo", () => {
      const songWithoutTempo = { ...mockSong, tempo: undefined };
      renderWithRouter(<SongCard song={songWithoutTempo} />);
      
      expect(screen.getByText("Key: G")).toBeInTheDocument();
      expect(screen.queryByText("BPM")).not.toBeInTheDocument();
    });

    it("handles song with many chords (shows +X more)", () => {
      const songWithManyChords = {
        ...mockSong,
        basicChords: ["G", "C", "D", "Em", "Am", "F", "Bb", "Dm"],
      };
      renderWithRouter(<SongCard song={songWithManyChords} />);
      
      expect(screen.getByText("+2 more")).toBeInTheDocument();
    });

    it("handles song with many themes (shows +X)", () => {
      const songWithManyThemes = {
        ...mockSong,
        themes: ["worship", "grace", "salvation", "hope", "faith"],
      };
      renderWithRouter(<SongCard song={songWithManyThemes} />);
      
      expect(screen.getByText("+2")).toBeInTheDocument();
    });

    it("formats large view counts correctly", () => {
      const popularSong = { ...mockSong, viewCount: 45000 };
      renderWithRouter(<SongCard song={popularSong} />);
      
      expect(screen.getByText("45.0k")).toBeInTheDocument();
    });

    it("handles song without lastUsed date", () => {
      const songWithoutLastUsed = { ...mockSong, lastUsed: undefined };
      renderWithRouter(<SongCard song={songWithoutLastUsed} />);
      
      expect(screen.queryByText(/Used/)).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper link to song detail page", () => {
      renderWithRouter(<SongCard song={mockSong} />);
      
      const links = screen.getAllByRole("link");
      const mainLink = links.find(link => 
        link.getAttribute("href") === "/songs/amazing-grace-jn-4k7p2"
      );
      
      expect(mainLink).toBeInTheDocument();
    });

    it("has accessible button elements", () => {
      renderWithRouter(<SongCard song={mockSong} />);
      
      expect(screen.getByTestId("heart-icon").closest("button")).toBeInTheDocument();
      expect(screen.getByTestId("more-horizontal-icon").closest("button")).toBeInTheDocument();
    });
  });
});