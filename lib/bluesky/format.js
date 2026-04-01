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
export function graphemeLength(text) {
    // Intl.Segmenter is available in Node 16+ and modern browsers but not in
    // all TS lib targets. Use a runtime check with type assertion.
    const SegmenterCtor = Intl.Segmenter;
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
export function truncate(text, maxLength) {
    if (maxLength <= 0)
        return '';
    if (maxLength === 1)
        return '\u2026';
    if (graphemeLength(text) <= maxLength)
        return text;
    // Reserve space for ellipsis
    const SegmenterCtor = Intl.Segmenter;
    const segments = SegmenterCtor
        ? [...new SegmenterCtor('en', { granularity: 'grapheme' }).segment(text)]
        : [...text].map((s) => ({ segment: s }));
    return (segments
        .slice(0, maxLength - 1)
        .map((s) => s.segment)
        .join('') + '\u2026');
}
/**
 * Thread indicator overhead.
 * Suffix: "\n(1/2 🧵)" = 9 graphemes (newline + indicator).
 * Reserve enough for two-digit part numbers.
 */
const THREAD_INDICATOR_RESERVE = 11;
/**
 * Add thread indicators to multi-part posts.
 * Post 1: indicator appended to the last line (same line as hashtags).
 * Posts 2+: indicator on its own line.
 */
function addThreadIndicators(parts) {
    if (parts.length <= 1)
        return parts;
    const total = parts.length;
    return parts.map((text, i) => {
        const indicator = `(${i + 1}/${total} \u{1F9F5})`;
        if (i === 0)
            return `${text} ${indicator}`;
        return `${text}\n\n${indicator}`;
    });
}
/**
 * Split text into chunks that fit within the character limit.
 * Splits on newline boundaries. Lines exceeding the limit are truncated.
 * Multi-part results get thread continuation indicators.
 *
 * Returns an array of strings, each within the character limit.
 */
export function splitForThread(text, options = {}) {
    const { maxLength = POST_CHAR_LIMIT, hashtags, continuationHeader } = options;
    if (graphemeLength(text) <= maxLength && !hashtags?.length)
        return [text];
    // Build hashtag suffix for the first post
    const hashtagSuffix = hashtags?.length ? '\n\n' + hashtags.join(' ') : '';
    const hashtagLen = graphemeLength(hashtagSuffix);
    // Build continuation prefix for posts 2+
    const contPrefix = continuationHeader ? continuationHeader + '\n\n' : '';
    const contPrefixLen = graphemeLength(contPrefix);
    // Reserve space for thread indicators when splitting
    const effectiveMax = maxLength - THREAD_INDICATOR_RESERVE;
    // First chunk also needs room for hashtags
    const firstMax = effectiveMax - hashtagLen;
    // Continuation chunks need room for the header prefix
    const contMax = effectiveMax - contPrefixLen;
    const chunks = [];
    const lines = text.split('\n');
    let current = '';
    let isFirst = true;
    for (const line of lines) {
        const candidate = current ? current + '\n' + line : line;
        const limit = isFirst ? firstMax : contMax;
        if (graphemeLength(candidate) <= limit) {
            current = candidate;
        }
        else {
            if (current) {
                if (isFirst && hashtagSuffix) {
                    current += hashtagSuffix;
                    isFirst = false;
                }
                chunks.push(current);
            }
            // If a single line exceeds the limit, truncate it
            const lineLimit = isFirst ? firstMax : contMax;
            current = graphemeLength(line) > lineLimit ? truncate(line, lineLimit) : line;
        }
    }
    if (current) {
        if (isFirst && hashtagSuffix) {
            current += hashtagSuffix;
        }
        chunks.push(current);
    }
    // Add continuation headers to posts 2+
    if (contPrefix) {
        for (let i = 1; i < chunks.length; i++) {
            chunks[i] = contPrefix + chunks[i];
        }
    }
    return addThreadIndicators(chunks);
}
/**
 * Format a list of items into a post body, threading if needed.
 * Each item is a line prefixed with a bullet.
 * Multi-part results get thread continuation indicators.
 *
 * Returns an array of post texts (length 1 if it fits in one post).
 */
export function formatBulletList(header, items, options = {}) {
    const { maxLength = POST_CHAR_LIMIT, footer, continuationHeader } = options;
    const bulletLines = items.map((item) => `\u2022 ${item}`);
    const fullText = [header, '', ...bulletLines, ...(footer ? ['', footer] : [])].join('\n');
    if (graphemeLength(fullText) <= maxLength)
        return [fullText];
    // Reserve space for thread indicators
    const effectiveMax = maxLength - THREAD_INDICATOR_RESERVE;
    // Continuation posts get a header prefix
    const contPrefix = continuationHeader ? continuationHeader + '\n\n' : '';
    const contPrefixLen = graphemeLength(contPrefix);
    const contMax = effectiveMax - contPrefixLen;
    // Doesn't fit -- split into multiple posts.
    // Footer (hashtags) goes on the first post for discoverability.
    const footerSuffix = footer ? '\n\n' + footer : '';
    const firstPostMax = effectiveMax - graphemeLength(footerSuffix);
    const posts = [];
    let currentLines = [header, ''];
    let currentLen = graphemeLength(currentLines.join('\n'));
    let isFirstPost = true;
    for (const bullet of bulletLines) {
        const added = '\n' + bullet;
        const limit = isFirstPost ? firstPostMax : contMax;
        if (currentLen + graphemeLength(added) <= limit) {
            currentLines.push(bullet);
            currentLen += graphemeLength(added);
        }
        else {
            if (isFirstPost && footer) {
                currentLines.push('', footer);
                isFirstPost = false;
            }
            posts.push(currentLines.join('\n'));
            currentLines = [bullet];
            currentLen = graphemeLength(bullet);
        }
    }
    if (isFirstPost && footer) {
        currentLines.push('', footer);
    }
    posts.push(currentLines.join('\n'));
    // Add continuation headers to posts 2+
    if (contPrefix) {
        for (let i = 1; i < posts.length; i++) {
            posts[i] = contPrefix + posts[i];
        }
    }
    return addThreadIndicators(posts);
}
