export interface ProductGroup {
  id: string;
  name: string;
  slug: string;
  range: readonly [number, number];
}

export interface CatalogCategory {
  id: string;
  name: string;
  slug: string;
}

export interface GroupCarousel {
  category: CatalogCategory;
  pluRange: [number, number];
}

export function toGroupCarousels(): GroupCarousel[] {
  return PRODUCT_GROUPS.map((g) => ({
    category: { id: g.id, name: g.name, slug: g.slug },
    pluRange: [g.range[0], g.range[1]] as [number, number],
  }));
}

export const PRODUCT_GROUPS: ProductGroup[] = [
  { id: 'al-fuego', name: 'AL FUEGO', slug: 'al-fuego', range: [1, 29] as const },
  { id: 'pescados', name: 'PESCADOS', slug: 'pescados', range: [30, 49] as const },
  { id: 'vegetariano', name: 'VEGETARIANO', slug: 'vegetariano', range: [50, 60] as const },
  { id: 'pastas-practicos', name: 'PASTAS Y PRÁCTICOS', slug: 'pastas-practicos', range: [61, 80] as const },
];

export const GROUP_IDS = {
  AL_FUEGO: 'al-fuego',
  PESCADOS: 'pescados',
  VEGETARIANO: 'vegetariano',
  PASTAS_PRACTICOS: 'pastas-practicos',
} as const;
