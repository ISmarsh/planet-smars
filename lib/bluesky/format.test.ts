import { describe, it, expect } from 'vitest';
import {
  graphemeLength,
  truncate,
  splitForThread,
  formatBulletList,
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

describe('splitForThread', () => {
  it('returns single chunk when under limit', () => {
    expect(splitForThread('short post', { maxLength: 300 })).toEqual(['short post']);
  });

  it('splits on newlines with thread indicators', () => {
    const text = Array.from({ length: 10 }, (_, i) => `Line ${i}`).join('\n');
    const result = splitForThread(text, { maxLength: 40 });
    expect(result.length).toBeGreaterThan(1);
    result.forEach((chunk) => {
      expect(chunk).toContain('\u{1F9F5}');
      expect(graphemeLength(chunk)).toBeLessThanOrEqual(40);
    });
  });

  it('puts hashtags on first post only', () => {
    const text = Array.from({ length: 10 }, (_, i) => `Line ${i}`).join('\n');
    const result = splitForThread(text, { maxLength: 60, hashtags: ['#Test', '#Movies'] });
    expect(result.length).toBeGreaterThan(1);
    expect(result[0]).toContain('#Test');
    expect(result[0]).toContain('#Movies');
    for (let i = 1; i < result.length; i++) {
      expect(result[i]).not.toContain('#Test');
    }
  });

  it('returns single post with hashtags when text fits', () => {
    const result = splitForThread('Short post', { hashtags: ['#Test'] });
    expect(result).toHaveLength(1);
    expect(result[0]).toContain('Short post');
    expect(result[0]).toContain('#Test');
    expect(result[0]).not.toContain('\u{1F9F5}');
  });

  it('adds continuation header to posts 2+', () => {
    const text = Array.from({ length: 10 }, (_, i) => `Line ${i}`).join('\n');
    const result = splitForThread(text, { maxLength: 60, continuationHeader: 'Header (cont.)' });
    expect(result.length).toBeGreaterThan(1);
    expect(result[0]).not.toContain('(cont.)');
    for (let i = 1; i < result.length; i++) {
      expect(result[i]).toContain('Header (cont.)');
      expect(graphemeLength(result[i])).toBeLessThanOrEqual(60);
    }
  });

  it('handles continuation header without hashtags', () => {
    const text = Array.from({ length: 10 }, (_, i) => `Line ${i}`).join('\n');
    const result = splitForThread(text, { maxLength: 60, continuationHeader: 'Cont.' });
    expect(result.length).toBeGreaterThan(1);
    // All posts should be within limit
    result.forEach((chunk) => {
      expect(graphemeLength(chunk)).toBeLessThanOrEqual(60);
    });
  });
});

describe('formatBulletList', () => {
  it('formats a simple list in one post', () => {
    const result = formatBulletList('Header', ['Item 1', 'Item 2'], { footer: 'Footer' });
    expect(result).toHaveLength(1);
    expect(result[0]).toContain('Header');
    expect(result[0]).toContain('\u2022 Item 1');
    expect(result[0]).toContain('\u2022 Item 2');
    expect(result[0]).toContain('Footer');
  });

  it('splits into multiple posts when items overflow, with indicators', () => {
    const items = Array.from({ length: 20 }, (_, i) => `Movie Title ${i + 1} -- A great film about stuff`);
    const result = formatBulletList('Opening This Weekend', items);
    expect(result.length).toBeGreaterThan(1);
    result.forEach((chunk, i) => {
      expect(graphemeLength(chunk)).toBeLessThanOrEqual(POST_CHAR_LIMIT);
      expect(chunk).toContain('\u{1F9F5}');
      expect(chunk).toContain(`${i + 1}/${result.length}`);
    });
    // First post: indicator on same line (space-separated)
    expect(result[0]).toMatch(/\(1\/\d+ 🧵\)$/);
    // Continuation: indicator after blank line
    expect(result[1]).toMatch(/\n\n\(\d+\/\d+ 🧵\)$/);
  });

  it('puts footer on first post when splitting', () => {
    const items = Array.from({ length: 20 }, (_, i) => `Movie ${i + 1} -- Description here`);
    const result = formatBulletList('Header', items, { footer: '#Movies #Filmsky' });
    expect(result[0]).toContain('#Movies');
    for (let i = 1; i < result.length; i++) {
      expect(result[i]).not.toContain('#Movies');
    }
  });

  it('adds continuation header to posts 2+', () => {
    const items = Array.from({ length: 20 }, (_, i) => `Movie ${i + 1} -- Description here`);
    const result = formatBulletList('Header', items, { continuationHeader: 'Header (cont.)' });
    expect(result.length).toBeGreaterThan(1);
    expect(result[0]).not.toContain('(cont.)');
    for (let i = 1; i < result.length; i++) {
      expect(result[i]).toContain('Header (cont.)');
      expect(graphemeLength(result[i])).toBeLessThanOrEqual(POST_CHAR_LIMIT);
    }
  });

  it('stays within limit with continuation header and no footer', () => {
    const items = Array.from({ length: 20 }, (_, i) => `Movie ${i + 1} -- Description here`);
    const result = formatBulletList('Header', items, { continuationHeader: 'Header (cont.)' });
    result.forEach((chunk) => {
      expect(graphemeLength(chunk)).toBeLessThanOrEqual(POST_CHAR_LIMIT);
    });
  });
});
