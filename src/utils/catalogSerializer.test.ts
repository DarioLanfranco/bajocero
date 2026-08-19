// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import type { Product } from '../types/Product';
import {
  CATALOG_DATA_ELEMENT_ID,
  serializeCatalog,
  serializeCatalogJSON,
  readCatalogFromElement,
} from './catalogSerializer';

const mockProduct: Product = {
  id: '1',
  name: 'Milanesa de pollo',
  price: 9999,
  category: 'AL FUEGO',
  isAvailable: true,
  offerLabel: '',
  isFresh: false,
  presentacion: 'Unidad',
  imageUrl: '',
  cantidadPorKg: undefined,
  tipoVenta: 'unidad',
  description: 'descripción que no pertenece al contrato cliente',
};

describe('serializeCatalog', () => {
  it('serializes products into the client contract shape', () => {
    const serialized = serializeCatalog([mockProduct]);

    expect(serialized).toEqual([
      {
        id: '1',
        name: 'Milanesa de pollo',
        price: 9999,
        category: 'AL FUEGO',
        isAvailable: true,
        offerLabel: '',
        isFresh: false,
        presentacion: 'Unidad',
        imageUrl: '',
        cantidadPorKg: undefined,
        tipoVenta: 'unidad',
      },
    ]);
    expect(serialized[0]).not.toHaveProperty('description');
  });

  it('returns an empty array when no products are provided', () => {
    expect(serializeCatalog([])).toEqual([]);
  });
});

describe('serializeCatalogJSON', () => {
  it('produces a deterministic JSON payload', () => {
    const a = serializeCatalogJSON([mockProduct]);
    const b = serializeCatalogJSON([mockProduct]);

    expect(a).toBe(b);
    expect(JSON.parse(a)).toEqual(serializeCatalog([mockProduct]));
  });

  it('escapes script-breaking sequences so it is safe to embed', () => {
    const dangerous = serializeCatalogJSON([
      { ...mockProduct, name: '</script><img src=x onerror=alert(1)>' },
    ]);

    expect(dangerous).not.toContain('</script>');
    expect(JSON.parse(dangerous)[0].name).toBe('</script><img src=x onerror=alert(1)>');
  });
});

describe('readCatalogFromElement', () => {
  function mountScript(content: string): HTMLElement {
    const el = document.createElement('script');
    el.id = CATALOG_DATA_ELEMENT_ID;
    el.type = 'application/json';
    el.textContent = content;
    document.body.appendChild(el);
    return el;
  }

  it('parses the catalog from the script element text content', () => {
    mountScript(serializeCatalogJSON([mockProduct]));

    expect(readCatalogFromElement()).toEqual(serializeCatalog([mockProduct]));
  });

  it('returns an empty array when the element is missing', () => {
    document.body.innerHTML = '';

    expect(readCatalogFromElement()).toEqual([]);
  });

  it('returns an empty array when the text content is empty or malformed', () => {
    mountScript('');
    expect(readCatalogFromElement()).toEqual([]);

    document.body.innerHTML = '';
    mountScript('{invalid');
    expect(readCatalogFromElement()).toEqual([]);
  });

  it('returns an empty array when the payload is not an array', () => {
    mountScript('{"nope":true}');

    expect(readCatalogFromElement()).toEqual([]);
  });
});
