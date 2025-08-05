/**
 * @fileoverview Overlay component that provides syntax highlighting for ChordPro content
 */

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useSyntaxHighlight } from "./hooks/useSyntaxHighlight";

interface SyntaxHighlighterProps {
  content: string;
  fontSize: number;
  theme: "light" | "dark" | "stage";
  scrollTop: number;
  scrollLeft: number;
  className?: string;
}

export const SyntaxHighlighter: React.FC<SyntaxHighlighterProps> = ({
  content,
  fontSize,
  theme,
  scrollTop,
  scrollLeft,
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
   * Get theme-specific classes for syntax elements
   */
  const getThemeClasses = (baseClassName: string) => {
    if (!baseClassName) return "";

    switch (theme) {
      case "dark":
        return baseClassName
          .replace("text-blue-600", "text-blue-400")
          .replace("text-green-600", "text-green-400")
          .replace("text-purple-600", "text-purple-400")
          .replace("text-gray-500", "text-gray-400");
      case "stage":
        return baseClassName
          .replace("text-blue-600", "text-yellow-300")
          .replace("text-green-600", "text-green-300")
          .replace("text-purple-600", "text-purple-300")
          .replace("text-gray-500", "text-gray-300");
      default:
        return baseClassName;
    }
  };

  /**
   * Render highlighted content
   */
  const renderHighlightedContent = () => {
    return segments.map((segment, index) => {
      if (segment.type === "text") {
        // Preserve whitespace and line breaks
        return segment.text.split("\n").map((line, lineIndex) => (
          <React.Fragment key={`${index}-${lineIndex}`}>
            {lineIndex > 0 && <br />}
            {line}
          </React.Fragment>
        ));
      }

      return (
        <span key={index} className={getThemeClasses(segment.className)}>
          {segment.text}
        </span>
      );
    });
  };

  return (
    <div
      ref={highlightRef}
      className={cn(
        "absolute inset-0 p-3 font-mono pointer-events-none overflow-hidden whitespace-pre-wrap break-words text-left text-transparent",
        className,
      )}
      style={{
        fontSize: `${fontSize}px`,
        lineHeight: "1.5",
      }}
      aria-hidden="true"
    >
      <div className="text-foreground">{renderHighlightedContent()}</div>
    </div>
  );
};
