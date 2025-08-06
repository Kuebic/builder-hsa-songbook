/**
 * Overlay component that provides syntax highlighting for ChordPro content
 */

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useSyntaxHighlight } from "@features/songs/hooks/useSyntaxHighlight";

interface SyntaxHighlighterProps {
  content: string;
  fontSize?: number;
  theme?: "light" | "dark" | "stage";
  scrollTop?: number;
  scrollLeft?: number;
  className?: string;
}

export const ChordProSyntaxHighlighter: React.FC<SyntaxHighlighterProps> = ({
  content,
  fontSize = 14,
  theme = "light",
  scrollTop = 0,
  scrollLeft = 0,
  className,
}) => {
  const highlightRef = useRef<HTMLDivElement>(null);
  const segments = useSyntaxHighlight(content);

  /**
   * Sync scroll position with textarea
   */
  useEffect(() => {
    if (highlightRef.current) {
      highlightRef.current.scrollTop = scrollTop;
      highlightRef.current.scrollLeft = scrollLeft;
    }
  }, [scrollTop, scrollLeft]);

  /**
   * Get theme-specific adjustments for syntax elements
   */
  const getThemeAdjustedClassName = (baseClassName: string) => {
    if (!baseClassName) {
      return "";
    }

    // Stage theme adjustments - make everything more yellow/gold
    if (theme === "stage") {
      return baseClassName
        .replace("text-blue-600", "text-yellow-400")
        .replace("text-blue-400", "text-yellow-300")
        .replace("text-green-600", "text-amber-400")
        .replace("text-green-400", "text-amber-300")
        .replace("text-purple-600", "text-orange-400")
        .replace("text-purple-400", "text-orange-300")
        .replace("text-gray-500", "text-gray-400")
        .replace("text-gray-400", "text-gray-300");
    }

    return baseClassName;
  };

  /**
   * Get base text color based on theme
   */
  const getBaseTextColor = () => {
    switch (theme) {
      case "dark":
        return "text-gray-100";
      case "stage":
        return "text-yellow-100";
      default:
        return "text-gray-900";
    }
  };

  /**
   * Render highlighted content preserving whitespace
   */
  const renderHighlightedContent = () => {
    return segments.map((segment, index) => {
      const className = getThemeAdjustedClassName(segment.className);

      if (segment.type === "text") {
        // Split by newlines to preserve line breaks
        const lines = segment.text.split("\n");
        return lines.map((line, lineIndex) => (
          <React.Fragment key={`${index}-${lineIndex}`}>
            {lineIndex > 0 && "\n"}
            <span className={getBaseTextColor()}>{line}</span>
          </React.Fragment>
        ));
      }

      return (
        <span key={index} className={className}>
          {segment.text}
        </span>
      );
    });
  };

  return (
    <div
      ref={highlightRef}
      className={cn(
        "absolute inset-0 p-3 font-mono overflow-auto pointer-events-none whitespace-pre-wrap",
        getBaseTextColor(),
        className,
      )}
      style={{
        fontSize: `${fontSize}px`,
        lineHeight: "1.5",
        wordBreak: "break-word",
      }}
      aria-hidden="true"
    >
      {renderHighlightedContent()}
    </div>
  );
};
