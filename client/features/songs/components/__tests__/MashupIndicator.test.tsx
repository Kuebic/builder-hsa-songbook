import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import MashupIndicator from "../MashupIndicator";

// Mock lucide icons
vi.mock("lucide-react", () => ({
  Layers: ({ className }: any) => (
    <div data-testid="layers-icon" className={className} />
  ),
}));

describe("MashupIndicator", () => {
  describe("Rendering", () => {
    it("should not render when not a mashup", () => {
      const { container } = render(<MashupIndicator isMashup={false} />);

      expect(container.firstChild).toBeNull();
    });

    it("should render when is a mashup", () => {
      render(<MashupIndicator isMashup={true} />);

      expect(screen.getByText("Mashup")).toBeInTheDocument();
      expect(screen.getByTestId("layers-icon")).toBeInTheDocument();
    });

    it("should display song count when provided", () => {
      render(<MashupIndicator isMashup={true} songCount={3} />);

      expect(screen.getByText("Mashup (3 songs)")).toBeInTheDocument();
    });

    it("should not display song count when less than 2", () => {
      render(<MashupIndicator isMashup={true} songCount={1} />);

      expect(screen.getByText("Mashup")).toBeInTheDocument();
      expect(screen.queryByText("(1 songs)")).not.toBeInTheDocument();
    });
  });

  describe("Variants", () => {
    it("should render default variant with full badge", () => {
      render(<MashupIndicator isMashup={true} variant="default" />);

      const badge = screen.getByText("Mashup").parentElement;
      expect(badge).toHaveClass("inline-flex");
      expect(badge?.className).toMatch(/badge/);
    });

    it("should render minimal variant with icon only", () => {
      render(<MashupIndicator isMashup={true} variant="minimal" />);

      expect(screen.getByTestId("layers-icon")).toBeInTheDocument();
      expect(screen.queryByText("Mashup")).not.toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("should apply correct classes for default variant", () => {
      render(<MashupIndicator isMashup={true} variant="default" />);

      const badge = screen.getByText("Mashup").parentElement;
      expect(badge).toHaveClass("bg-blue-100");
      expect(badge).toHaveClass("text-blue-800");
    });

    it("should apply correct classes for minimal variant", () => {
      render(<MashupIndicator isMashup={true} variant="minimal" />);

      const icon = screen.getByTestId("layers-icon");
      expect(icon).toHaveClass("h-4");
      expect(icon).toHaveClass("w-4");
      expect(icon).toHaveClass("text-blue-600");
    });
  });

  describe("Song Count Display", () => {
    it("should pluralize correctly for 2 songs", () => {
      render(<MashupIndicator isMashup={true} songCount={2} />);

      expect(screen.getByText("Mashup (2 songs)")).toBeInTheDocument();
    });

    it("should pluralize correctly for multiple songs", () => {
      render(<MashupIndicator isMashup={true} songCount={5} />);

      expect(screen.getByText("Mashup (5 songs)")).toBeInTheDocument();
    });

    it("should handle undefined song count", () => {
      render(<MashupIndicator isMashup={true} songCount={undefined} />);

      expect(screen.getByText("Mashup")).toBeInTheDocument();
      expect(screen.queryByText(/songs/)).not.toBeInTheDocument();
    });

    it("should handle zero song count", () => {
      render(<MashupIndicator isMashup={true} songCount={0} />);

      expect(screen.getByText("Mashup")).toBeInTheDocument();
      expect(screen.queryByText(/songs/)).not.toBeInTheDocument();
    });
  });

  describe("Tooltip", () => {
    it("should have title attribute on minimal variant", () => {
      render(
        <MashupIndicator isMashup={true} variant="minimal" songCount={3} />,
      );

      const container = screen.getByTestId("layers-icon").parentElement;
      expect(container).toHaveAttribute("title", "Mashup (3 songs)");
    });

    it("should have title without count when count not provided", () => {
      render(<MashupIndicator isMashup={true} variant="minimal" />);

      const container = screen.getByTestId("layers-icon").parentElement;
      expect(container).toHaveAttribute("title", "Mashup");
    });
  });
});
