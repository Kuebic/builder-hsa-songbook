/**
 * @fileoverview Tests for ErrorBoundary component
 * @module shared/components/ErrorBoundary/__tests__
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorBoundary, withErrorBoundary } from "../ErrorBoundary";

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error("Test error message");
  }
  return <div>No error</div>;
};

// Component for testing withErrorBoundary HOC
const TestComponent = () => <div>Test Component</div>;

describe("ErrorBoundary", () => {
  // Suppress console.error for these tests
  const originalError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalError;
  });

  it("renders children when there is no error", () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("renders error UI when child component throws", () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText("An error occurred")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong while rendering this content.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("uses custom error title and description when provided", () => {
    render(
      <ErrorBoundary
        errorTitle="Custom Error Title"
        errorDescription="Custom error description text"
      >
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText("Custom Error Title")).toBeInTheDocument();
    expect(screen.getByText("Custom error description text")).toBeInTheDocument();
  });

  it("calls onError callback when error occurs", () => {
    const onError = vi.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Test error message",
      }),
      expect.any(Object)
    );
  });

  it("resets error state when Try again button is clicked", async () => {
    const user = userEvent.setup();

    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Verify error UI is shown
    expect(screen.getByText("An error occurred")).toBeInTheDocument();

    // Click try again - this should reset the error state
    await user.click(screen.getByRole("button", { name: /try again/i }));

    // Re-render with no error
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    // Verify normal content is shown
    expect(screen.getByText("No error")).toBeInTheDocument();
    expect(screen.queryByText("An error occurred")).not.toBeInTheDocument();
  });

  it("renders custom fallback when provided", () => {
    const customFallback = (error: Error, resetError: () => void) => (
      <div>
        <p>Custom fallback UI</p>
        <p>{error.message}</p>
        <button onClick={resetError}>Reset</button>
      </div>
    );

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText("Custom fallback UI")).toBeInTheDocument();
    expect(screen.getByText("Test error message")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();
  });

  it("shows error stack trace in development mode", () => {
    // Skip this test if not in development
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText("Error details")).toBeInTheDocument();
  });
});

describe("withErrorBoundary HOC", () => {
  const originalError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalError;
  });

  it("wraps component with error boundary", () => {
    const WrappedComponent = withErrorBoundary(TestComponent);
    
    render(<WrappedComponent />);
    
    expect(screen.getByText("Test Component")).toBeInTheDocument();
  });

  it("passes error boundary props to wrapper", () => {
    // Create a component that will throw
    const ThrowingComponent = () => {
      throw new Error("HOC test error");
    };

    const WrappedComponent = withErrorBoundary(ThrowingComponent, {
      errorTitle: "HOC Error",
      errorDescription: "HOC error description",
    });

    render(<WrappedComponent />);

    expect(screen.getByText("HOC Error")).toBeInTheDocument();
    expect(screen.getByText("HOC error description")).toBeInTheDocument();
  });

  it("preserves component display name", () => {
    const WrappedComponent = withErrorBoundary(TestComponent);
    expect(WrappedComponent.displayName).toBe("withErrorBoundary(TestComponent)");
  });
});