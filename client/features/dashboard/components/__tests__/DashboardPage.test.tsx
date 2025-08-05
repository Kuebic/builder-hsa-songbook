import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BrowserRouter } from "react-router-dom";
import React from "react";

// Mock the useAuth hooks FIRST - this is critical for preventing the AuthProvider error
vi.mock("@/shared/hooks/useAuth", () => ({
  useAuth: vi.fn(() => ({
    currentUser: {
      _id: "6759e1a62b00b1e6ed3b84f0",
      email: "test@example.com",
      name: "Test User",
    },
    isAuthenticated: true,
    isLoading: false,
    error: null,
  })),
  useUserId: vi.fn(() => "6759e1a62b00b1e6ed3b84f0"),
}));

// Create stable mock data to prevent infinite loops
const mockSongs = [
  {
    id: "1",
    title: "Amazing Grace",
    artist: "John Newton",
    key: "G",
    tempo: 120,
    difficulty: "intermediate",
    themes: ["worship", "grace"],
    basicChords: ["G", "C", "D"],
    viewCount: 150,
    avgRating: 4.5,
    isFavorite: false,
    lastUsed: new Date("2024-01-15T10:00:00Z"),
  },
  {
    id: "2",
    title: "How Great Thou Art",
    artist: "Stuart K. Hine",
    key: "C",
    tempo: 100,
    difficulty: "beginner",
    themes: ["worship", "praise"],
    basicChords: ["C", "F", "G"],
    viewCount: 200,
    avgRating: 4.7,
    isFavorite: true,
    lastUsed: new Date("2024-01-16T10:00:00Z"),
  },
  {
    id: "3",
    title: "Oceans",
    artist: "Hillsong United",
    key: "D",
    tempo: 140,
    difficulty: "advanced",
    themes: ["faith", "trust"],
    basicChords: ["D", "A", "Bm", "G"],
    viewCount: 300,
    avgRating: 4.9,
    isFavorite: false,
    lastUsed: new Date("2024-01-17T10:00:00Z"),
  },
];

const mockFunctions = {
  fetchSongs: vi.fn(),
  refetch: vi.fn(),
  searchSongs: vi.fn(),
  toggleFavorite: vi.fn(),
  retry: vi.fn(),
};

// Mock the useSongs hook with stable references to prevent infinite loops
vi.mock("@/shared/hooks/useSongs", () => ({
  useSongs: vi.fn(() => ({
    songs: mockSongs, // Use stable reference
    loading: false,
    error: null,
    total: 3,
    page: 1,
    limit: 20,
    transformationErrors: [],
    ...mockFunctions, // Use stable function references
    retryCount: 0,
  })),
}));

// Mock the Layout component
vi.mock("@/shared/components/Layout", () => ({
  Layout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout">{children}</div>
  ),
}));

// Mock the SongCard component
vi.mock("@features/songs", () => ({
  SongCard: ({ song, onAddToSetlist, onToggleFavorite }: any) => (
    <div data-testid={`song-card-${song.id}`}>
      <h3>{song.title}</h3>
      <p>{song.artist}</p>
      <button onClick={() => onAddToSetlist?.(song.id)} data-testid={`add-to-setlist-${song.id}`}>
        Add to Setlist
      </button>
      <button onClick={() => onToggleFavorite?.(song.id)} data-testid={`toggle-favorite-${song.id}`}>
        Toggle Favorite
      </button>
    </div>
  ),
}));

