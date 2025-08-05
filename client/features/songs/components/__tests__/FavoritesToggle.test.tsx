import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import FavoritesToggle from "../FavoritesToggle";
import { useCheckFavorite, useAddFavorite, useRemoveFavorite } from "../../hooks/useFavorites";
import { useUserId } from "@/shared/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

// Mock the auth hooks
vi.mock("@/shared/hooks/useAuth", () => ({
  useUserId: vi.fn(),
}));

// Mock the favorites hooks
vi.mock("../../hooks/useFavorites", () => ({
  useCheckFavorite: vi.fn(),
  useAddFavorite: vi.fn(),
  useRemoveFavorite: vi.fn(),
}));

// Mock lucide icons
vi.mock("lucide-react", () => ({
  Heart: ({ className }: any) => (
    <div 
      data-testid="heart-icon" 
      className={className}
    />
  ),
}));

// Mock toast
vi.mock("@/hooks/use-toast", () => ({
  useToast: vi.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("FavoritesToggle", () => {
  const mockAddFavorite = vi.fn();
  const mockRemoveFavorite = vi.fn();
  const mockToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock useUserId
    (useUserId as any).mockReturnValue("user123");
    
    // Mock useToast
    (useToast as any).mockReturnValue({ toast: mockToast });
    
    // Default mock for mutations
    (useAddFavorite as any).mockReturnValue({
      mutateAsync: mockAddFavorite,
      isPending: false,
    });
    
    (useRemoveFavorite as any).mockReturnValue({
      mutateAsync: mockRemoveFavorite,
      isPending: false,
    });
  });

  describe("Song Favorites", () => {
    it("should render unfilled heart when not favorited", () => {
      // Mock not favorited state
      (useCheckFavorite as any).mockReturnValue({
        data: { isFavorite: false },
        isLoading: false,
      });

      render(
        <FavoritesToggle
          type="song"
          itemId="song123"
          itemName="Amazing Grace"
        />,
        { wrapper: createWrapper() }
      );

      const heartIcon = screen.getByTestId("heart-icon");
      expect(heartIcon).toBeInTheDocument();
      // Check if heart is not filled by checking the class
      expect(heartIcon).not.toHaveClass("fill-current");
    });

    it("should render filled heart when favorited", () => {
      // Mock favorited state
      (useCheckFavorite as any).mockReturnValue({
        data: { isFavorite: true },
        isLoading: false,
      });

      render(
        <FavoritesToggle
          type="song"
          itemId="song123"
          itemName="Amazing Grace"
        />,
        { wrapper: createWrapper() }
      );

      const heartIcon = screen.getByTestId("heart-icon");
      expect(heartIcon).toHaveClass("fill-current");
    });

    it("should add favorite on click when not favorited", async () => {
      // Mock not favorited state
      (useCheckFavorite as any).mockReturnValue({
        data: { isFavorite: false },
        isLoading: false,
      });

      render(
        <FavoritesToggle
          type="song"
          itemId="song123"
          itemName="Amazing Grace"
        />,
        { wrapper: createWrapper() }
      );

      const button = screen.getByRole("button");
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockAddFavorite).toHaveBeenCalledWith({
          type: "song",
          itemId: "song123",
          userId: "user123",
        });
        expect(mockToast).toHaveBeenCalledWith({
          title: "Added to favorites",
          description: "Amazing Grace has been added to your favorites",
        });
      });
    });

    it("should remove favorite on click when favorited", async () => {
      // Mock favorited state
      (useCheckFavorite as any).mockReturnValue({
        data: { isFavorite: true },
        isLoading: false,
      });

      render(
        <FavoritesToggle
          type="song"
          itemId="song123"
          itemName="Amazing Grace"
        />,
        { wrapper: createWrapper() }
      );

      const button = screen.getByRole("button");
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockRemoveFavorite).toHaveBeenCalledWith({
          type: "song",
          itemId: "song123",
          userId: "user123",
        });
        expect(mockToast).toHaveBeenCalledWith({
          title: "Removed from favorites",
          description: "Amazing Grace has been removed from your favorites",
        });
      });
    });

    it("should show login prompt when not authenticated", async () => {
      // Mock no user
      (useUserId as any).mockReturnValue(null);
      
      (useCheckFavorite as any).mockReturnValue({
        data: { isFavorite: false },
        isLoading: false,
      });

      render(
        <FavoritesToggle
          type="song"
          itemId="song123"
          itemName="Amazing Grace"
        />,
        { wrapper: createWrapper() }
      );

      const button = screen.getByRole("button");
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockAddFavorite).not.toHaveBeenCalled();
        expect(mockToast).toHaveBeenCalledWith({
          title: "Authentication required",
          description: "Please sign in to save songs to your favorites",
          variant: "default",
        });
      });
    });

    it("should disable button while loading", () => {
      (useCheckFavorite as any).mockReturnValue({
        data: { isFavorite: false },
        isLoading: true,
      });

      render(
        <FavoritesToggle
          type="song"
          itemId="song123"
          itemName="Amazing Grace"
        />,
        { wrapper: createWrapper() }
      );

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });

    it("should disable button while mutation is pending", () => {
      (useCheckFavorite as any).mockReturnValue({
        data: { isFavorite: false },
        isLoading: false,
      });
      
      (useAddFavorite as any).mockReturnValue({
        mutateAsync: mockAddFavorite,
        isPending: true,
      });

      render(
        <FavoritesToggle
          type="song"
          itemId="song123"
          itemName="Amazing Grace"
        />,
        { wrapper: createWrapper() }
      );

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });

    it("should respect size prop", () => {
      (useCheckFavorite as any).mockReturnValue({
        data: { isFavorite: false },
        isLoading: false,
      });

      const { rerender } = render(
        <FavoritesToggle
          type="song"
          itemId="song123"
          itemName="Amazing Grace"
          size="sm"
        />,
        { wrapper: createWrapper() }
      );

      let heartIcon = screen.getByTestId("heart-icon");
      expect(heartIcon).toHaveClass("h-3", "w-3");

      rerender(
        <FavoritesToggle
          type="song"
          itemId="song123"
          itemName="Amazing Grace"
          size="lg"
        />
      );

      heartIcon = screen.getByTestId("heart-icon");
      expect(heartIcon).toHaveClass("h-5", "w-5");
    });

    it("should respect variant prop", () => {
      (useCheckFavorite as any).mockReturnValue({
        data: { isFavorite: false },
        isLoading: false,
      });

      render(
        <FavoritesToggle
          type="song"
          itemId="song123"
          itemName="Amazing Grace"
          variant="outline"
        />,
        { wrapper: createWrapper() }
      );

      const button = screen.getByRole("button");
      // Check that button has styling related to outline variant
      expect(button.className).toContain("border");
    });

    it("should show label when showLabel is true", () => {
      (useCheckFavorite as any).mockReturnValue({
        data: { isFavorite: false },
        isLoading: false,
      });

      render(
        <FavoritesToggle
          type="song"
          itemId="song123"
          itemName="Amazing Grace"
          showLabel={true}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText("Favorite")).toBeInTheDocument();
    });

    it("should show 'Favorited' label when favorited and showLabel is true", () => {
      (useCheckFavorite as any).mockReturnValue({
        data: { isFavorite: true },
        isLoading: false,
      });

      render(
        <FavoritesToggle
          type="song"
          itemId="song123"
          itemName="Amazing Grace"
          showLabel={true}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText("Favorited")).toBeInTheDocument();
    });

    it("should call onToggle callback when provided", async () => {
      const mockOnToggle = vi.fn();
      
      (useCheckFavorite as any).mockReturnValue({
        data: { isFavorite: false },
        isLoading: false,
      });

      render(
        <FavoritesToggle
          type="song"
          itemId="song123"
          itemName="Amazing Grace"
          onToggle={mockOnToggle}
        />,
        { wrapper: createWrapper() }
      );

      const button = screen.getByRole("button");
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockOnToggle).toHaveBeenCalledWith(true);
      });
    });
  });

  describe("Arrangement Favorites", () => {
    it("should handle arrangement type correctly", async () => {
      (useCheckFavorite as any).mockReturnValue({
        data: { isFavorite: false },
        isLoading: false,
      });

      render(
        <FavoritesToggle
          type="arrangement"
          itemId="arr123"
          itemName="Acoustic Version"
        />,
        { wrapper: createWrapper() }
      );

      const button = screen.getByRole("button");
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockAddFavorite).toHaveBeenCalledWith({
          type: "arrangement",
          itemId: "arr123",
          userId: "user123",
        });
        expect(mockToast).toHaveBeenCalledWith({
          title: "Added to favorites",
          description: "Acoustic Version has been added to your favorites",
        });
      });
    });

    it("should show correct message for arrangement authentication", async () => {
      (useUserId as any).mockReturnValue(null);
      
      (useCheckFavorite as any).mockReturnValue({
        data: { isFavorite: false },
        isLoading: false,
      });

      render(
        <FavoritesToggle
          type="arrangement"
          itemId="arr123"
          itemName="Acoustic Version"
        />,
        { wrapper: createWrapper() }
      );

      const button = screen.getByRole("button");
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Authentication required",
          description: "Please sign in to save arrangements to your favorites",
          variant: "default",
        });
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle add favorite error", async () => {
      const errorMessage = "Failed to add favorite";
      mockAddFavorite.mockRejectedValueOnce(new Error(errorMessage));
      
      (useCheckFavorite as any).mockReturnValue({
        data: { isFavorite: false },
        isLoading: false,
      });

      render(
        <FavoritesToggle
          type="song"
          itemId="song123"
          itemName="Amazing Grace"
        />,
        { wrapper: createWrapper() }
      );

      const button = screen.getByRole("button");
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Failed to update favorites",
          description: errorMessage,
          variant: "destructive",
        });
      });
    });

    it("should handle remove favorite error", async () => {
      const errorMessage = "Failed to remove favorite";
      mockRemoveFavorite.mockRejectedValueOnce(new Error(errorMessage));
      
      (useCheckFavorite as any).mockReturnValue({
        data: { isFavorite: true },
        isLoading: false,
      });

      render(
        <FavoritesToggle
          type="song"
          itemId="song123"
          itemName="Amazing Grace"
        />,
        { wrapper: createWrapper() }
      );

      const button = screen.getByRole("button");
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Failed to update favorites",
          description: errorMessage,
          variant: "destructive",
        });
      });
    });
  });

  describe("Accessibility", () => {
    it("should have appropriate title attribute when not favorited", () => {
      (useCheckFavorite as any).mockReturnValue({
        data: { isFavorite: false },
        isLoading: false,
      });

      render(
        <FavoritesToggle
          type="song"
          itemId="song123"
          itemName="Amazing Grace"
        />,
        { wrapper: createWrapper() }
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("title", "Add to favorite songs");
    });

    it("should have appropriate title attribute when favorited", () => {
      (useCheckFavorite as any).mockReturnValue({
        data: { isFavorite: true },
        isLoading: false,
      });

      render(
        <FavoritesToggle
          type="song"
          itemId="song123"
          itemName="Amazing Grace"
        />,
        { wrapper: createWrapper() }
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("title", "Remove from favorite songs");
    });
  });
});