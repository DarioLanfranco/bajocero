export interface CatalogCategory {
  id: string;
  name: string;
  slug: string;
}

export const categories: CatalogCategory[] = [
  { id: 'al-fuego', name: 'AL FUEGO', slug: 'al-fuego' },
  { id: 'practicos', name: 'PRÁCTICOS Y ACOMPAÑAMIENTOS', slug: 'practicos' },
  { id: 'panaderia', name: 'PANADERÍA Y FRESCOS', slug: 'panaderia' },
];
