/**
 * @fileoverview Generic error boundary component for catching React errors
 * @module shared/components/ErrorBoundary
 */

import { Component, ErrorInfo, ReactNode, ReactElement } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

/**
 * Props for the ErrorBoundary component
 */
export interface ErrorBoundaryProps {
  /** Child components to wrap with error boundary */
  children: ReactNode;
  /** Optional custom error title */
  errorTitle?: string;
  /** Optional custom error description */
  errorDescription?: string;
  /** Optional callback when error occurs */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Optional custom fallback component */
  fallback?: (error: Error, resetError: () => void) => ReactElement;
}

/**
 * State for the ErrorBoundary component
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Generic error boundary component that catches JavaScript errors anywhere in the child component tree.
 * 
 * Provides a fallback UI when errors occur and allows for error recovery.
 * 
 * @component
 * @example
 * ```tsx
 * <ErrorBoundary
 *   errorTitle="Something went wrong"
 *   errorDescription="We couldn't render this content"
 *   onError={(error) => console.error(error)}
 * >
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  /**
   * Updates state when an error is caught
   * 
   * @param error - The error that was thrown
   * @returns Updated state with error information
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  /**
   * Logs error information and calls optional error callback
   * 
   * @param error - The error that was thrown
   * @param errorInfo - Additional error information from React
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  /**
   * Resets the error boundary state
   */
  resetError = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError);
      }

      // Default fallback UI
      return (
        <div className="flex items-center justify-center p-6">
          <Alert className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>
              {this.props.errorTitle || "An error occurred"}
            </AlertTitle>
            <AlertDescription className="mt-2 space-y-2">
              <p>
                {this.props.errorDescription || 
                 "Something went wrong while rendering this content."}
              </p>
              {process.env.NODE_ENV === "development" && (
                <details className="mt-2 text-xs text-muted-foreground">
                  <summary className="cursor-pointer">Error details</summary>
                  <pre className="mt-2 whitespace-pre-wrap overflow-auto max-h-32 p-2 bg-muted rounded">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={this.resetError}
                className="mt-4"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try again
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook to create a wrapped component with error boundary
 * 
 * @param Component - Component to wrap
 * @param errorBoundaryProps - Props to pass to ErrorBoundary
 * @returns Wrapped component
 * 
 * @example
 * ```tsx
 * const SafeComponent = withErrorBoundary(MyComponent, {
 *   errorTitle: "Failed to load component"
 * });
 * ```
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, "children">,
): React.ComponentType<P> {
  const WrappedComponent = (props: P): ReactElement => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}