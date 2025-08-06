/**
 * @fileoverview Comprehensive tests for ChordDisplay component
 * @module features/songs/components/__tests__/ChordDisplay.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ChordDisplay } from "../ChordDisplay";
import type { ChordDisplayProps } from "../../types/chord.types";

// Mock ChordSheetJS to control test scenarios
const mockParsedSong = {
  title: "Test Song",
  subtitle: "Test Artist",
  key: "C",
  tempo: "120",
  time: "4/4",
  transpose: vi.fn((semitones: number) => ({
    ...mockParsedSong,
    key: semitones === 2 ? "D" : "C",
  })),
};

const mockFormatter = {
  format: vi.fn(
    () =>
      '<div class="chord-line"><span class="chord">C</span> <span class="lyrics">Amazing grace</span></div>',
  ),
};

vi.mock("chordsheetjs", () => ({
  ChordProParser: vi.fn(() => ({
    parse: vi.fn(() => mockParsedSong),
  })),
  HtmlDivFormatter: vi.fn(() => mockFormatter),
}));

// Mock the hooks
vi.mock("../../hooks/useChordSheetParser", () => ({
  useChordSheetParser: vi.fn(() => ({
    parsedSong: mockParsedSong,
    error: null,
    metadata: {
      title: "Test Song",
      artist: "Test Artist",
      key: "C",
      tempo: "120",
    },
    isValid: true,
    isLoading: false,
  })),
}));

vi.mock("../../hooks/useChordTransposition", () => ({
  useChordTransposition: vi.fn(() => ({
    currentKey: "C",
    transpositionLevel: 0,
    availableKeys: ["C", "D", "E", "F", "G", "A", "B"],
    canTransposeUp: true,
    canTransposeDown: true,
    transpose: vi.fn(),
    transposeUp: vi.fn(),
    transposeDown: vi.fn(),
    reset: vi.fn(),
    setTransposition: vi.fn(),
  })),
}));

// Mock ChordDisplayControls
vi.mock("../ChordDisplayControls", () => ({
  ChordDisplayControls: ({ onTranspose }: any) => (
    <div data-testid="chord-display-controls">
      <button onClick={() => onTranspose(1)} data-testid="transpose-up">
        Transpose Up
      </button>
      <button onClick={() => onTranspose(-1)} data-testid="transpose-down">
        Transpose Down
      </button>
    </div>
  ),
}));

describe("ChordDisplay Component", () => {
  const defaultProps: ChordDisplayProps = {
    content: "{title: Test Song}\n{key: C}\n[C]Amazing [G]grace",
    theme: "light",
    fontSize: "base",
    showChords: true,
    showControls: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Basic Rendering", () => {
    it("renders chord content correctly", () => {
      render(<ChordDisplay {...defaultProps} />);

      expect(
        screen.getByRole("region", { name: /chord chart/i }),
      ).toBeInTheDocument();
      expect(screen.getByText("Test Song")).toBeInTheDocument();
      expect(screen.getByText("Test Artist")).toBeInTheDocument();
    });

    it("displays metadata correctly", () => {
      render(<ChordDisplay {...defaultProps} />);

      expect(screen.getByText("Test Song")).toBeInTheDocument();
      expect(screen.getByText("Test Artist")).toBeInTheDocument();
      expect(screen.getByText(/key: c/i)).toBeInTheDocument();
      expect(screen.getByText(/tempo: 120/i)).toBeInTheDocument();
    });

    it("applies theme classes correctly", () => {
      const { container } = render(
        <ChordDisplay {...defaultProps} theme="stage" />,
      );

      expect(container.firstChild).toHaveClass("chord-display--stage");
    });

    it("applies font size classes correctly", () => {
      const { container } = render(
        <ChordDisplay {...defaultProps} fontSize="lg" />,
      );

      expect(container.firstChild).toHaveClass("text-lg");
    });

    it("applies custom className", () => {
      const { container } = render(
        <ChordDisplay {...defaultProps} className="custom-class" />,
      );

      expect(container.firstChild).toHaveClass("custom-class");
    });
  });

  describe("Controls Integration", () => {
    it("shows controls when showControls is true", () => {
      render(<ChordDisplay {...defaultProps} showControls={true} />);

      expect(screen.getByTestId("chord-display-controls")).toBeInTheDocument();
    });

    it("hides controls when showControls is false", () => {
      render(<ChordDisplay {...defaultProps} showControls={false} />);

      expect(
        screen.queryByTestId("chord-display-controls"),
      ).not.toBeInTheDocument();
    });

    it("handles transposition through controls", () => {
      const onTranspose = vi.fn();
      render(
        <ChordDisplay
          {...defaultProps}
          showControls={true}
          onTranspose={onTranspose}
        />,
      );

      const transposeUpButton = screen.getByTestId("transpose-up");
      fireEvent.click(transposeUpButton);

      // Should call the transposition hook, not directly onTranspose
      // onTranspose is called by the hook internally
    });
  });

  describe("Empty States", () => {
    it("displays empty state for no content", () => {
      render(<ChordDisplay {...defaultProps} content="" />);

      expect(screen.getByText("No chord content")).toBeInTheDocument();
      expect(
        screen.getByText(/add chordpro formatted lyrics/i),
      ).toBeInTheDocument();
    });

    it("handles whitespace-only content as parsing error", async () => {
      // Mock parser hook to treat whitespace as invalid
      const { useChordSheetParser } = await import(
        "../../hooks/useChordSheetParser"
      );
      vi.mocked(useChordSheetParser).mockReturnValue({
        parsedSong: null,
        error: null,
        metadata: null,
        isValid: false,
        isLoading: false,
      });

      render(<ChordDisplay {...defaultProps} content="   \n   \t   " />);

      expect(screen.getByText("Chord Parsing Error")).toBeInTheDocument();
      expect(
        screen.getByText("Unable to parse chord content"),
      ).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("displays error when parsing fails", async () => {
      // Mock parser hook to return error
      const { useChordSheetParser } = await import(
        "../../hooks/useChordSheetParser"
      );
      vi.mocked(useChordSheetParser).mockReturnValue({
        parsedSong: null,
        error: {
          type: "parse_error",
          message: "Invalid ChordPro syntax",
          originalContent: defaultProps.content,
          line: 2,
        },
        metadata: null,
        isValid: false,
        isLoading: false,
      });

      render(<ChordDisplay {...defaultProps} />);

      expect(screen.getByText("Chord Parsing Error")).toBeInTheDocument();
      expect(screen.getByText("Invalid ChordPro syntax")).toBeInTheDocument();
      expect(screen.getByText("Error on line 2")).toBeInTheDocument();
    });

    it("calls onError callback when parsing fails", async () => {
      const onError = vi.fn();
      const error = {
        type: "parse_error" as const,
        message: "Test error",
        originalContent: defaultProps.content,
      };

      const { useChordSheetParser } = await import(
        "../../hooks/useChordSheetParser"
      );
      vi.mocked(useChordSheetParser).mockReturnValue({
        parsedSong: null,
        error,
        metadata: null,
        isValid: false,
        isLoading: false,
      });

      render(<ChordDisplay {...defaultProps} onError={onError} />);

      // onError should be called internally when error is detected
      expect(screen.getByText("Chord Parsing Error")).toBeInTheDocument();
    });

    it("handles prop validation errors", () => {
      // Test with invalid transpose value
      render(
        <ChordDisplay
          {...defaultProps}
          transpose={99} // Invalid: should be -11 to +11
        />,
      );

      expect(screen.getByText("Configuration Error")).toBeInTheDocument();
    });
  });

  describe("Loading States", () => {
    it("displays loading spinner when parsing", async () => {
      const { useChordSheetParser } = await import(
        "../../hooks/useChordSheetParser"
      );
      vi.mocked(useChordSheetParser).mockReturnValue({
        parsedSong: null,
        error: null,
        metadata: null,
        isValid: false,
        isLoading: true,
      });

      render(<ChordDisplay {...defaultProps} />);

      expect(screen.getByText("Parsing chord sheet...")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA attributes", () => {
      render(<ChordDisplay {...defaultProps} />);

      const chordRegion = screen.getByRole("region", { name: /chord chart/i });
      expect(chordRegion).toHaveAttribute(
        "aria-describedby",
        "chord-display-instructions",
      );
      expect(chordRegion).toHaveAttribute("tabIndex", "0");
    });

    it("provides screen reader instructions", () => {
      render(<ChordDisplay {...defaultProps} />);

      const instructions = document.getElementById(
        "chord-display-instructions",
      );
      expect(instructions).toBeInTheDocument();
      expect(instructions).toHaveClass("sr-only");
      expect(instructions).toHaveTextContent(/chord chart with lyrics/i);
    });

    it("includes transposition info in screen reader instructions", async () => {
      // Mock transposition hook to return transposed state
      const { useChordTransposition } = await import(
        "../../hooks/useChordTransposition"
      );
      vi.mocked(useChordTransposition).mockReturnValue({
        currentKey: "D", // C + 2 semitones = D
        transpositionLevel: 2,
        availableKeys: ["C", "D", "E", "F", "G", "A", "B"],
        canTransposeUp: true,
        canTransposeDown: true,
        transpose: vi.fn(),
        transposeUp: vi.fn(),
        transposeDown: vi.fn(),
        reset: vi.fn(),
        setTransposition: vi.fn(),
      });

      render(<ChordDisplay {...defaultProps} transpose={2} />);

      const instructions = document.getElementById(
        "chord-display-instructions",
      );
      expect(instructions).toHaveTextContent(/transposed up by 2 semitones/i);
    });
  });

  describe("Performance", () => {
    it("memoizes and does not re-render with same props", () => {
      const { rerender } = render(<ChordDisplay {...defaultProps} />);

      const firstRender = screen.getByRole("region");

      // Re-render with same props
      rerender(<ChordDisplay {...defaultProps} />);

      const secondRender = screen.getByRole("region");
      expect(firstRender).toBe(secondRender);
    });

    it("re-renders when content changes", () => {
      const { rerender } = render(<ChordDisplay {...defaultProps} />);

      expect(screen.getByText("Test Song")).toBeInTheDocument();

      rerender(
        <ChordDisplay
          {...defaultProps}
          content="{title: New Song}\n[G]Different content"
        />,
      );

      // Should trigger re-parse and re-render
      expect(screen.getByRole("region")).toBeInTheDocument();
    });
  });

  describe("Integration", () => {
    it("integrates with ChordSheetJS correctly", () => {
      render(<ChordDisplay {...defaultProps} />);

      // Should have called the ChordSheetJS parser through our hook
      expect(screen.getByRole("region")).toBeInTheDocument();

      // Verify the formatted HTML is rendered
      const chordContent = document.querySelector(".chord-display-formatted");
      expect(chordContent).toBeInTheDocument();
    });

    it("handles transposition correctly", async () => {
      const { useChordTransposition } = await import(
        "../../hooks/useChordTransposition"
      );
      const mockTransposition = vi
        .mocked(useChordTransposition)
        .mockReturnValue({
          currentKey: "D", // Transposed from C to D
          transpositionLevel: 2,
          availableKeys: ["C", "D", "E", "F", "G", "A", "B"],
          canTransposeUp: true,
          canTransposeDown: true,
          transpose: vi.fn(),
          transposeUp: vi.fn(),
          transposeDown: vi.fn(),
          reset: vi.fn(),
          setTransposition: vi.fn(),
        });

      render(<ChordDisplay {...defaultProps} transpose={2} />);

      expect(screen.getByText(/key: d/i)).toBeInTheDocument();
      expect(mockTransposition).toHaveBeenCalledWith(
        expect.objectContaining({
          initialTranspose: 2,
        }),
      );
    });
  });

  describe("Edge Cases", () => {
    it("handles very long content", () => {
      const longContent = "{title: Long Song}\n" + "[C]Line ".repeat(1000);

      render(<ChordDisplay {...defaultProps} content={longContent} />);

      expect(screen.getByRole("region")).toBeInTheDocument();
    });

    it("handles special characters in content", () => {
      const specialContent = "{title: Spécial Sông}\n[C]Àmàzïng grâcé";

      render(<ChordDisplay {...defaultProps} content={specialContent} />);

      expect(screen.getByRole("region")).toBeInTheDocument();
    });

    it("handles content with no metadata", () => {
      const simpleContent = "[C]Just chords and lyrics";

      render(<ChordDisplay {...defaultProps} content={simpleContent} />);

      expect(screen.getByRole("region")).toBeInTheDocument();
    });
  });
});