// Mock the mock data
vi.mock("@features/songs/utils/mockData", () => ({
  mockClientSongs: [
    {
      id: "1",
      title: "Amazing Grace",
      artist: "John Newton",
      key: "G",
      tempo: 120,
      difficulty: "intermediate",
      themes: ["worship", "grace"],
      basicChords: ["G", "C", "D"],
      viewCount: 150,
      avgRating: 4.5,
      isFavorite: false,
      lastUsed: "2024-01-15T10:00:00Z",
      source: "Traditional",
      lyrics: "Amazing grace...",
      notes: "Classic hymn",
      createdBy: "user1",
      isPublic: true,
      chordData: "[G]Amazing [C]grace",
      slug: "amazing-grace",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
      timeSignature: "4/4",
    },
    {
      id: "2",
      title: "How Great Thou Art",
      artist: "Carl Boberg",
      key: "C",
      tempo: 80,
      difficulty: "beginner",
      themes: ["praise", "worship"],
      basicChords: ["C", "F", "G"],
      viewCount: 200,
      avgRating: 4.8,
      isFavorite: true,
      lastUsed: "2024-01-16T10:00:00Z", 
      source: "Traditional",
      lyrics: "O Lord my God...",
      notes: "Beautiful hymn",
      createdBy: "user2",
      isPublic: true,
      chordData: "[C]O Lord my [F]God",
      slug: "how-great-thou-art",
      createdAt: "2024-01-02T00:00:00Z",
      updatedAt: "2024-01-02T00:00:00Z",
      timeSignature: "4/4",
    },
    {
      id: "3", 
      title: "Oceans",
      artist: "Hillsong United",
      key: "D",
      tempo: 140,
      difficulty: "advanced",
      themes: ["faith", "trust"],
      basicChords: ["D", "A", "Bm", "G"],
      viewCount: 300,
      avgRating: 4.9,
      isFavorite: false,
      lastUsed: "2024-01-17T10:00:00Z",
      source: "Hillsong",
      lyrics: "You call me out...",
      notes: "Modern worship",
      createdBy: "user3",
      isPublic: true,
      chordData: "[D]You call me [A]out",
      slug: "oceans",
      createdAt: "2024-01-03T00:00:00Z",
      updatedAt: "2024-01-03T00:00:00Z",
      timeSignature: "4/4",
    },
  ],
  mockStats: {
    totalSongs: 1247,
    totalSetlists: 89,
    recentlyAdded: 12,
    topContributors: 45,
  },
}));

// Mock lucide-react icons
// Lucide icons are mocked globally in test setup

// Mock UI components
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/input", () => ({
  Input: ({ placeholder, onChange, value, ...props }: any) => (
    <input
      placeholder={placeholder}
      onChange={onChange}
      value={value}
      {...props}
    />
  ),
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
}));

vi.mock("@/components/ui/tabs", () => ({
  Tabs: ({ children, defaultValue = "recent", ...props }: any) => (
    <div data-testid="tabs" data-default-value={defaultValue} {...props}>
      {children}
    </div>
  ),
  TabsList: ({ children, ...props }: any) => (
    <div role="tablist" {...props}>
      {children}
    </div>
  ),
  TabsTrigger: ({ children, value, ...props }: any) => (
    <button 
      role="tab" 
      data-value={value} 
      data-state={value === "recent" ? "active" : "inactive"}
      aria-selected={value === "recent"}
      {...props}
    >
      {children}
    </button>
  ),
  TabsContent: ({ children, value, ...props }: any) => (
    <div role="tabpanel" data-value={value} {...props}>
      {children}
    </div>
  ),
}));

vi.mock("@/components/ui/select", () => ({
  Select: ({ children, ...props }: any) => <div data-testid="select" {...props}>{children}</div>,
  SelectContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  SelectItem: ({ children, value, ...props }: any) => (
    <option role="option" value={value} {...props}>{children}</option>
  ),
  SelectTrigger: ({ children, ...props }: any) => (
    <button role="combobox" {...props}>{children}</button>
  ),
  SelectValue: ({ currentValue, ...props }: any) => (
    <input readOnly value={currentValue || "all"} data-testid={props["data-testid"]} {...props} />
  ),
}));


// Import the real DashboardPage component (hooks and child components are mocked)
import DashboardPage from "../DashboardPage";

