import { describe, it, expect } from 'vitest';
import { slugify, formatDate } from '@/lib/utils';

describe('slugify', () => {
  it('converts to lowercase kebab-case', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('strips special characters', () => {
    expect(slugify('Art & Design: Saigon 2026!')).toBe('art-design-saigon-2026');
  });

  it('collapses multiple separators', () => {
    expect(slugify('too   many   spaces')).toBe('too-many-spaces');
    expect(slugify('under_score_case')).toBe('under-score-case');
  });

  it('trims leading and trailing hyphens', () => {
    expect(slugify('  -hello-  ')).toBe('hello');
  });

  it('handles empty string', () => {
    expect(slugify('')).toBe('');
  });
});

describe('formatDate', () => {
  it('formats a date string', () => {
    const result = formatDate('2026-03-26');
    expect(result).toContain('2026');
    expect(result).toContain('26');
  });

  it('formats a Date object', () => {
    const result = formatDate(new Date('2026-01-15'));
    expect(result).toContain('2026');
  });
});
