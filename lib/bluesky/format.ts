/**
 * Post formatting utilities for Bluesky's 300-character limit.
 *
 * Handles truncation, thread splitting, and grapheme-aware length counting.
 * Bluesky uses grapheme clusters for length, not UTF-16 code units.
 */

/** Bluesky's post character limit (in grapheme clusters). */
export const POST_CHAR_LIMIT = 300;

/**
 * Thread indicator overhead per post.
 * Format: " (1/2 🧵)" on first post, "\n\n(2/2 🧵)" on continuations.
 * Reserve enough for two-digit part numbers.
 */
const THREAD_INDICATOR_RESERVE = 11;

// Intl.Segmenter type — available in Node 16+ but not in all TS lib targets.
type SegmenterCtor = new (
  locale: string,
  opts: { granularity: string },
) => { segment(s: string): Iterable<{ segment: string }> };

function getSegmenter(): SegmenterCtor | undefined {
  return (Intl as Record<string, unknown>).Segmenter as SegmenterCtor | undefined;
}

/**
 * Count grapheme clusters in a string.
 * Bluesky counts characters as grapheme clusters, not code points or UTF-16 units.
 */
export function graphemeLength(text: string): number {
  const Ctor = getSegmenter();
  if (Ctor) return [...new Ctor('en', { granularity: 'grapheme' }).segment(text)].length;
  return [...text].length;
}

/**
 * Truncate text to fit within a character limit, appending an ellipsis if needed.
 */
export function truncate(text: string, maxLength: number): string {
  if (maxLength <= 0) return '';
  if (maxLength === 1) return '\u2026';
  if (graphemeLength(text) <= maxLength) return text;

  const Ctor = getSegmenter();
  const segments = Ctor
    ? [...new Ctor('en', { granularity: 'grapheme' }).segment(text)]
    : [...text].map((s) => ({ segment: s }));

  return (
    segments
      .slice(0, maxLength - 1)
      .map((s) => s.segment)
      .join('') + '\u2026'
  );
}

/**
 * Add thread indicators to multi-part posts.
 * Post 1: indicator appended to the last line (same line as hashtags).
 * Posts 2+: indicator on its own line with extra spacing.
 */
function addThreadIndicators(parts: string[]): string[] {
  if (parts.length <= 1) return parts;
  const total = parts.length;
  return parts.map((text, i) => {
    const indicator = `(${i + 1}/${total} \u{1F9F5})`;
    return i === 0 ? `${text} ${indicator}` : `${text}\n\n${indicator}`;
  });
}

/** Options for {@link splitForThread}. */
export interface SplitOptions {
  /** Character limit per post. Default: POST_CHAR_LIMIT (300). */
  maxLength?: number;
  /** Hashtags to append to the first post only (e.g. ['#Movies', '#Filmsky']). */
  hashtags?: string[];
  /** Header to prepend to continuation posts (e.g. "▶️ New on Streaming (cont.)"). */
  continuationHeader?: string;
}

/**
 * Split text into chunks that fit within the character limit.
 * Splits on newline boundaries. Lines exceeding the limit are truncated.
 * Multi-part results get thread continuation indicators.
 *
 * Returns an array of strings, each within the character limit.
 */
