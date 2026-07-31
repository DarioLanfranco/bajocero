import type { Product } from '../types/Product';
import type { ProductSchemaType } from '../schemas/product';

export type SerializedProduct = ProductSchemaType;

export const CATALOG_DATA_ELEMENT_ID = 'catalog-data';
export const CATALOG_DATA_ATTRIBUTE = 'data-products';

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
  return JSON.stringify(serializeCatalog(products));
}

export function readCatalogFromElement(): unknown[] {
  const el = document.getElementById(CATALOG_DATA_ELEMENT_ID);
  const raw = el?.getAttribute(CATALOG_DATA_ATTRIBUTE);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