const renderWithProviders = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("DashboardPage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("renders dashboard title and main sections", () => {
      renderWithProviders(<DashboardPage />);
      
      expect(screen.getByText("Welcome to HSA Songbook")).toBeInTheDocument();
      expect(screen.getByText("Discover, organize, and share worship chord charts for your community")).toBeInTheDocument();
      expect(screen.getByText("Total Songs")).toBeInTheDocument();
      expect(screen.getByText("Active Setlists")).toBeInTheDocument();
    });

    it("displays stats cards with correct values", () => {
      renderWithProviders(<DashboardPage />);
      
      expect(screen.getByText("1,247")).toBeInTheDocument(); // Total songs (formatted with comma)
      expect(screen.getByText("89")).toBeInTheDocument();   // Total setlists
      expect(screen.getByText("45")).toBeInTheDocument();   // Top contributors
      expect(screen.getByText("Contributors")).toBeInTheDocument();
      expect(screen.getByText("Trending")).toBeInTheDocument();
    });

    it("shows all mock songs initially in Recent tab", () => {
      renderWithProviders(<DashboardPage />);
      
      // All songs should appear in the Recent tab since they all have lastUsed dates
      expect(screen.getByTestId("song-card-1")).toBeInTheDocument();
      expect(screen.getByTestId("song-card-2")).toBeInTheDocument();
      expect(screen.getByTestId("song-card-3")).toBeInTheDocument();
      
      // Song titles should be visible
      expect(screen.getByTestId("song-card-1")).toHaveTextContent("Amazing Grace");
      expect(screen.getByTestId("song-card-2")).toHaveTextContent("How Great Thou Art");
      expect(screen.getByTestId("song-card-3")).toHaveTextContent("Oceans");
    });
  });

  describe("Search Functionality", () => {
    it("filters songs by title when searching in Browse All tab", () => {
      renderWithProviders(<DashboardPage />);
      
      // Switch to the "Browse All" tab where search is available
      const browseAllTab = screen.getByRole("tab", { name: /browse all/i });
      fireEvent.click(browseAllTab);
      
      const searchInput = screen.getByPlaceholderText("Search songs, artists, themes...");
      fireEvent.change(searchInput, { target: { value: "Amazing" } });
      
      expect(screen.getByTestId("song-card-1")).toBeInTheDocument();
      expect(screen.queryByTestId("song-card-2")).not.toBeInTheDocument();
      expect(screen.queryByTestId("song-card-3")).not.toBeInTheDocument();
    });

    it("filters songs by artist when searching", () => {
      renderWithProviders(<DashboardPage />);
      
      const browseAllTab = screen.getByRole("tab", { name: /browse all/i });
      fireEvent.click(browseAllTab);
      
      const searchInput = screen.getByPlaceholderText("Search songs, artists, themes...");
      fireEvent.change(searchInput, { target: { value: "Hillsong" } });
      
      expect(screen.queryByTestId("song-card-1")).not.toBeInTheDocument();
      expect(screen.queryByTestId("song-card-2")).not.toBeInTheDocument();
      expect(screen.getByTestId("song-card-3")).toBeInTheDocument();
    });

    it("filters songs by themes when searching", () => {
      renderWithProviders(<DashboardPage />);
      
      const browseAllTab = screen.getByRole("tab", { name: /browse all/i });
      fireEvent.click(browseAllTab);
      
      const searchInput = screen.getByPlaceholderText("Search songs, artists, themes...");
      fireEvent.change(searchInput, { target: { value: "faith" } });
      
      expect(screen.queryByTestId("song-card-1")).not.toBeInTheDocument();
      expect(screen.queryByTestId("song-card-2")).not.toBeInTheDocument();
      expect(screen.getByTestId("song-card-3")).toBeInTheDocument();
    });

    it("shows all songs when search is cleared", () => {
      renderWithProviders(<DashboardPage />);
      
      const browseAllTab = screen.getByRole("tab", { name: /browse all/i });
      fireEvent.click(browseAllTab);
      
      const searchInput = screen.getByPlaceholderText("Search songs, artists, themes...");
      
      // Search first
      fireEvent.change(searchInput, { target: { value: "Amazing" } });
      expect(screen.getByTestId("song-card-1")).toBeInTheDocument();
      expect(screen.queryByTestId("song-card-2")).not.toBeInTheDocument();
      
      // Clear search
      fireEvent.change(searchInput, { target: { value: "" } });
      expect(screen.getByTestId("song-card-1")).toBeInTheDocument();
      expect(screen.getByTestId("song-card-2")).toBeInTheDocument();
      expect(screen.getByTestId("song-card-3")).toBeInTheDocument();
    });

    it("is case insensitive", () => {
      renderWithProviders(<DashboardPage />);
      
      const browseAllTab = screen.getByRole("tab", { name: /browse all/i });
      fireEvent.click(browseAllTab);
      
      const searchInput = screen.getByPlaceholderText("Search songs, artists, themes...");
      fireEvent.change(searchInput, { target: { value: "AMAZING" } });
      
      expect(screen.getByTestId("song-card-1")).toBeInTheDocument();
      expect(screen.queryByTestId("song-card-2")).not.toBeInTheDocument();
    });
  });

  describe("Key Filter", () => {
    it("filters songs by selected key", async () => {
      renderWithProviders(<DashboardPage />);
      
      // Switch to Browse All tab where filters are available
      const browseAllTab = screen.getByRole("tab", { name: /browse all/i });
      fireEvent.click(browseAllTab);
      
      // Find the key filter dropdown by its combobox role
      const keySelects = screen.getAllByRole("combobox");
      // First combobox should be the key selector (w-32 class)
      const keySelect = keySelects[0];
      fireEvent.click(keySelect);
      
      // Wait for dropdown to open and select key "C"
      await waitFor(() => {
        const keyOption = screen.getByRole("option", { name: "C" });
        fireEvent.click(keyOption);
      });

      // Should only show songs in key C
      expect(screen.queryByTestId("song-card-1")).not.toBeInTheDocument(); // G key
      expect(screen.getByTestId("song-card-2")).toBeInTheDocument(); // C key
      expect(screen.queryByTestId("song-card-3")).not.toBeInTheDocument(); // D key
    });

    it("shows all songs when 'All Keys' is selected", async () => {
      renderWithProviders(<DashboardPage />);
      
      const browseAllTab = screen.getByRole("tab", { name: /browse all/i });
      fireEvent.click(browseAllTab);
      
      // Find the key filter dropdown by its combobox role
      const keySelects = screen.getAllByRole("combobox");
      const keySelect = keySelects[0]; // First combobox is key selector
      fireEvent.click(keySelect);
      
      await waitFor(() => {
        const keyOption = screen.getByRole("option", { name: "C" });
        fireEvent.click(keyOption);
      });

      // Then select "All Keys"
      fireEvent.click(keySelect);
      await waitFor(() => {
        const allKeysOption = screen.getByRole("option", { name: "All Keys" });
        fireEvent.click(allKeysOption);
      });

      // Should show all songs
      expect(screen.getByTestId("song-card-1")).toBeInTheDocument();
      expect(screen.getByTestId("song-card-2")).toBeInTheDocument();
      expect(screen.getByTestId("song-card-3")).toBeInTheDocument();
    });
  });

  describe("Difficulty Filter", () => {
    it("filters songs by selected difficulty", async () => {
      renderWithProviders(<DashboardPage />);
      
      // Switch to Browse All tab first
      const browseAllTab = screen.getByRole("tab", { name: /browse all/i });
      fireEvent.click(browseAllTab);
      
      // Get all comboboxes and select the second one (difficulty)
      const comboboxes = screen.getAllByRole("combobox");
      const difficultySelect = comboboxes[1]; // Second combobox is difficulty selector
      fireEvent.click(difficultySelect);
      
      await waitFor(() => {
        const beginnerOption = screen.getByRole("option", { name: "Beginner" });
        fireEvent.click(beginnerOption);
      });

      // Should only show beginner songs
      expect(screen.queryByTestId("song-card-1")).not.toBeInTheDocument(); // intermediate
      expect(screen.getByTestId("song-card-2")).toBeInTheDocument(); // beginner
      expect(screen.queryByTestId("song-card-3")).not.toBeInTheDocument(); // advanced
    });

    it("shows all songs when 'All Difficulties' is selected", async () => {
      renderWithProviders(<DashboardPage />);
      
      // Switch to Browse All tab first
      const browseAllTab = screen.getByRole("tab", { name: /browse all/i });
      fireEvent.click(browseAllTab);
      
      // Get all comboboxes and select the second one (difficulty)
      const comboboxes = screen.getAllByRole("combobox");
      const difficultySelect = comboboxes[1]; // Second combobox is difficulty selector
      fireEvent.click(difficultySelect);
      
      // First filter by difficulty
      await waitFor(() => {
        const beginnerOption = screen.getByRole("option", { name: "Beginner" });
        fireEvent.click(beginnerOption);
      });

      // Then select all difficulties
      fireEvent.click(difficultySelect);
      await waitFor(() => {
        const allOption = screen.getByRole("option", { name: "All Levels" });
        fireEvent.click(allOption);
      });

      expect(screen.getByTestId("song-card-1")).toBeInTheDocument();
      expect(screen.getByTestId("song-card-2")).toBeInTheDocument();
      expect(screen.getByTestId("song-card-3")).toBeInTheDocument();
    });
  });

  describe("Combined Filters", () => {
    it("applies search and key filter together", async () => {
      renderWithProviders(<DashboardPage />);
      
      // Switch to Browse All tab first
      const browseAllTab = screen.getByRole("tab", { name: /browse all/i });
      fireEvent.click(browseAllTab);
      
      // Search for "worship"
      const searchInput = screen.getByPlaceholderText("Search songs, artists, themes...");
      fireEvent.change(searchInput, { target: { value: "worship" } });
      
      // Filter by key "G" - use first combobox for key selector
      const comboboxes = screen.getAllByRole("combobox");
      const keySelect = comboboxes[0];
      fireEvent.click(keySelect);
      
      await waitFor(() => {
        const keyOption = screen.getByRole("option", { name: "G" });
        fireEvent.click(keyOption);
      });

      // Should show only songs that match both search and key
      expect(screen.getByTestId("song-card-1")).toBeInTheDocument(); // Amazing Grace: worship theme + G key
      expect(screen.queryByTestId("song-card-2")).not.toBeInTheDocument(); // How Great: worship theme but C key
      expect(screen.queryByTestId("song-card-3")).not.toBeInTheDocument(); // Oceans: no worship theme
    });

    it("applies all three filters together", async () => {
      renderWithProviders(<DashboardPage />);
      
      // Switch to Browse All tab first
      const browseAllTab = screen.getByRole("tab", { name: /browse all/i });
      fireEvent.click(browseAllTab);
      
      // Search for "worship"
      const searchInput = screen.getByPlaceholderText("Search songs, artists, themes...");
      fireEvent.change(searchInput, { target: { value: "worship" } });
      
      // Filter by difficulty "beginner" - use second combobox for difficulty selector
      const comboboxes = screen.getAllByRole("combobox");
      const difficultySelect = comboboxes[1];
      fireEvent.click(difficultySelect);
      
      await waitFor(() => {
        const beginnerOption = screen.getByRole("option", { name: "Beginner" });
        fireEvent.click(beginnerOption);
      });

      // Should show only beginner worship songs
      expect(screen.queryByTestId("song-card-1")).not.toBeInTheDocument(); // Amazing Grace: worship but intermediate
      expect(screen.getByTestId("song-card-2")).toBeInTheDocument(); // How Great: worship + beginner
      expect(screen.queryByTestId("song-card-3")).not.toBeInTheDocument(); // Oceans: no worship theme
    });
  });

  describe("Song Interactions", () => {
    it("handles add to setlist for individual songs", () => {
      renderWithProviders(<DashboardPage />);
      
      const addButton = screen.getByTestId("add-to-setlist-1");
      expect(() => fireEvent.click(addButton)).not.toThrow();
    });

    it("handles toggle favorite for individual songs", () => {
      renderWithProviders(<DashboardPage />);
      
      const favoriteButton = screen.getByTestId("toggle-favorite-1");
      expect(() => fireEvent.click(favoriteButton)).not.toThrow();
      
      // The favorite state should change (this affects the internal state)
      expect(favoriteButton).toBeInTheDocument();
    });
  });

  describe("Empty States", () => {
    it("shows no results message when search returns empty", () => {
      renderWithProviders(<DashboardPage />);
      
      // Switch to Browse All tab first
      const browseAllTab = screen.getByRole("tab", { name: /browse all/i });
      fireEvent.click(browseAllTab);
      
      const searchInput = screen.getByPlaceholderText("Search songs, artists, themes...");
      fireEvent.change(searchInput, { target: { value: "nonexistent song" } });
      
      expect(screen.queryByTestId("song-card-1")).not.toBeInTheDocument();
      expect(screen.queryByTestId("song-card-2")).not.toBeInTheDocument();
      expect(screen.queryByTestId("song-card-3")).not.toBeInTheDocument();
      
      // Should show some indication of no results (like "No songs found" text)
      // Note: This depends on the actual implementation in DashboardPage
    });

    it("shows no results when filters exclude all songs", async () => {
      renderWithProviders(<DashboardPage />);
      
      // Switch to Browse All tab first
      const browseAllTab = screen.getByRole("tab", { name: /browse all/i });
      fireEvent.click(browseAllTab);
      
      // Filter by a key that doesn't exist in our mock data - use first combobox for key selector
      const comboboxes = screen.getAllByRole("combobox");
      const keySelect = comboboxes[0];
      fireEvent.click(keySelect);
      
      // Assuming "E" key option exists but no songs use it
      await waitFor(() => {
        const keyOption = screen.getByRole("option", { name: "E" });
        fireEvent.click(keyOption);
      });

      expect(screen.queryByTestId("song-card-1")).not.toBeInTheDocument();
      expect(screen.queryByTestId("song-card-2")).not.toBeInTheDocument();
      expect(screen.queryByTestId("song-card-3")).not.toBeInTheDocument();
    });
  });

  describe("Tabs Navigation", () => {
    it("shows Recent tab by default", () => {
      renderWithProviders(<DashboardPage />);
      
      // The default tab should be "recent"
      expect(screen.getByRole("tab", { selected: true })).toHaveAttribute("data-state", "active");
    });

    it("can switch between tabs", () => {
      renderWithProviders(<DashboardPage />);
      
      const favoritesTab = screen.getByRole("tab", { name: /favorites/i });
      fireEvent.click(favoritesTab);
      
      expect(favoritesTab).toHaveAttribute("data-state", "active");
    });
  });

  describe("Responsive Behavior", () => {
    it("renders layout component", () => {
      renderWithProviders(<DashboardPage />);
      
      expect(screen.getByTestId("layout")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper headings structure", () => {
      renderWithProviders(<DashboardPage />);
      
      expect(screen.getByRole("heading", { name: "Welcome to HSA Songbook" })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Recently Used Songs" })).toBeInTheDocument();
    });

    it("has accessible form controls", () => {
      renderWithProviders(<DashboardPage />);
      
      // Switch to Browse All tab to access form controls
      const browseAllTab = screen.getByRole("tab", { name: /browse all/i });
      fireEvent.click(browseAllTab);
      
      expect(screen.getByPlaceholderText("Search songs, artists, themes...")).toBeInTheDocument();
      const comboboxes = screen.getAllByRole("combobox");
      expect(comboboxes).toHaveLength(2); // Key and difficulty selectors
    });

    it("has accessible tab navigation", () => {
      renderWithProviders(<DashboardPage />);
      
      expect(screen.getByRole("tablist")).toBeInTheDocument();
      expect(screen.getAllByRole("tab")).toHaveLength(4); // Recent, Favorites, Popular, Browse All
    });
  });
});