import { ReactElement } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Layers, Music2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MashupIndicatorProps {
  isMashup: boolean;
  songCount?: number;
  songTitles?: string[];
  variant?: "default" | "minimal" | "detailed";
  className?: string;
}

export default function MashupIndicator({
  isMashup,
  songCount,
  songTitles,
  variant = "default",
  className,
}: MashupIndicatorProps): ReactElement | null {
  if (!isMashup) {
    return null;
  }

  const count = songCount || songTitles?.length || 2;
  const titles = songTitles?.join(" • ");

  // Minimal variant - just an icon
  if (variant === "minimal") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn("inline-flex", className)}
              role="img"
              aria-label={`Mashup arrangement${titles ? `: ${titles}` : ""}`}
            >
              <Layers className="h-4 w-4 text-primary" aria-hidden="true" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-medium">Mashup Arrangement</p>
            {titles && (
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                {titles}
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Detailed variant - full badge with song info
  if (variant === "detailed") {
    return (
      <div className={cn("space-y-2", className)}>
        <Badge
          variant="secondary"
          className="gap-1"
          role="status"
          aria-label={`Mashup arrangement containing ${count} songs`}
        >
          <Layers className="h-3 w-3" aria-hidden="true" />
          Mashup ({count} songs)
        </Badge>
        {songTitles && songTitles.length > 0 && (
          <div className="space-y-1">
            {songTitles.map((title, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Music2 className="h-3 w-3" aria-hidden="true" />
                <span>{title}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Default variant - badge with tooltip
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="secondary"
            className={cn("gap-1", className)}
            role="status"
            aria-label={`Mashup arrangement${titles ? `: ${titles}` : ""}`}
          >
            <Layers className="h-3 w-3" aria-hidden="true" />
            Mashup
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{count} songs combined</p>
          {titles && (
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              {titles}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
