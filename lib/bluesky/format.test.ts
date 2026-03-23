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
    // Film clapper emoji
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
    expect(splitForThread('short post', 300)).toEqual(['short post']);
  });

  it('splits on newlines', () => {
    const line = 'A'.repeat(20);
    const text = [line, line, line].join('\n');
    const result = splitForThread(text, 25);
    expect(result.length).toBeGreaterThan(1);
    result.forEach((chunk) => {
      expect(graphemeLength(chunk)).toBeLessThanOrEqual(25);
    });
  });
});

describe('formatBulletList', () => {
  it('formats a simple list in one post', () => {
    const result = formatBulletList('Header', ['Item 1', 'Item 2'], 'Footer');
    expect(result).toHaveLength(1);
    expect(result[0]).toContain('Header');
    expect(result[0]).toContain('\u2022 Item 1');
    expect(result[0]).toContain('\u2022 Item 2');
    expect(result[0]).toContain('Footer');
  });

  it('splits into multiple posts when items overflow', () => {
    const items = Array.from({ length: 20 }, (_, i) => `Movie Title ${i + 1} -- A great film about stuff`);
    const result = formatBulletList('Opening This Weekend', items);
    expect(result.length).toBeGreaterThan(1);
    result.forEach((chunk) => {
      expect(graphemeLength(chunk)).toBeLessThanOrEqual(POST_CHAR_LIMIT);
    });
  });

  it('includes footer in last post', () => {
    const items = Array.from({ length: 20 }, (_, i) => `Movie ${i + 1} -- Description here`);
    const result = formatBulletList('Header', items, 'What are you seeing?');
    const last = result[result.length - 1];
    expect(last).toContain('What are you seeing?');
  });
});
