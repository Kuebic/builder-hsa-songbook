import { Loader2 } from "lucide-react";

/**
 * Props for the LoadingSpinner component.
 */
export interface LoadingSpinnerProps {
  /** Optional message to display below the spinner. Defaults to "Loading..." */
  message?: string;
}

/**
 * Loading spinner component for Suspense fallbacks.
 * 
 * Displays a centered spinning loader with optional message.
 * Used as fallback while lazy-loaded components are being fetched.
 * 
 * @component
 * @example
 * ```tsx
 * <Suspense fallback={<LoadingSpinner />}>
 *   <LazyComponent />
 * </Suspense>
 * ```
 * 
 * @example
 * ```tsx
 * <Suspense fallback={<LoadingSpinner message="Loading data..." />}>
 *   <DataComponent />
 * </Suspense>
 * ```
 */
export function LoadingSpinner({ message = "Loading..." }: LoadingSpinnerProps) {
  return (
    <div className="flex min-h-[400px] w-full items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}