export function splitForThread(
  text: string,
  options: SplitOptions = {},
): string[] {
  const { maxLength = POST_CHAR_LIMIT, hashtags, continuationHeader } = options;

  // Build hashtag suffix for the first post
  const hashtagSuffix = hashtags?.length ? '\n\n' + hashtags.join(' ') : '';

  // Early return: fits in one post with hashtags, no splitting needed
  if (graphemeLength(text + hashtagSuffix) <= maxLength) {
    return [hashtagSuffix ? text + hashtagSuffix : text];
  }

  // Build continuation prefix for posts 2+
  const contPrefix = continuationHeader ? continuationHeader + '\n\n' : '';

  // Compute per-post budgets, clamped to at least 1
  const effectiveMax = Math.max(1, maxLength - THREAD_INDICATOR_RESERVE);
  const firstMax = Math.max(1, effectiveMax - graphemeLength(hashtagSuffix));
  const contMax = Math.max(1, effectiveMax - graphemeLength(contPrefix));

  const chunks: string[] = [];
  const lines = text.split('\n');
  let current = '';
  let isFirst = true;

  for (const line of lines) {
    const candidate = current ? current + '\n' + line : line;
    const limit = isFirst ? firstMax : contMax;

    if (graphemeLength(candidate) <= limit) {
      current = candidate;
    } else {
      if (current) {
        if (isFirst) current += hashtagSuffix;
        chunks.push(current);
        isFirst = false;
      }
      const overflowLimit = isFirst ? firstMax : contMax;
      current = graphemeLength(line) > overflowLimit ? truncate(line, overflowLimit) : line;
    }
  }

  if (current) {
    if (isFirst) current += hashtagSuffix;
    chunks.push(current);
  }

  // Add continuation headers to posts 2+
  for (let i = 1; i < chunks.length; i++) {
    chunks[i] = contPrefix + chunks[i];
  }

  return addThreadIndicators(chunks);
}

/** A group of labeled items (e.g. movies grouped by streaming service). */
export interface ItemGroup {
  label: string;
  items: string[];
}

/** Options for {@link formatThreadSummary}. */
export interface ThreadSummaryOptions {
  /** Header for the first post (e.g. "▶️ New on Streaming (March 24 – March 31)"). */
  header: string;
  /** Header for continuation posts (e.g. "▶️ New on Streaming (March 24 – March 31, cont.)"). */
  continuationHeader: string;
  /** Flat list of items, or grouped items with labels. */
  items: string[] | ItemGroup[];
  /** Hashtags for the first post (e.g. ['#NewOnStreaming', '#Movies']). */
  hashtags: string[];
}

/**
 * Format a thread summary with automatic splitting, hashtags, continuation
 * headers, group label re-statement, and thread indicators.
 *
 * Accepts either a flat list of items (bulleted) or grouped items with
 * labels (e.g. streaming services). Handles all Bluesky threading concerns.
 *
 * Returns an array of post texts, each within POST_CHAR_LIMIT.
 */
export function formatThreadSummary(options: ThreadSummaryOptions): string[] {
  const { header, continuationHeader, items, hashtags } = options;

  // Determine if items are grouped or flat
  const isGrouped = items.length > 0 && typeof items[0] !== 'string';
  const groups = isGrouped ? (items as ItemGroup[]) : null;
  const flatItems = isGrouped ? null : (items as string[]);

  // Build the body lines
  const bodyLines: string[] = [];
  if (groups) {
    for (const group of groups) {
      bodyLines.push(`${group.label}:`);
      for (const item of group.items) {
        bodyLines.push(`\u2022 ${item}`);
      }
    }
  } else if (flatItems) {
    for (const item of flatItems) {
      bodyLines.push(`\u2022 ${item}`);
    }
  }

  // Build hashtag suffix and continuation prefix
  const hashtagSuffix = hashtags.length > 0 ? '\n\n' + hashtags.join(' ') : '';
  const contPrefix = continuationHeader + '\n\n';

  // Try single post first
  const fullText = [header, '', ...bodyLines, ...(hashtagSuffix ? [hashtagSuffix.slice(2)] : [])].join('\n');
  if (graphemeLength(fullText) <= POST_CHAR_LIMIT) return [fullText];

  // Split into multiple posts
  const effectiveMax = Math.max(1, POST_CHAR_LIMIT - THREAD_INDICATOR_RESERVE);
  const firstMax = Math.max(1, effectiveMax - graphemeLength(hashtagSuffix));
  const contMax = Math.max(1, effectiveMax - graphemeLength(contPrefix));

  const posts: string[] = [];
  let currentLines = [header, ''];
  let currentLen = graphemeLength(currentLines.join('\n'));
  let isFirst = true;
  let lastGroupLabel: string | null = null;

  for (const line of bodyLines) {
    // Track active group label
    if (line.endsWith(':') && !line.startsWith('\u2022')) {
      lastGroupLabel = line;
    }

    const added = '\n' + line;
    const limit = isFirst ? firstMax : contMax;

    if (currentLen + graphemeLength(added) <= limit) {
      currentLines.push(line);
      currentLen += graphemeLength(added);
    } else {
      // Flush current post
      if (isFirst) {
        currentLines.push('', hashtagSuffix.slice(2)); // Remove leading \n\n
      }
      posts.push(currentLines.join('\n'));
      isFirst = false;

      // Start new post — re-state group label if we're mid-group
      const needsGroupRestate = line.startsWith('\u2022') && lastGroupLabel;
      if (needsGroupRestate) {
        currentLines = [lastGroupLabel!, line];
        currentLen = graphemeLength(currentLines.join('\n'));
      } else {
        currentLines = [line];
        currentLen = graphemeLength(line);
      }
    }
  }

  // Flush final post
  if (isFirst && hashtagSuffix) {
    currentLines.push('', hashtagSuffix.slice(2));
  }
  posts.push(currentLines.join('\n'));

  // Add continuation headers to posts 2+
  for (let i = 1; i < posts.length; i++) {
    posts[i] = contPrefix + posts[i];
  }

  return addThreadIndicators(posts);
}

