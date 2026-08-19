import { describe, it, expect } from 'vitest';
import { canonicalizePath } from './seo';

const SITE = 'https://bajocero-omega.vercel.app';

describe('canonicalizePath', () => {
  it('adds a single trailing slash', () => {
    expect(canonicalizePath('/productos')).toBe(`${SITE}/productos/`);
    expect(canonicalizePath('/terminos/')).toBe(`${SITE}/terminos/`);
  });

  it('normalizes double slashes', () => {
    expect(canonicalizePath('//info/')).toBe(`${SITE}/info/`);
  });

  it('keeps the root as the base url', () => {
    expect(canonicalizePath('/')).toBe(`${SITE}/`);
  });

  it('preserves path segments after normalization', () => {
    expect(canonicalizePath('/ideal/')).toBe(`${SITE}/ideal/`);
  });
});
