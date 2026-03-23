import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { loadState, saveState, isTracked, track, pruneStale } from './state';
import type { TrackingState } from './types';

describe('state', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'bluesky-state-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  describe('loadState', () => {
    it('returns empty object for missing file', () => {
      expect(loadState(join(dir, 'nope.json'))).toEqual({});
    });

    it('loads object format', () => {
      const state: TrackingState = {
        'movie-123': { uri: 'at://did/post/abc', cid: 'cid123' },
      };
      writeFileSync(join(dir, 'state.json'), JSON.stringify(state));
      expect(loadState(join(dir, 'state.json'))).toEqual(state);
    });

    it('migrates legacy array format', () => {
      writeFileSync(join(dir, 'state.json'), JSON.stringify(['slug-1', 'slug-2']));
      const result = loadState(join(dir, 'state.json'));
      expect(result).toEqual({
        'slug-1': { uri: null, cid: null },
        'slug-2': { uri: null, cid: null },
      });
    });
  });

  describe('saveState', () => {
    it('writes JSON with trailing newline', () => {
      const path = join(dir, 'out.json');
      saveState(path, { foo: { uri: 'u', cid: 'c' } });
      const raw = readFileSync(path, 'utf-8');
      expect(raw.endsWith('\n')).toBe(true);
      expect(JSON.parse(raw)).toEqual({ foo: { uri: 'u', cid: 'c' } });
    });
  });

  describe('isTracked', () => {
    it('returns true for tracked IDs', () => {
      const state: TrackingState = { abc: { uri: 'u', cid: 'c' } };
      expect(isTracked(state, 'abc')).toBe(true);
    });

    it('returns false for untracked IDs', () => {
      expect(isTracked({}, 'abc')).toBe(false);
    });
  });

  describe('track', () => {
    it('adds an entry immutably', () => {
      const state: TrackingState = {};
      const next = track(state, 'new', { uri: 'u', cid: 'c' });
      expect(next).toEqual({ new: { uri: 'u', cid: 'c' } });
      expect(state).toEqual({}); // original unchanged
    });
  });

  describe('pruneStale', () => {
    it('removes entries older than maxAgeDays', () => {
      const state: TrackingState = {
        old: { uri: 'u1', cid: 'c1' },
        new: { uri: 'u2', cid: 'c2' },
      };

      const result = pruneStale(state, 30, (id) => {
        if (id === 'old') return new Date('2020-01-01');
        return new Date(); // now
      });

      expect(result).toEqual({ new: { uri: 'u2', cid: 'c2' } });
    });

    it('keeps entries with null date', () => {
      const state: TrackingState = { unknown: { uri: null, cid: null } };
      const result = pruneStale(state, 30, () => null);
      expect(result).toEqual(state);
    });
  });
});
