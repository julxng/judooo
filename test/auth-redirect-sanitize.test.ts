import { describe, it, expect } from 'vitest';

/**
 * The sanitizeRedirectPath function is defined inside the auth callback route.
 * We re-implement the same logic here to test it independently.
 */
const sanitizeRedirectPath = (value: string | null): string => {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return '/';
  }
  return value;
};

describe('sanitizeRedirectPath', () => {
  it('returns "/" for null input', () => {
    expect(sanitizeRedirectPath(null)).toBe('/');
  });

  it('returns "/" for empty string', () => {
    expect(sanitizeRedirectPath('')).toBe('/');
  });

  it('returns "/" for protocol-relative URLs (open redirect)', () => {
    expect(sanitizeRedirectPath('//evil.com')).toBe('/');
    expect(sanitizeRedirectPath('//evil.com/path')).toBe('/');
  });

  it('returns "/" for absolute URLs', () => {
    expect(sanitizeRedirectPath('https://evil.com')).toBe('/');
    expect(sanitizeRedirectPath('http://evil.com')).toBe('/');
  });

  it('allows valid relative paths', () => {
    expect(sanitizeRedirectPath('/events')).toBe('/events');
    expect(sanitizeRedirectPath('/admin')).toBe('/admin');
    expect(sanitizeRedirectPath('/events/123')).toBe('/events/123');
  });

  it('allows root path', () => {
    expect(sanitizeRedirectPath('/')).toBe('/');
  });
});
