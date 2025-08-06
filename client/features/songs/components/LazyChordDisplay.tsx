import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChordDisplayProps } from "@features/songs/types/chord.types";

// Lazy load the ChordDisplay component
// This prevents loading chordsheetjs (151KB) until actually needed
const ChordDisplay = lazy(() => 
  import("./ChordDisplay").then(module => ({
    default: module.ChordDisplay
  }))
);

/**
 * Loading skeleton for chord display
 */
function ChordDisplaySkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-6 w-5/6" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-2/3" />
      </div>
    </div>
  );
}

/**
 * Lazy-loaded wrapper for ChordDisplay component
 * Defers loading of the heavy chordsheetjs library until component is rendered
 */
export function LazyChordDisplay(props: ChordDisplayProps) {
  return (
    <Suspense fallback={<ChordDisplaySkeleton />}>
      <ChordDisplay {...props} />
    </Suspense>
  );
}

export default LazyChordDisplay;