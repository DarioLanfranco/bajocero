import type { Product } from '../types/Product';
import type { ProductSchemaType } from '../schemas/product';

export type SerializedProduct = ProductSchemaType;

export const CATALOG_DATA_ELEMENT_ID = 'catalog-data';

export function serializeCatalog(products: Product[]): SerializedProduct[] {
  return products.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    category: p.category,
    isAvailable: p.isAvailable,
    offerLabel: p.offerLabel,
    isFresh: p.isFresh,
    presentacion: p.presentacion,
    imageUrl: p.imageUrl,
    cantidadPorKg: p.cantidadPorKg,
    tipoVenta: p.tipoVenta,
  }));
}

export function serializeCatalogJSON(products: Product[]): string {
  const json = JSON.stringify(serializeCatalog(products));
  return json
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

export function readCatalogFromElement(): unknown[] {
  const el = document.getElementById(CATALOG_DATA_ELEMENT_ID);
  const raw = el?.textContent ?? '';
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
