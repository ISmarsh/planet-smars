/**
 * Shared types for Bluesky posting utilities.
 *
 * Used by bot projects (ttrpg-releases-bot, movie-releases-bot) and
 * bio's crosspost workflow.
 */

/** Bluesky credentials from environment variables. */
export interface BlueskyCredentials {
  handle: string;
  appPassword: string;
}

/** A post to send to Bluesky. */
export interface BlueskyPost {
  text: string;
  /** Link card embed (uri, title, description). */
  embed?: {
    uri: string;
    title: string;
    description: string;
  };
  /** Reply to an existing post. */
  replyTo?: {
    uri: string;
    cid: string;
  };
}

/** Result of a successful post. */
export interface PostResult {
  uri: string;
  cid: string;
}

/** Entry in a tracking/state file mapping IDs to posted uri/cid. */
export interface TrackingEntry {
  uri: string | null;
  cid: string | null;
}

/** Shape of a tracking state file (key -> TrackingEntry). */
export type TrackingState = Record<string, TrackingEntry>;
