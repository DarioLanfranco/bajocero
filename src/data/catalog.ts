export const PRODUCT_CATEGORIES = [
  "AL FUEGO",
  "PESCADOS",
  "VEGETARIANO",
  "PANADERÍA Y FRESCOS",
  "GUARNICIONES Y PAPAS",
  "FRUTAS",
  "VERDURAS",
  "POSTRES",
  "UNCLASSIFIED",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const UNCLASSIFIED_CATEGORY = "UNCLASSIFIED" as const;

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

// RANGOS PLU (fuente única de verdad):
//   1-29   Carnes / Origen Animal        (AL FUEGO)
//   30-48  Pescados                      (PESCADOS)
//   49-59  Vegetariano Base              (VEGETARIANO)
//   60-76  Panificados / Masas           (PANADERÍA Y FRESCOS)
//   77-79  Guarniciones / Papas          (GUARNICIONES Y PAPAS)
//   89-97  Frutas                        (FRUTAS)
//   99-107 Verduras                      (VERDURAS)
//   110-111 Postres / Franui             (POSTRES)
export const PRODUCT_GROUPS: ProductGroup[] = [
  {
    id: "al-fuego",
    name: "AL FUEGO",
    slug: "al-fuego",
    range: [1, 29] as const,
  },
  {
    id: "pescados",
    name: "PESCADOS",
    slug: "pescados",
    range: [30, 48] as const,
  },
  {
    id: "vegetariano",
    name: "VEGETARIANO",
    slug: "vegetariano",
    range: [49, 59] as const,
  },
  {
    id: "panaderia-frescos",
    name: "PANADERÍA Y FRESCOS",
    slug: "panaderia-frescos",
    range: [60, 76] as const,
  },
  {
    id: "papas",
    name: "GUARNICIONES Y PAPAS",
    slug: "guarniciones-papas",
    range: [77, 79] as const,
  },
  {
    id: "frutas",
    name: "FRUTAS",
    slug: "frutas",
    range: [89, 97] as const,
  },
  {
    id: "verduras",
    name: "VERDURAS",
    slug: "verduras",
    range: [99, 107] as const,
  },
  {
    id: "postres",
    name: "POSTRES",
    slug: "postres",
    range: [110, 111] as const,
  },
];

export const GROUP_IDS = {
  AL_FUEGO: "al-fuego",
  PESCADOS: "pescados",
  VEGETARIANO: "vegetariano",
  PANADERIA_FRESCOS: "panaderia-frescos",
  PAPAS: "papas",
  FRUTAS: "frutas",
  VERDURAS: "verduras",
  POSTRES: "postres",
} as const;

export function getProductGroup(
  pluOrId: string | number | { id: string },
): ProductGroup | null {
  const raw = typeof pluOrId === "object" ? pluOrId.id : String(pluOrId);
  const plu = Number(raw);
  if (!Number.isFinite(plu)) return null;
  return (
    PRODUCT_GROUPS.find((g) => plu >= g.range[0] && plu <= g.range[1]) ?? null
  );
}

export function productInRange(
  productOrId: string | number | { id: string },
  group: ProductGroup,
): boolean {
  const groupOfProduct = getProductGroup(productOrId);
  return groupOfProduct !== null && groupOfProduct.id === group.id;
}

export function getProductCategory(
  pluOrId: string | number | { id: string },
): ProductCategory {
  return getProductGroup(pluOrId)?.name ?? UNCLASSIFIED_CATEGORY;
}

export function isUnclassified(
  pluOrId: string | number | { id: string },
): boolean {
  return getProductGroup(pluOrId) === null;
}

export function toGroupCarousels(): GroupCarousel[] {
  return PRODUCT_GROUPS.map((g) => ({
    category: { id: g.id, name: g.name, slug: g.slug },
    pluRange: [g.range[0], g.range[1]] as [number, number],
  }));
}
