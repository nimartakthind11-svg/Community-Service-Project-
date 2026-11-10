/**
 * searchUtils.ts — Pure text search highlighting and snippet utilities.
 * Offline-safe, no external dependencies, easily unit-tested in Node.
 */

export interface HighlightSegment {
  text: string;
  isMatch: boolean;
}

/**
 * Splits text into segments marked with isMatch: true / false for highlighting.
 */
export function highlightMatches(text: string, query: string): HighlightSegment[] {
  if (!text) return [];
  const trimmed = query.trim();
  if (!trimmed) {
    return [{ text, isMatch: false }];
  }

  // Escape special regex characters in query
  const escapedQuery = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  const parts = text.split(regex);

  const segments: HighlightSegment[] = [];
  for (const part of parts) {
    if (!part) continue;
    const isMatch = part.toLowerCase() === trimmed.toLowerCase();
    segments.push({ text: part, isMatch });
  }

  return segments;
}

/**
 * Extracts a concise snippet centered around the query match.
 */
export function extractSnippet(
  text: string,
  query: string,
  maxLength: number = 100
): string {
  if (!text) return '';
  const trimmed = query.trim();
  if (!trimmed) {
    return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
  }

  const lowerText = text.toLowerCase();
  const lowerQuery = trimmed.toLowerCase();
  const matchIndex = lowerText.indexOf(lowerQuery);

  if (matchIndex === -1) {
    return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
  }

  const contextBefore = 30;
  const start = Math.max(0, matchIndex - contextBefore);
  const end = Math.min(text.length, matchIndex + query.length + (maxLength - contextBefore));

  let snippet = text.slice(start, end).trim();
  if (start > 0) snippet = `…${snippet}`;
  if (end < text.length) snippet = `${snippet}…`;

  return snippet;
}

