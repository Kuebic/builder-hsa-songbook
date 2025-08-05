/**
 * @fileoverview Hook for ChordPro syntax highlighting
 */

import { useMemo } from 'react';

interface HighlightSegment {
  type: 'text' | 'chord' | 'directive' | 'comment' | 'section';
  text: string;
  className: string;
}

export function useSyntaxHighlight(content: string): HighlightSegment[] {
  return useMemo(() => {
    if (!content) return [];

    const segments: HighlightSegment[] = [];
    let currentIndex = 0;

    // Regex patterns for different ChordPro elements
    const patterns = [
      // Chords: [C], [Am], [G/B]
      { regex: /\[[\w#b/]+\]/g, type: 'chord' as const, className: 'text-blue-600 dark:text-blue-400 font-bold' },
      // Comments: {comment: ...}, {c: ...}
      { regex: /\{(comment|c):[^}]*\}/g, type: 'comment' as const, className: 'text-gray-500 dark:text-gray-400' },
      // Sections: {start_of_chorus}, {soc}, etc.
      { regex: /\{(start_of_|end_of_|soc|eoc|sov|eov|sob|eob|sot|eot)\}/g, type: 'section' as const, className: 'text-purple-600 dark:text-purple-400 font-medium' },
      // Other directives: {title: ...}, {key: ...}
      { regex: /\{[^}]*\}/g, type: 'directive' as const, className: 'text-green-600 dark:text-green-400 font-medium' },
    ];

    // Find all matches and their positions
    const matches: Array<{ match: RegExpMatchArray; type: string; className: string }> = [];
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.regex.exec(content)) !== null) {
        matches.push({
          match,
          type: pattern.type,
          className: pattern.className
        });
      }
    });

    // Sort matches by position
    matches.sort((a, b) => a.match.index! - b.match.index!);

    // Build segments
    for (const matchData of matches) {
      const match = matchData.match;
      const start = match.index!;
      const end = start + match[0].length;

      // Add text before this match
      if (currentIndex < start) {
        const textBefore = content.slice(currentIndex, start);
        if (textBefore) {
          segments.push({
            type: 'text',
            text: textBefore,
            className: ''
          });
        }
      }

      // Add the highlighted match
      segments.push({
        type: matchData.type as any,
        text: match[0],
        className: matchData.className
      });

      currentIndex = end;
    }

    // Add remaining text
    if (currentIndex < content.length) {
      const remainingText = content.slice(currentIndex);
      if (remainingText) {
        segments.push({
          type: 'text',
          text: remainingText,
          className: ''
        });
      }
    }

    return segments;
  }, [content]);
}
