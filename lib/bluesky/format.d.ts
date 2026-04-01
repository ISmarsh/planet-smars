/**
 * Post formatting utilities for Bluesky's 300-character limit.
 *
 * Handles truncation, thread splitting, and grapheme-aware length counting.
 * Bluesky uses grapheme clusters for length, not UTF-16 code units.
 */
/** Bluesky's post character limit (in grapheme clusters). */
export declare const POST_CHAR_LIMIT = 300;
/**
 * Count grapheme clusters in a string.
 * Bluesky counts characters as grapheme clusters, not code points or UTF-16 units.
 * Uses Intl.Segmenter where available (Node 16+), falls back to spread.
 */
export declare function graphemeLength(text: string): number;
/**
 * Truncate text to fit within a character limit, appending an ellipsis if needed.
 * Uses grapheme-aware counting.
 */
export declare function truncate(text: string, maxLength: number): string;
/** Options for {@link splitForThread}. */
export interface SplitOptions {
    /** Character limit per post. Default: POST_CHAR_LIMIT (300). */
    maxLength?: number;
    /** Hashtags to append to the first post only (e.g. ['#Movies', '#Filmsky']). */
    hashtags?: string[];
    /** Header to prepend to continuation posts (e.g. "▶️ New on Streaming (March 24, continued)"). */
    continuationHeader?: string;
}
/**
 * Split text into chunks that fit within the character limit.
 * Splits on newline boundaries. Lines exceeding the limit are truncated.
 * Multi-part results get thread continuation indicators.
 *
 * Returns an array of strings, each within the character limit.
 */
export declare function splitForThread(text: string, options?: SplitOptions): string[];
/** Options for {@link formatBulletList}. */
export interface BulletListOptions {
    /** Character limit per post. Default: POST_CHAR_LIMIT (300). */
    maxLength?: number;
    /** Footer text (hashtags) — placed on the first post for discoverability. */
    footer?: string;
    /** Header to prepend to continuation posts. Derived from the main header if not provided. */
    continuationHeader?: string;
}
/**
 * Format a list of items into a post body, threading if needed.
 * Each item is a line prefixed with a bullet.
 * Multi-part results get thread continuation indicators.
 *
 * Returns an array of post texts (length 1 if it fits in one post).
 */
export declare function formatBulletList(header: string, items: string[], options?: BulletListOptions): string[];
