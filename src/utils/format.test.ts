import { describe, it, expect } from 'vitest';
import { formatPrice } from './format';

describe('formatPrice', () => {
  it('formats zero', () => {
    expect(formatPrice(0)).toBe('$0');
  });

  it('formats thousands with locale separator', () => {
    expect(formatPrice(1500)).toBe('$1.500');
  });

  it('formats large numbers', () => {
    expect(formatPrice(1234567)).toBe('$1.234.567');
  });

  it('formats small integers correctly', () => {
    expect(formatPrice(99)).toBe('$99');
  });

  it('formats fractional cents', () => {
    expect(formatPrice(3712.5)).toBe('$3.712,5');
  });
});
