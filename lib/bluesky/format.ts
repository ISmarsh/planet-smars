/**
 * Post formatting utilities for Bluesky's 300-character limit.
 *
 * Handles truncation, thread splitting, and grapheme-aware length counting.
 * Bluesky uses grapheme clusters for length, not UTF-16 code units.
 */

/** Bluesky's post character limit (in grapheme clusters). */
export const POST_CHAR_LIMIT = 300;

/**
 * Count grapheme clusters in a string.
 * Bluesky counts characters as grapheme clusters, not code points or UTF-16 units.
 * Uses Intl.Segmenter where available (Node 16+), falls back to spread.
 */
export function graphemeLength(text: string): number {
  // Intl.Segmenter is available in Node 16+ and modern browsers but not in
  // all TS lib targets. Use a runtime check with type assertion.
  const SegmenterCtor = (Intl as Record<string, unknown>).Segmenter as
    | (new (locale: string, opts: { granularity: string }) => { segment(s: string): Iterable<{ segment: string }> })
    | undefined;

  if (SegmenterCtor) {
    const segmenter = new SegmenterCtor('en', { granularity: 'grapheme' });
    return [...segmenter.segment(text)].length;
  }
  // Fallback: spread handles most emoji but not all ZWJ sequences
  return [...text].length;
}

/**
 * Truncate text to fit within a character limit, appending an ellipsis if needed.
 * Uses grapheme-aware counting.
 */
export function truncate(text: string, maxLength: number): string {
  if (graphemeLength(text) <= maxLength) return text;

  // Reserve space for ellipsis
  const SegmenterCtor = (Intl as Record<string, unknown>).Segmenter as
    | (new (locale: string, opts: { granularity: string }) => { segment(s: string): Iterable<{ segment: string }> })
    | undefined;

  const segments = SegmenterCtor
    ? [...new SegmenterCtor('en', { granularity: 'grapheme' }).segment(text)]
    : [...text].map((s) => ({ segment: s }));

  return (
    segments
      .slice(0, maxLength - 1)
      .map((s) => s.segment)
      .join('') + '\u2026'
  );
}

/**
 * Split text into chunks that fit within the character limit.
 * Splits on newlines or sentence boundaries where possible.
 *
 * Returns an array of strings, each within POST_CHAR_LIMIT.
 */
export function splitForThread(
  text: string,
  maxLength = POST_CHAR_LIMIT,
): string[] {
  if (graphemeLength(text) <= maxLength) return [text];

  const chunks: string[] = [];
  const lines = text.split('\n');
  let current = '';

  for (const line of lines) {
    const candidate = current ? current + '\n' + line : line;

    if (graphemeLength(candidate) <= maxLength) {
      current = candidate;
    } else {
      if (current) chunks.push(current);
      // If a single line exceeds the limit, truncate it
      current = graphemeLength(line) > maxLength ? truncate(line, maxLength) : line;
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

/**
 * Format a list of items into a post body, threading if needed.
 * Each item is a line prefixed with a bullet.
 *
 * Returns an array of post texts (length 1 if it fits in one post).
 */
export function formatBulletList(
  header: string,
  items: string[],
  footer?: string,
  maxLength = POST_CHAR_LIMIT,
): string[] {
  const bulletLines = items.map((item) => `\u2022 ${item}`);
  const fullText = [header, '', ...bulletLines, ...(footer ? ['', footer] : [])].join('\n');

  if (graphemeLength(fullText) <= maxLength) return [fullText];

  // Doesn't fit -- split into multiple posts
  const posts: string[] = [];
  let currentLines = [header, ''];
  let currentLen = graphemeLength(currentLines.join('\n'));

  for (const bullet of bulletLines) {
    const added = '\n' + bullet;
    if (currentLen + graphemeLength(added) <= maxLength) {
      currentLines.push(bullet);
      currentLen += graphemeLength(added);
    } else {
      posts.push(currentLines.join('\n'));
      currentLines = [bullet];
      currentLen = graphemeLength(bullet);
    }
  }

  // Add footer to last chunk if it fits, otherwise make a new post
  if (footer) {
    const footerAdded = '\n\n' + footer;
    if (currentLen + graphemeLength(footerAdded) <= maxLength) {
      currentLines.push('', footer);
    } else {
      posts.push(currentLines.join('\n'));
      currentLines = [footer];
    }
  }

  posts.push(currentLines.join('\n'));
  return posts;
}
