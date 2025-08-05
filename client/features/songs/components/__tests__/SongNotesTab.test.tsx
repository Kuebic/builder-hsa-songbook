import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SongNotesTab from "../SongNotesTab";
import { useAuthContext } from "@/shared/contexts/AuthContext";
import { useVersesBySong, useSubmitVerse, useUpvoteVerse } from "../../hooks/useVerses";

// Mock hooks
vi.mock("@/shared/contexts/AuthContext", () => ({
  useAuthContext: vi.fn(),
}));

vi.mock("../../hooks/useVerses", () => ({
  useVersesBySong: vi.fn(),
  useSubmitVerse: vi.fn(),
  useUpvoteVerse: vi.fn(),
}));

// Lucide icons are mocked globally in test setup

// Mock UI components
vi.mock("@/components/ui/card", () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>,
  CardContent: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/components/ui/skeleton", () => ({
  Skeleton: ({ className }: any) => <div className={className} data-testid="skeleton" />,
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: any) => open ? <div>{children}</div> : null,
  DialogTrigger: ({ children }: any) => <div>{children}</div>,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
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

describe("SongNotesTab", () => {
  const mockCurrentUser = { _id: "user123", name: "Test User" };
  const mockVerses = [
    {
      id: "verse1",
      reference: "John 3:16",
      text: "For God so loved the world...",
      submittedBy: { id: "user456", name: "Other User", email: "other@test.com" },
      upvoteCount: 5,
      hasUpvoted: false,
      status: "approved" as const,
      createdAt: "2024-01-01T00:00:00Z",
    },
    {
      id: "verse2",
      reference: "Psalm 23:1",
      text: "The Lord is my shepherd...",
      submittedBy: { id: "user123", name: "Test User", email: "test@test.com" },
      upvoteCount: 3,
      hasUpvoted: true,
      status: "approved" as const,
      createdAt: "2024-01-02T00:00:00Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthContext as any).mockReturnValue({
      currentUser: mockCurrentUser,
      isAuthenticated: true,
    });
    (useSubmitVerse as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    (useUpvoteVerse as any).mockReturnValue({
      mutate: vi.fn(),
    });
  });

  describe("Loading State", () => {
    it("should show loading skeletons while fetching", () => {
      (useVersesBySong as any).mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      render(
        <SongNotesTab songId="song123" songTitle="Amazing Grace" />,
        { wrapper: createWrapper() }
      );

      expect(screen.getAllByTestId("skeleton")).toHaveLength(3);
    });
  });

  describe("Song Notes Section", () => {
    it("should display song notes when available", () => {
      (useVersesBySong as any).mockReturnValue({
        data: { verses: mockVerses },
        isLoading: false,
        error: null,
      });

      render(
        <SongNotesTab 
          songId="song123" 
          songTitle="Amazing Grace"
          songNotes="This hymn was written in 1772."
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText("Song Notes")).toBeInTheDocument();
      expect(screen.getByText("This hymn was written in 1772.")).toBeInTheDocument();
    });

    it("should not show song notes section when notes are empty", () => {
      (useVersesBySong as any).mockReturnValue({
        data: { verses: mockVerses },
        isLoading: false,
        error: null,
      });

      render(
        <SongNotesTab songId="song123" songTitle="Amazing Grace" />,
        { wrapper: createWrapper() }
      );

      expect(screen.queryByText("Song Notes")).not.toBeInTheDocument();
    });
  });

  describe("Bible Verses Section", () => {
    it("should display bible verses", () => {
      (useVersesBySong as any).mockReturnValue({
        data: { verses: mockVerses },
        isLoading: false,
        error: null,
      });

      render(
        <SongNotesTab songId="song123" songTitle="Amazing Grace" />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText("Related Bible Verses")).toBeInTheDocument();
      expect(screen.getByText("John 3:16")).toBeInTheDocument();
      expect(screen.getByText("For God so loved the world...")).toBeInTheDocument();
      expect(screen.getByText("Psalm 23:1")).toBeInTheDocument();
      expect(screen.getByText("The Lord is my shepherd...")).toBeInTheDocument();
    });

    it("should show empty state when no verses", () => {
      (useVersesBySong as any).mockReturnValue({
        data: { verses: [] },
        isLoading: false,
        error: null,
      });

      render(
        <SongNotesTab songId="song123" songTitle="Amazing Grace" />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText("No verses submitted yet")).toBeInTheDocument();
      expect(screen.getByText("Be the first to add a related Bible verse!")).toBeInTheDocument();
    });

    it("should display upvote counts", () => {
      (useVersesBySong as any).mockReturnValue({
        data: { verses: mockVerses },
        isLoading: false,
        error: null,
      });

      render(
        <SongNotesTab songId="song123" songTitle="Amazing Grace" />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText("5")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
    });
  });

  describe("Verse Submission", () => {
    it("should open dialog when add verse button is clicked", async () => {
      (useVersesBySong as any).mockReturnValue({
        data: { verses: [] },
        isLoading: false,
        error: null,
      });

      render(
        <SongNotesTab songId="song123" songTitle="Amazing Grace" />,
        { wrapper: createWrapper() }
      );

      const addButton = screen.getByText("Add Verse");
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText("Submit a Bible Verse")).toBeInTheDocument();
        expect(screen.getByText(/Add a Bible verse that relates to/)).toBeInTheDocument();
      });
    });

    it("should submit verse with valid data", async () => {
      const mockSubmit = vi.fn();
      (useSubmitVerse as any).mockReturnValue({
        mutate: mockSubmit,
        isPending: false,
      });
      (useVersesBySong as any).mockReturnValue({
        data: { verses: [] },
        isLoading: false,
        error: null,
      });

      render(
        <SongNotesTab songId="song123" songTitle="Amazing Grace" />,
        { wrapper: createWrapper() }
      );

      // Open dialog
      fireEvent.click(screen.getByText("Add Verse"));

      // Fill form
      const referenceInput = screen.getByLabelText(/Reference/);
      const textInput = screen.getByLabelText(/Verse Text/);
      
      fireEvent.change(referenceInput, { target: { value: "Romans 8:28" } });
      fireEvent.change(textInput, { target: { value: "And we know that all things work together..." } });

      // Submit
      const submitButton = screen.getByText("Submit");
      fireEvent.click(submitButton);

      expect(mockSubmit).toHaveBeenCalledWith({
        songId: "song123",
        reference: "Romans 8:28",
        text: "And we know that all things work together...",
        userId: "user123",
      });
    });

    it("should require authentication to submit", () => {
      (useAuthContext as any).mockReturnValue({
        currentUser: null,
        isAuthenticated: false,
      });
      (useVersesBySong as any).mockReturnValue({
        data: { verses: [] },
        isLoading: false,
        error: null,
      });

      render(
        <SongNotesTab songId="song123" songTitle="Amazing Grace" />,
        { wrapper: createWrapper() }
      );

      const addButton = screen.getByText("Add Verse");
      fireEvent.click(addButton);

      // Dialog should not open
      expect(screen.queryByText("Submit a Bible Verse")).not.toBeInTheDocument();
    });
  });

  describe("Verse Upvoting", () => {
    it("should upvote verse when button clicked", async () => {
      const mockUpvote = vi.fn();
      (useUpvoteVerse as any).mockReturnValue({
        mutate: mockUpvote,
      });
      (useVersesBySong as any).mockReturnValue({
        data: { verses: mockVerses },
        isLoading: false,
        error: null,
      });

      render(
        <SongNotesTab songId="song123" songTitle="Amazing Grace" />,
        { wrapper: createWrapper() }
      );

      const upvoteButtons = screen.getAllByRole("button", { name: /upvote/i });
      fireEvent.click(upvoteButtons[0]);

      expect(mockUpvote).toHaveBeenCalledWith({
        verseId: "verse1",
        userId: "user123",
      });
    });

    it("should show filled icon for upvoted verses", () => {
      (useVersesBySong as any).mockReturnValue({
        data: { verses: mockVerses },
        isLoading: false,
        error: null,
      });

      render(
        <SongNotesTab songId="song123" songTitle="Amazing Grace" />,
        { wrapper: createWrapper() }
      );

      const upvoteIcons = screen.getAllByTestId("thumbs-up-icon");
      expect(upvoteIcons[0]).toHaveAttribute("data-fill", "none");
      expect(upvoteIcons[1]).toHaveAttribute("data-fill", "currentColor");
    });
  });

  describe("Status Indicators", () => {
    it("should show status badges for non-approved verses", () => {
      const versesWithStatus = [
        {
          ...mockVerses[0],
          status: "pending" as const,
        },
        {
          ...mockVerses[1],
          status: "rejected" as const,
          rejectionReason: "Not relevant to the song",
        },
      ];

      (useVersesBySong as any).mockReturnValue({
        data: { verses: versesWithStatus },
        isLoading: false,
        error: null,
      });

      render(
        <SongNotesTab songId="song123" songTitle="Amazing Grace" />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText("Pending")).toBeInTheDocument();
      expect(screen.getByText("Rejected")).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("should show error state when loading fails", () => {
      (useVersesBySong as any).mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error("Failed to load verses"),
      });

      render(
        <SongNotesTab songId="song123" songTitle="Amazing Grace" />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText("Failed to load verses")).toBeInTheDocument();
      expect(screen.getByText("Try Again")).toBeInTheDocument();
    });

    it("should refetch on retry button click", () => {
      const mockRefetch = vi.fn();
      (useVersesBySong as any).mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error("Failed to load verses"),
        refetch: mockRefetch,
      });

      render(
        <SongNotesTab songId="song123" songTitle="Amazing Grace" />,
        { wrapper: createWrapper() }
      );

      const retryButton = screen.getByText("Try Again");
      fireEvent.click(retryButton);

      expect(mockRefetch).toHaveBeenCalled();
    });
  });
});