import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SongNotesTab from "../SongNotesTab";
import { useAuthContext } from "@/shared/contexts/AuthContext";
import { useUserId } from "@/shared/hooks/useAuth";
import { useVerses, useSubmitVerse, useVoteVerse } from "../../hooks/useVerses";

// Mock hooks
vi.mock("@/shared/contexts/AuthContext", () => ({
  useAuthContext: vi.fn(),
}));

vi.mock("@/shared/hooks/useAuth", () => ({
  useUserId: vi.fn(),
}));

vi.mock("../../hooks/useVerses", () => ({
  useVerses: vi.fn(),
  useSubmitVerse: vi.fn(),
  useVoteVerse: vi.fn(),
}));

// Lucide icons are mocked globally in test setup

// Mock UI components
vi.mock("@/components/ui/card", () => ({
  Card: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>,
  CardContent: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/components/ui/skeleton", () => ({
  Skeleton: ({ className }: any) => (
    <div className={className} data-testid="skeleton" />
  ),
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: any) => (open ? <div>{children}</div> : null),
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

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = "TestWrapper";

  return Wrapper;
};

describe("SongNotesTab", () => {
  const mockCurrentUser = { _id: "user123", name: "Test User" };
  const mockVerses = [
    {
      id: "verse1",
      songId: "song123",
      reference: "John 3:16",
      text: "For God so loved the world...",
      type: "bible" as const,
      userId: "user456",
      userName: "Other User",
      upvotes: 5,
      downvotes: 0,
      userVote: null,
      isApproved: true,
      createdAt: new Date("2024-01-01T00:00:00Z"),
      updatedAt: new Date("2024-01-01T00:00:00Z"),
    },
    {
      id: "verse2",
      songId: "song123",
      reference: "Psalm 23:1",
      text: "The Lord is my shepherd...",
      type: "bible" as const,
      userId: "user123",
      userName: "Test User",
      upvotes: 3,
      downvotes: 0,
      userVote: "up" as const,
      isApproved: true,
      createdAt: new Date("2024-01-02T00:00:00Z"),
      updatedAt: new Date("2024-01-02T00:00:00Z"),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthContext as any).mockReturnValue({
      currentUser: mockCurrentUser,
      isAuthenticated: true,
    });
    (useUserId as any).mockReturnValue("user123");
    (useSubmitVerse as any).mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      isPending: false,
    });
    (useVoteVerse as any).mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      isPending: false,
    });
  });

  describe("Loading State", () => {
    it("should show loading skeletons while fetching", () => {
      (useVerses as any).mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      });

      render(<SongNotesTab songId="song123" songTitle="Amazing Grace" />, {
        wrapper: createWrapper(),
      });

      expect(screen.getAllByTestId("skeleton")).toHaveLength(3);
    });
  });

  describe("Song Notes Section", () => {
    it("should display song notes when available", () => {
      (useVerses as any).mockReturnValue({
        data: mockVerses,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <SongNotesTab
          songId="song123"
          songTitle="Amazing Grace"
          songNotes="This hymn was written in 1772."
        />,
        { wrapper: createWrapper() },
      );

      expect(screen.getByText("Song Notes")).toBeInTheDocument();
      expect(
        screen.getByText("This hymn was written in 1772."),
      ).toBeInTheDocument();
    });

    it("should not show song notes section when notes are empty", () => {
      (useVerses as any).mockReturnValue({
        data: mockVerses,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<SongNotesTab songId="song123" songTitle="Amazing Grace" />, {
        wrapper: createWrapper(),
      });

      expect(screen.queryByText("Song Notes")).not.toBeInTheDocument();
    });
  });

  describe("Bible Verses Section", () => {
    it("should display bible verses", () => {
      (useVerses as any).mockReturnValue({
        data: mockVerses,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<SongNotesTab songId="song123" songTitle="Amazing Grace" />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText("Related Bible Verses")).toBeInTheDocument();
      expect(screen.getByText("John 3:16")).toBeInTheDocument();
      expect(
        screen.getByText("For God so loved the world..."),
      ).toBeInTheDocument();
      expect(screen.getByText("Psalm 23:1")).toBeInTheDocument();
      expect(
        screen.getByText("The Lord is my shepherd..."),
      ).toBeInTheDocument();
    });

    it("should show empty state when no verses", () => {
      (useVerses as any).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<SongNotesTab songId="song123" songTitle="Amazing Grace" />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText("No verses yet")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Be the first to add a Bible verse related to this song.",
        ),
      ).toBeInTheDocument();
    });

    it("should display upvote counts", () => {
      (useVerses as any).mockReturnValue({
        data: mockVerses,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<SongNotesTab songId="song123" songTitle="Amazing Grace" />, {
        wrapper: createWrapper(),
      });

      // Check for upvote buttons with counts
      const upvoteButtons = screen.getAllByRole("button", { name: /upvote/i });
      expect(upvoteButtons[0]).toHaveTextContent("5");
      expect(upvoteButtons[1]).toHaveTextContent("3");
    });
  });

  describe("Verse Submission", () => {
    it("should open dialog when add verse button is clicked", async () => {
      (useVerses as any).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<SongNotesTab songId="song123" songTitle="Amazing Grace" />, {
        wrapper: createWrapper(),
      });

      // When there are no verses, button says "Add First Verse"
      const addButton = screen.getByText("Add First Verse");
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText("Submit a Bible Verse")).toBeInTheDocument();
        expect(
          screen.getByText(/Add a Bible verse that relates to/),
        ).toBeInTheDocument();
      });
    });

    it("should submit verse with valid data", async () => {
      const mockSubmit = vi.fn();
      const mockSubmitAsync = vi.fn().mockResolvedValue({});
      (useSubmitVerse as any).mockReturnValue({
        mutate: mockSubmit,
        mutateAsync: mockSubmitAsync,
        isPending: false,
      });
      (useVerses as any).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<SongNotesTab songId="song123" songTitle="Amazing Grace" />, {
        wrapper: createWrapper(),
      });

      // Open dialog - when there are no verses, button says "Add First Verse"
      fireEvent.click(screen.getByText("Add First Verse"));

      // Fill form
      const referenceInput = screen.getByLabelText(/Reference/);
      const textInput = screen.getByLabelText(/Verse Text/);

      fireEvent.change(referenceInput, { target: { value: "Romans 8:28" } });
      fireEvent.change(textInput, {
        target: { value: "And we know that all things work together..." },
      });

      // Submit
      const submitButton = screen.getByRole("button", { name: /submit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSubmitAsync).toHaveBeenCalledWith({
          songId: "song123",
          reference: "Romans 8:28",
          text: "And we know that all things work together...",
          userId: "user123",
        });
      });
    });

    it("should require authentication to submit", () => {
      (useAuthContext as any).mockReturnValue({
        currentUser: null,
        isAuthenticated: false,
      });
      (useUserId as any).mockReturnValue(null);
      (useVerses as any).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<SongNotesTab songId="song123" songTitle="Amazing Grace" />, {
        wrapper: createWrapper(),
      });

      // When not authenticated, the "Add First Verse" button should not show
      expect(screen.queryByText("Add First Verse")).not.toBeInTheDocument();
    });
  });

  describe("Verse Upvoting", () => {
    it("should upvote verse when button clicked", async () => {
      const mockVote = vi.fn();
      const mockVoteAsync = vi.fn().mockResolvedValue({});
      (useVoteVerse as any).mockReturnValue({
        mutate: mockVote,
        mutateAsync: mockVoteAsync,
        isPending: false,
      });
      (useVerses as any).mockReturnValue({
        data: mockVerses,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<SongNotesTab songId="song123" songTitle="Amazing Grace" />, {
        wrapper: createWrapper(),
      });

      const upvoteButtons = screen.getAllByRole("button", { name: /upvote/i });
      fireEvent.click(upvoteButtons[0]);

      expect(mockVoteAsync).toHaveBeenCalledWith({
        verseId: "verse1",
        voteType: "up",
        songId: "song123",
      });
    });

    it("should show different button variants for upvoted verses", () => {
      (useVerses as any).mockReturnValue({
        data: mockVerses,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<SongNotesTab songId="song123" songTitle="Amazing Grace" />, {
        wrapper: createWrapper(),
      });

      const upvoteButtons = screen.getAllByRole("button", { name: /upvote/i });
      // First verse not upvoted (userVote: null)
      expect(upvoteButtons[0]).toHaveAttribute("aria-pressed", "false");
      // Second verse upvoted (userVote: "up")
      expect(upvoteButtons[1]).toHaveAttribute("aria-pressed", "true");
    });
  });

  describe("Status Indicators", () => {
    it("should show status badges for non-approved verses", () => {
      const versesWithStatus = [
        {
          ...mockVerses[0],
          isApproved: false,
        },
        {
          ...mockVerses[1],
          isApproved: false,
        },
      ];

      (useVerses as any).mockReturnValue({
        data: versesWithStatus,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<SongNotesTab songId="song123" songTitle="Amazing Grace" />, {
        wrapper: createWrapper(),
      });

      // Non-approved verses should show pending badge
      const pendingBadges = screen.getAllByText("Pending");
      expect(pendingBadges).toHaveLength(2);
    });
  });
});
