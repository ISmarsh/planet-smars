import { describe, it, expect } from 'vitest';
import {
  graphemeLength,
  truncate,
  formatThreadSummary,
  POST_CHAR_LIMIT,
} from './format';

describe('graphemeLength', () => {
  it('counts ASCII characters', () => {
    expect(graphemeLength('hello')).toBe(5);
  });

  it('counts emoji as single graphemes', () => {
    expect(graphemeLength('\uD83C\uDFAC')).toBe(1);
    expect(graphemeLength('Movie \uD83C\uDFAC night')).toBe(13);
  });

  it('handles empty string', () => {
    expect(graphemeLength('')).toBe(0);
  });
});

describe('truncate', () => {
  it('returns text unchanged when under limit', () => {
    expect(truncate('short', 10)).toBe('short');
  });

  it('truncates with ellipsis when over limit', () => {
    const result = truncate('hello world', 8);
    expect(graphemeLength(result)).toBe(8);
    expect(result.endsWith('\u2026')).toBe(true);
    expect(result).toBe('hello w\u2026');
  });

  it('handles exact limit', () => {
    expect(truncate('exact', 5)).toBe('exact');
  });

  it('handles zero maxLength', () => {
    expect(truncate('hello', 0)).toBe('');
  });

  it('handles maxLength of 1', () => {
    expect(truncate('hello', 1)).toBe('\u2026');
  });
});

describe('formatThreadSummary', () => {
  it('formats a flat list in one post when it fits', () => {
    const result = formatThreadSummary({
      header: 'Header',
      continuationHeader: 'Header (cont.)',
      items: ['Movie A', 'Movie B'],
      hashtags: ['#Movies'],
    });
    expect(result).toHaveLength(1);
    expect(result[0]).toContain('Header');
    expect(result[0]).toContain('\u2022 Movie A');
    expect(result[0]).toContain('\u2022 Movie B');
    expect(result[0]).toContain('#Movies');
    expect(result[0]).not.toContain('\u{1F9F5}');
  });

  it('splits flat list with hashtags on first post and indicators', () => {
    const items = Array.from({ length: 20 }, (_, i) => `Movie Title ${i + 1} -- A great film`);
    const result = formatThreadSummary({
      header: 'Opening This Weekend',
      continuationHeader: 'Opening This Weekend (cont.)',
      items,
      hashtags: ['#Movies', '#Filmsky'],
    });
    expect(result.length).toBeGreaterThan(1);
    // First post has hashtags and indicator
    expect(result[0]).toContain('#Movies');
    expect(result[0]).toContain('\u{1F9F5}');
    // Continuation has header and indicator, no hashtags
    expect(result[1]).toContain('(cont.)');
    expect(result[1]).toContain('\u{1F9F5}');
    expect(result[1]).not.toContain('#Movies');
    // First post: indicator on same line as hashtags
    expect(result[0]).toMatch(/\(1\/\d+ \u{1F9F5}\)$/u);
    // Continuation: indicator after blank line
    expect(result[1]).toMatch(/\n\n\(\d+\/\d+ \u{1F9F5}\)$/u);
    // All within limit
    result.forEach((chunk) => {
      expect(graphemeLength(chunk)).toBeLessThanOrEqual(POST_CHAR_LIMIT);
    });
  });

  it('formats grouped items with service labels', () => {
    const result = formatThreadSummary({
      header: 'New on Streaming',
      continuationHeader: 'New on Streaming (cont.)',
      items: [
        { label: 'Netflix', items: ['Movie A', 'Movie B'] },
        { label: 'Hulu', items: ['Movie C'] },
      ],
      hashtags: ['#Streaming'],
    });
    expect(result).toHaveLength(1);
    expect(result[0]).toContain('Netflix:');
    expect(result[0]).toContain('\u2022 Movie A');
    expect(result[0]).toContain('Hulu:');
    expect(result[0]).toContain('\u2022 Movie C');
  });

  it('re-states group label on continuation when split mid-group', () => {
    const movies = Array.from({ length: 15 }, (_, i) => `Movie Title ${i + 1} That Is Quite Long`);
    const result = formatThreadSummary({
      header: 'New on Streaming',
      continuationHeader: 'New on Streaming (cont.)',
      items: [
        { label: 'Peacock', items: movies },
        { label: 'Netflix', items: ['Bohemian Rhapsody'] },
      ],
      hashtags: ['#Streaming'],
    });
    expect(result.length).toBeGreaterThan(1);
    // First post starts with Peacock
    expect(result[0]).toContain('Peacock:');
    // Continuation should re-state Peacock: if split mid-group
    if (result[1].includes('\u2022 Movie Title')) {
      expect(result[1]).toContain('Peacock:');
    }
    // All within limit
    result.forEach((chunk) => {
      expect(graphemeLength(chunk)).toBeLessThanOrEqual(POST_CHAR_LIMIT);
    });
  });
});
