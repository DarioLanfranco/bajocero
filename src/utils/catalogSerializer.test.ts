// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import type { Product } from '../types/Product';
import {
  CATALOG_DATA_ATTRIBUTE,
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
});

describe('readCatalogFromElement', () => {
  it('parses the catalog element attribute', () => {
    const el = document.createElement('div');
    el.id = CATALOG_DATA_ELEMENT_ID;
    el.setAttribute(CATALOG_DATA_ATTRIBUTE, serializeCatalogJSON([mockProduct]));
    document.body.appendChild(el);

    expect(readCatalogFromElement()).toEqual(serializeCatalog([mockProduct]));
  });

  it('returns an empty array when the element is missing', () => {
    document.body.innerHTML = '';

    expect(readCatalogFromElement()).toEqual([]);
  });

  it('returns an empty array when the attribute is empty or malformed', () => {
    const el = document.createElement('div');
    el.id = CATALOG_DATA_ELEMENT_ID;
    document.body.appendChild(el);

    expect(readCatalogFromElement()).toEqual([]);

    el.setAttribute(CATALOG_DATA_ATTRIBUTE, '{invalid');
    expect(readCatalogFromElement()).toEqual([]);
  });

  it('returns an empty array when the payload is not an array', () => {
    const el = document.createElement('div');
    el.id = CATALOG_DATA_ELEMENT_ID;
    el.setAttribute(CATALOG_DATA_ATTRIBUTE, '{"nope":true}');
    document.body.appendChild(el);

    expect(readCatalogFromElement()).toEqual([]);
  });
});
