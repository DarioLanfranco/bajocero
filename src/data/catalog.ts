export const PRODUCT_CATEGORIES = [
  'AL FUEGO',
  'PESCADOS',
  'PANADERÍA Y FRESCOS',
  'VEGETARIANO',
  'PASTAS Y PRÁCTICOS',
  'PRODUCTOS',
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export interface ProductGroup {
  id: string;
  name: ProductCategory;
  slug: string;
  range: readonly [number, number];
}

export interface CatalogCategory {
  id: string;
  name: ProductCategory;
  slug: string;
}

export interface GroupCarousel {
  category: CatalogCategory;
  pluRange: [number, number];
}

export const PRODUCT_GROUPS: ProductGroup[] = [
  { id: 'al-fuego', name: 'AL FUEGO', slug: 'al-fuego', range: [1, 29] as const },
  { id: 'pescados', name: 'PESCADOS', slug: 'pescados', range: [30, 49] as const },
  { id: 'panaderia-frescos', name: 'PANADERÍA Y FRESCOS', slug: 'panaderia-frescos', range: [50, 59] as const },
  { id: 'vegetariano', name: 'VEGETARIANO', slug: 'vegetariano', range: [60, 69] as const },
  { id: 'pastas-practicos', name: 'PASTAS Y PRÁCTICOS', slug: 'pastas-practicos', range: [70, 89] as const },
];

export const GROUP_IDS = {
  AL_FUEGO: 'al-fuego',
  PESCADOS: 'pescados',
  PANADERIA_FRESCOS: 'panaderia-frescos',
  VEGETARIANO: 'vegetariano',
  PASTAS_PRACTICOS: 'pastas-practicos',
} as const;

export function productInRange(
  productOrId: string | number | { id: string },
  group: ProductGroup,
): boolean {
  const raw = typeof productOrId === 'object' ? productOrId.id : String(productOrId);
  const plu = Number(raw);
  return Number.isFinite(plu) && plu >= group.range[0] && plu <= group.range[1];
}

export function toGroupCarousels(): GroupCarousel[] {
  return PRODUCT_GROUPS.map((g) => ({
    category: { id: g.id, name: g.name, slug: g.slug },
    pluRange: [g.range[0], g.range[1]] as [number, number],
  }));
}
