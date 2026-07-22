import { describe, it, expect } from 'vitest';
import { sanitizePhoneNumber } from './phone';

describe('sanitizePhoneNumber', () => {
  it('strips spaces', () => {
    expect(sanitizePhoneNumber('+54 358 6006854')).toBe('543586006854');
  });

  it('strips plus sign', () => {
    expect(sanitizePhoneNumber('+543586006854')).toBe('543586006854');
  });

  it('strips dashes and parentheses', () => {
    expect(sanitizePhoneNumber('+54 (358) 600-6854')).toBe('543586006854');
  });

  it('returns empty string for empty input', () => {
    expect(sanitizePhoneNumber('')).toBe('');
  });

  it('preserves digits only', () => {
    expect(sanitizePhoneNumber('abc123def456')).toBe('123456');
  });
});
