import { describe, it, expect } from 'vitest';
import { canonicalizePath } from './seo';

const SITE = 'https://dariolanfranco.github.io/bajocero';

describe('canonicalizePath', () => {
  it('adds a single trailing slash', () => {
    expect(canonicalizePath('/bajocero/productos')).toBe(`${SITE}/productos/`);
    expect(canonicalizePath('/bajocero/terminos/')).toBe(`${SITE}/terminos/`);
  });

  it('normalizes double slashes', () => {
    expect(canonicalizePath('/bajocero//info/')).toBe(`${SITE}/info/`);
  });

  it('keeps the root as the base url', () => {
    expect(canonicalizePath('/bajocero')).toBe(`${SITE}/`);
    expect(canonicalizePath('/bajocero/')).toBe(`${SITE}/`);
  });

  it('preserves path segments after normalization', () => {
    expect(canonicalizePath('/bajocero/ideal/')).toBe(`${SITE}/ideal/`);
  });
});
