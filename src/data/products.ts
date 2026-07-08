import type { Product } from '../types/Product';

// Fallback products with numeric IDs that map to PLU ranges in catalog.ts:
//   al-fuego        [1, 29]
//   pescados        [30, 49]
//   vegetariano     [50, 60]
//   pastas-practicos [61, 80]

const productsByCategory = new Map<string, Product[]>();

export function getProductsByCategory(categoryName: string): Product[] {
  if (!productsByCategory.has(categoryName)) {
    const filtered = products.filter((p) => p.category === categoryName);
    productsByCategory.set(categoryName, filtered);
  }
  return productsByCategory.get(categoryName) ?? [];
}

export const products: Product[] = [
  {
    id: '1',
    name: 'Hamburguesa Angus 220g',
    description: 'Medallón de carne Angus, papa noisette y cheddar.',
    price: 3800,
    category: 'AL FUEGO',
    isAvailable: true,
    offerLabel: 'Oferta',
  },
  {
    id: '2',
    name: 'Milanesa de Res',
    description: 'Milanesa de carne de res rebozada, lista para freír u hornear.',
    price: 5200,
    category: 'AL FUEGO',
    isAvailable: true,
  },
  {
    id: '3',
    name: 'Merluza en Posta',
    description: 'Posta de merluza fresca, ideal para cocinar al horno o sartén.',
    price: 4990,
    category: 'AL FUEGO',
    isAvailable: true,
    offerLabel: 'Oferta',
  },
  {
    id: '61',
    name: 'Empanadas x6',
    description: 'Seis empanadas de carne cortada a cuchillo. Relleno casero, tapa rústica.',
    price: 3600,
    category: 'PRÁCTICOS Y ACOMPAÑAMIENTOS',
    isAvailable: true,
  },
  {
    id: '62',
    name: 'Ensalada César',
    description: 'Mix de lechugas, pollo, crutones, queso parmesano y aderezo César.',
    price: 4200,
    category: 'PRÁCTICOS Y ACOMPAÑAMIENTOS',
    isAvailable: true,
  },
  {
    id: '63',
    name: 'Papas Noisette 500g',
    description: 'Bolitas de papa seleccionada, con mantequilla y perejil. Listas para horno o freidora.',
    price: 2800,
    category: 'PRÁCTICOS Y ACOMPAÑAMIENTOS',
    isAvailable: true,
  },
  {
    id: '64',
    name: 'Pasta al Huevo 500g',
    description: 'Ravioles de pasta fresca al huevo rellenos de ricotta y espinaca.',
    price: 3200,
    category: 'PRÁCTICOS Y ACOMPAÑAMIENTOS',
    isAvailable: true,
  },
  {
    id: '50',
    name: 'Medialunas x6',
    description: 'Seis medialunas de manteca artesanales, horneadas a diario.',
    price: 2400,
    category: 'PANADERÍA Y FRESCOS',
    isAvailable: true,
    isFresh: true,
  },
];
