import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ReviewsList from "../ReviewsList";
import { useAuthContext } from "@/shared/contexts/AuthContext";
import { 
  useArrangementReviews, 
  useSubmitReview, 
  useMarkHelpful, 
  useReportReview 
} from "../../hooks/useReviews";

// Mock hooks
vi.mock("@/shared/contexts/AuthContext", () => ({
  useAuthContext: vi.fn(),
}));

vi.mock("../../hooks/useReviews", () => ({
  useArrangementReviews: vi.fn(),
  useSubmitReview: vi.fn(),
  useMarkHelpful: vi.fn(),
  useReportReview: vi.fn(),
}));

// Mock lucide icons
vi.mock("lucide-react", () => ({
  Star: ({ className, fill }: any) => (
    <div data-testid="star-icon" className={className} data-fill={fill} />
  ),
  MessageSquare: () => <div data-testid="message-square-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  ThumbsUp: ({ className }: any) => (
    <div data-testid="thumbs-up-icon" className={className} />
  ),
  Flag: () => <div data-testid="flag-icon" />,
  Edit: () => <div data-testid="edit-icon" />,
  AlertCircle: () => <div data-testid="alert-circle-icon" />,
}));

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

vi.mock("@/components/ui/progress", () => ({
  Progress: ({ value, className }: any) => (
    <div className={className} data-testid="progress" data-value={value} />
  ),
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

describe("ReviewsList", () => {
  const mockCurrentUser = { _id: "user123", name: "Test User" };
  const mockReviews = [
    {
      id: "review1",
      user: { id: "user456", name: "John Doe", email: "john@test.com" },
      rating: 5,
      comment: "Excellent arrangement! Perfect for our worship team.",
      helpfulCount: 10,
      hasMarkedHelpful: false,
      createdAt: "2024-01-01T00:00:00Z",
    },
    {
      id: "review2",
      user: { id: "user789", name: "Jane Smith", email: "jane@test.com" },
      rating: 4,
      comment: "Good arrangement, but could use more dynamics.",
      helpfulCount: 5,
      hasMarkedHelpful: true,
      createdAt: "2024-01-02T00:00:00Z",
    },
  ];

  const mockSummary = {
    averageRating: 4.5,
    totalReviews: 25,
    arrangementName: "Acoustic Version",
    songs: [{ id: "song1", title: "Amazing Grace", artist: "John Newton" }],
  };

  const mockCurrentUserReview = {
    id: "review3",
    rating: 4,
    comment: "Nice arrangement, works well for our congregation.",
    helpfulCount: 2,
    createdAt: "2024-01-03T00:00:00Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthContext as any).mockReturnValue({
      currentUser: mockCurrentUser,
      isAuthenticated: true,
    });
    (useSubmitReview as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    (useMarkHelpful as any).mockReturnValue({
      mutate: vi.fn(),
    });
    (useReportReview as any).mockReturnValue({
      mutate: vi.fn(),
    });
  });

  describe("Loading State", () => {
    it("should show loading skeletons while fetching", () => {
      (useArrangementReviews as any).mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      render(
        <ReviewsList arrangementId="arr123" arrangementName="Test Arrangement" />,
        { wrapper: createWrapper() }
      );

      expect(screen.getAllByTestId("skeleton")).toHaveLength(4);
    });
  });

  describe("Reviews Display", () => {
    it("should display reviews list", () => {
      (useArrangementReviews as any).mockReturnValue({
        data: { reviews: mockReviews, summary: mockSummary },
        isLoading: false,
        error: null,
      });

      render(
        <ReviewsList arrangementId="arr123" arrangementName="Test Arrangement" />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText("Reviews")).toBeInTheDocument();
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Excellent arrangement! Perfect for our worship team.")).toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
      expect(screen.getByText("Good arrangement, but could use more dynamics.")).toBeInTheDocument();
    });

    it("should display average rating and total count", () => {
      (useArrangementReviews as any).mockReturnValue({
        data: { reviews: mockReviews, summary: mockSummary },
        isLoading: false,
        error: null,
      });

      render(
        <ReviewsList arrangementId="arr123" arrangementName="Test Arrangement" />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText("4.5")).toBeInTheDocument();
      expect(screen.getByText("25 reviews")).toBeInTheDocument();
    });

    it("should display rating breakdown", () => {
      (useArrangementReviews as any).mockReturnValue({
        data: { 
          reviews: mockReviews, 
          summary: mockSummary,
          ratingBreakdown: {
            5: 15,
            4: 8,
            3: 2,
            2: 0,
            1: 0,
          }
        },
        isLoading: false,
        error: null,
      });

      render(
        <ReviewsList arrangementId="arr123" arrangementName="Test Arrangement" />,
        { wrapper: createWrapper() }
      );

      // Check for star labels
      expect(screen.getByText("5 stars")).toBeInTheDocument();
      expect(screen.getByText("4 stars")).toBeInTheDocument();
      expect(screen.getByText("3 stars")).toBeInTheDocument();
    });

    it("should show empty state when no reviews", () => {
      (useArrangementReviews as any).mockReturnValue({
        data: { reviews: [], summary: { ...mockSummary, totalReviews: 0, averageRating: 0 } },
        isLoading: false,
        error: null,
      });

      render(
        <ReviewsList arrangementId="arr123" arrangementName="Test Arrangement" />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText("No reviews yet")).toBeInTheDocument();
      expect(screen.getByText("Be the first to share your experience with this arrangement!")).toBeInTheDocument();
    });
  });

  describe("Current User Review", () => {
    it("should display current user review separately", () => {
      (useArrangementReviews as any).mockReturnValue({
        data: { 
          reviews: mockReviews, 
          summary: mockSummary,
          currentUserReview: mockCurrentUserReview,
        },
        isLoading: false,
        error: null,
      });

      render(
        <ReviewsList arrangementId="arr123" arrangementName="Test Arrangement" />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText("Your Review")).toBeInTheDocument();
      expect(screen.getByText("Nice arrangement, works well for our congregation.")).toBeInTheDocument();
    });

    it("should show edit button for user's own review", () => {
      (useArrangementReviews as any).mockReturnValue({
        data: { 
          reviews: mockReviews, 
          summary: mockSummary,
          currentUserReview: mockCurrentUserReview,
        },
        isLoading: false,
        error: null,
      });

      render(
        <ReviewsList arrangementId="arr123" arrangementName="Test Arrangement" />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByTestId("edit-icon")).toBeInTheDocument();
    });
  });

  describe("Review Submission", () => {
    it("should open review form when write review clicked", async () => {
      (useArrangementReviews as any).mockReturnValue({
        data: { reviews: [], summary: mockSummary },
        isLoading: false,
        error: null,
      });

      render(
        <ReviewsList arrangementId="arr123" arrangementName="Test Arrangement" />,
        { wrapper: createWrapper() }
      );

      const writeButton = screen.getByText("Write a Review");
      fireEvent.click(writeButton);

      await waitFor(() => {
        expect(screen.getByText("Submit Your Review")).toBeInTheDocument();
      });
    });

    it("should submit review with valid data", async () => {
      const mockSubmit = vi.fn();
      (useSubmitReview as any).mockReturnValue({
        mutate: mockSubmit,
        isPending: false,
      });
      (useArrangementReviews as any).mockReturnValue({
        data: { reviews: [], summary: mockSummary },
        isLoading: false,
        error: null,
      });

      render(
        <ReviewsList arrangementId="arr123" arrangementName="Test Arrangement" />,
        { wrapper: createWrapper() }
      );

      // Open form
      fireEvent.click(screen.getByText("Write a Review"));

      // Select rating
      const starButtons = screen.getAllByRole("button", { name: /star/i });
      fireEvent.click(starButtons[4]); // 5 stars

      // Enter comment
      const commentInput = screen.getByPlaceholderText(/Share your experience/);
      fireEvent.change(commentInput, { 
        target: { value: "This is an excellent arrangement for our worship team!" } 
      });

      // Submit
      const submitButton = screen.getByText("Submit Review");
      fireEvent.click(submitButton);

      expect(mockSubmit).toHaveBeenCalledWith({
        arrangementId: "arr123",
        userId: "user123",
        rating: 5,
        comment: "This is an excellent arrangement for our worship team!",
      });
    });

    it("should require authentication to submit review", () => {
      (useAuthContext as any).mockReturnValue({
        currentUser: null,
        isAuthenticated: false,
      });
      (useArrangementReviews as any).mockReturnValue({
        data: { reviews: [], summary: mockSummary },
        isLoading: false,
        error: null,
      });

      render(
        <ReviewsList arrangementId="arr123" arrangementName="Test Arrangement" />,
        { wrapper: createWrapper() }
      );

      const writeButton = screen.getByText("Write a Review");
      fireEvent.click(writeButton);

      // Form should not open
      expect(screen.queryByText("Submit Your Review")).not.toBeInTheDocument();
    });
  });

  describe("Helpful Marking", () => {
    it("should mark review as helpful", async () => {
      const mockMarkHelpful = vi.fn();
      (useMarkHelpful as any).mockReturnValue({
        mutate: mockMarkHelpful,
      });
      (useArrangementReviews as any).mockReturnValue({
        data: { reviews: mockReviews, summary: mockSummary },
        isLoading: false,
        error: null,
      });

      render(
        <ReviewsList arrangementId="arr123" arrangementName="Test Arrangement" />,
        { wrapper: createWrapper() }
      );

      const helpfulButtons = screen.getAllByRole("button", { name: /helpful/i });
      fireEvent.click(helpfulButtons[0]);

      expect(mockMarkHelpful).toHaveBeenCalledWith({
        reviewId: "review1",
        userId: "user123",
      });
    });

    it("should show different style for already marked helpful", () => {
      (useArrangementReviews as any).mockReturnValue({
        data: { reviews: mockReviews, summary: mockSummary },
        isLoading: false,
        error: null,
      });

      render(
        <ReviewsList arrangementId="arr123" arrangementName="Test Arrangement" />,
        { wrapper: createWrapper() }
      );

      const helpfulButtons = screen.getAllByRole("button", { name: /helpful/i });
      expect(helpfulButtons[0]).not.toHaveClass("text-blue-600");
      expect(helpfulButtons[1]).toHaveClass("text-blue-600");
    });
  });

  describe("Review Reporting", () => {
    it("should show report dialog when flag clicked", async () => {
      (useArrangementReviews as any).mockReturnValue({
        data: { reviews: mockReviews, summary: mockSummary },
        isLoading: false,
        error: null,
      });

      render(
        <ReviewsList arrangementId="arr123" arrangementName="Test Arrangement" />,
        { wrapper: createWrapper() }
      );

      const reportButtons = screen.getAllByTestId("flag-icon");
      fireEvent.click(reportButtons[0].parentElement!);

      await waitFor(() => {
        expect(screen.getByText("Report Review")).toBeInTheDocument();
        expect(screen.getByText("Why are you reporting this review?")).toBeInTheDocument();
      });
    });

    it("should submit report with reason", async () => {
      const mockReport = vi.fn();
      (useReportReview as any).mockReturnValue({
        mutate: mockReport,
      });
      (useArrangementReviews as any).mockReturnValue({
        data: { reviews: mockReviews, summary: mockSummary },
        isLoading: false,
        error: null,
      });

      render(
        <ReviewsList arrangementId="arr123" arrangementName="Test Arrangement" />,
        { wrapper: createWrapper() }
      );

      // Open report dialog
      const reportButtons = screen.getAllByTestId("flag-icon");
      fireEvent.click(reportButtons[0].parentElement!);

      // Enter reason
      const reasonInput = screen.getByPlaceholderText(/Explain why/);
      fireEvent.change(reasonInput, { target: { value: "Inappropriate content" } });

      // Submit
      const submitButton = screen.getByText("Submit Report");
      fireEvent.click(submitButton);

      expect(mockReport).toHaveBeenCalledWith({
        reviewId: "review1",
        userId: "user123",
        reason: "Inappropriate content",
      });
    });
  });

  describe("Star Rating Display", () => {
    it("should display correct number of filled stars", () => {
      (useArrangementReviews as any).mockReturnValue({
        data: { reviews: mockReviews, summary: mockSummary },
        isLoading: false,
        error: null,
      });

      render(
        <ReviewsList arrangementId="arr123" arrangementName="Test Arrangement" />,
        { wrapper: createWrapper() }
      );

      const reviewCards = screen.getAllByTestId(/review-/);
      const firstReviewStars = reviewCards[0].querySelectorAll('[data-testid="star-icon"]');
      const filledStars = Array.from(firstReviewStars).filter(
        star => star.getAttribute('data-fill') === 'currentColor'
      );

      expect(filledStars).toHaveLength(5); // 5-star review
    });
  });

  describe("Error Handling", () => {
    it("should show error state when loading fails", () => {
      (useArrangementReviews as any).mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error("Failed to load reviews"),
      });

      render(
        <ReviewsList arrangementId="arr123" arrangementName="Test Arrangement" />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText("Failed to load reviews")).toBeInTheDocument();
      expect(screen.getByText("Try Again")).toBeInTheDocument();
    });
  });
});