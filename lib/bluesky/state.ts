/**
 * Tracking state management for Bluesky bots.
 *
 * Persists a JSON file mapping content IDs (slugs, TMDB IDs, etc.)
 * to Bluesky post uri/cid pairs. Used for deduplication -- skip items
 * that have already been posted.
 *
 * The GHA workflow auto-commits the state file after each run using
 * stefanzweifel/git-auto-commit-action.
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import type { TrackingEntry, TrackingState } from './types';

/**
 * Load tracking state from a JSON file.
 * Returns empty object if file doesn't exist.
 *
 * Handles migration from legacy array format (bio's .crossposted.json)
 * to the current object format.
 */
export function loadState(filePath: string): TrackingState {
  if (!existsSync(filePath)) return {};

  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch (err) {
    console.error(`Warning: failed to read state file ${filePath}, starting fresh:`, err);
    return {};
  }

  // Migrate legacy array format -> object format
  if (Array.isArray(raw)) {
    const migrated: TrackingState = {};
    for (const id of raw) {
      migrated[id] = { uri: null, cid: null };
    }
    return migrated;
  }

  // Validate shape: must be a non-null plain object
  if (typeof raw !== 'object' || raw === null) {
    console.error(`Warning: state file ${filePath} has unexpected shape, starting fresh.`);
    return {};
  }

  return raw as TrackingState;
}

/**
 * Save tracking state to a JSON file.
 * Writes with trailing newline for clean git diffs.
 */
export function saveState(filePath: string, state: TrackingState): void {
  writeFileSync(filePath, JSON.stringify(state, null, 2) + '\n');
}

/** Check if an ID has already been tracked (posted). */
export function isTracked(state: TrackingState, id: string): boolean {
  return Object.hasOwn(state, id);
}

/** Mark an ID as posted with its Bluesky uri/cid. */
export function track(
  state: TrackingState,
  id: string,
  entry: TrackingEntry,
): TrackingState {
  return { ...state, [id]: entry };
}

/**
 * Remove entries older than maxAgeDays based on a dateExtractor.
 * Useful for watchlist cleanup (e.g. remove films older than 180 days).
 */
export function pruneStale(
  state: TrackingState,
  maxAgeDays: number,
  dateExtractor: (id: string, entry: TrackingEntry) => Date | null,
): TrackingState {
  const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
  const pruned: TrackingState = {};

  for (const [id, entry] of Object.entries(state)) {
    const date = dateExtractor(id, entry);
    if (!date || date.getTime() >= cutoff) {
      pruned[id] = entry;
    }
  }

  return pruned;
}