/** Options for {@link formatBulletList}. */
export interface BulletListOptions {
  /** Character limit per post. Default: POST_CHAR_LIMIT (300). */
  maxLength?: number;
  /** Footer text (hashtags) — placed on the first post for discoverability. */
  footer?: string;
  /** Header to prepend to continuation posts (optional). */
  continuationHeader?: string;
}

/**
 * Format a list of items into a post body, threading if needed.
 * Each item is a line prefixed with a bullet.
 * Multi-part results get thread continuation indicators.
 *
 * Returns an array of post texts (length 1 if it fits in one post).
 */
export function formatBulletList(
  header: string,
  items: string[],
  options: BulletListOptions = {},
): string[] {
  const { maxLength = POST_CHAR_LIMIT, footer, continuationHeader } = options;

  const bulletLines = items.map((item) => `\u2022 ${item}`);
  const fullText = [header, '', ...bulletLines, ...(footer ? ['', footer] : [])].join('\n');

  if (graphemeLength(fullText) <= maxLength) return [fullText];

  // Build continuation prefix for posts 2+
  const contPrefix = continuationHeader ? continuationHeader + '\n\n' : '';
  const contPrefixLen = graphemeLength(contPrefix);

  // Compute per-post budgets, clamped to at least 1
  const effectiveMax = Math.max(1, maxLength - THREAD_INDICATOR_RESERVE);
  const contMax = Math.max(1, effectiveMax - contPrefixLen);
  const footerSuffix = footer ? '\n\n' + footer : '';
  const firstPostMax = Math.max(1, effectiveMax - graphemeLength(footerSuffix));

  const posts: string[] = [];
  let currentLines = [header, ''];
  let currentLen = graphemeLength(currentLines.join('\n'));
  let isFirstPost = true;

  for (const bullet of bulletLines) {
    const added = '\n' + bullet;
    const limit = isFirstPost ? firstPostMax : contMax;
    if (currentLen + graphemeLength(added) <= limit) {
      currentLines.push(bullet);
      currentLen += graphemeLength(added);
    } else {
      if (isFirstPost && footer) {
        currentLines.push('', footer);
      }
      posts.push(currentLines.join('\n'));
      isFirstPost = false;
      currentLines = [bullet];
      currentLen = graphemeLength(bullet);
    }
  }

  if (isFirstPost && footer) {
    currentLines.push('', footer);
  }

  posts.push(currentLines.join('\n'));

  // Add continuation headers to posts 2+
  for (let i = 1; i < posts.length; i++) {
    posts[i] = contPrefix + posts[i];
  }

  return addThreadIndicators(posts);
}
