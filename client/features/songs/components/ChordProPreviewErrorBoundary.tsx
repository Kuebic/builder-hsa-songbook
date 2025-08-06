/**
 * @fileoverview Error boundary specifically for ChordPro preview rendering
 * @module features/songs/components/ChordProPreviewErrorBoundary
 */

import { ReactElement } from "react";
import { ErrorBoundary } from "@/shared/components/ErrorBoundary";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, FileWarning } from "lucide-react";

/**
 * Error boundary component specifically designed for ChordPro preview rendering.
 *
 * Provides context-aware error messages and recovery options for chord parsing failures.
 *
 * @component
 * @example
 * ```tsx
 * <ChordProPreviewErrorBoundary>
 *   {renderPreview()}
 * </ChordProPreviewErrorBoundary>
 * ```
 */
export function ChordProPreviewErrorBoundary({
  children,
}: {
  children: React.ReactNode;
}): ReactElement {
  return (
    <ErrorBoundary
      errorTitle="Preview Error"
      errorDescription="Unable to render the chord preview"
      fallback={(error, resetError) => (
        <div className="p-6">
          <Alert variant="destructive">
            <FileWarning className="h-4 w-4" />
            <AlertTitle>Unable to render chord preview</AlertTitle>
            <AlertDescription className="space-y-3 mt-2">
              <p>
                There was an error rendering your ChordPro content. This might
                be due to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Invalid chord notation (e.g., unmatched brackets)</li>
                <li>Malformed ChordPro directives</li>
                <li>Special characters that couldn&apos;t be processed</li>
              </ul>

              <div className="bg-muted/50 p-3 rounded-md mt-3">
                <p className="text-sm font-medium mb-1 flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3" />
                  Common fixes:
                </p>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  <li>
                    • Check that all chord brackets [ ] are properly closed
                  </li>
                  <li>• Ensure directives use format: {"{key: value}"}</li>
                  <li>• Remove any special formatting characters</li>
                </ul>
              </div>

              {process.env.NODE_ENV === "development" && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs text-muted-foreground">
                    Technical details
                  </summary>
                  <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-24">
                    {error.message}
                  </pre>
                </details>
              )}

              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={resetError}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try again
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // Could implement a help modal or link to docs
                    window.open(
                      "https://www.chordpro.org/chordpro/chordpro-introduction/",
                      "_blank",
                    );
                  }}
                >
                  View ChordPro Guide
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}
      onError={(error) => {
        // Log chord-specific errors for monitoring in development
        if (process.env.NODE_ENV === "development") {
          console.error("[ChordPro Preview Error]:", error);
        }
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
