import { describe, it, expect } from 'vitest';
import { transformImageUrl, generateSrcSet, DEFAULT_IMAGE_SIZES } from './images';

describe('transformImageUrl', () => {
  it('transforms ImageKit URLs with width', () => {
    const result = transformImageUrl('https://ik.imagekit.io/img.jpg', { width: 400 });
    expect(result).toContain('tr=w-400');
  });

  it('appends height when provided', () => {
    const result = transformImageUrl('https://ik.imagekit.io/img.jpg', { width: 400, height: 300 });
    expect(result).toContain('w-400');
    expect(result).toContain('h-300');
  });

  it('passes through non-ImageKit URLs', () => {
    expect(transformImageUrl('https://example.com/img.jpg', { width: 400 })).toBe('https://example.com/img.jpg');
  });

  it('handles empty string', () => {
    expect(transformImageUrl('', { width: 400 })).toBe('');
  });
});

describe('generateSrcSet', () => {
  it('generates srcset string for ImageKit URLs', () => {
    const srcset = generateSrcSet('https://ik.imagekit.io/img.jpg');
    expect(srcset).toContain('320w');
    expect(srcset).toContain('480w');
    expect(srcset).toContain('640w');
    expect(srcset).toContain('800w');
    expect(srcset).toContain('tr=w-320');
    expect(srcset).toContain('tr=w-800');
  });

  it('generates srcset for non-ImageKit URLs using passthrough', () => {
    const srcset = generateSrcSet('https://example.com/img.jpg');
    expect(srcset).toContain('320w');
    expect(srcset).toContain('800w');
    expect(srcset).not.toContain('tr=');
  });

  it('returns empty for empty string', () => {
    expect(generateSrcSet('')).toBe('');
  });
});

describe('DEFAULT_IMAGE_SIZES', () => {
  it('contains responsive breakpoints', () => {
    expect(DEFAULT_IMAGE_SIZES).toContain('100vw');
    expect(DEFAULT_IMAGE_SIZES).toContain('50vw');
    expect(DEFAULT_IMAGE_SIZES).toContain('33vw');
  });
});
