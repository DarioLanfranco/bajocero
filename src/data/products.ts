import type { Product } from '../types/Product';

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
    id: 'hamburguesa-angus',
    name: 'Hamburguesa Angus 220g',
    description: 'Medallón de carne Angus, papa noisette y cheddar.',
    price: 4500,
    category: 'AL FUEGO',
    isAvailable: true,
    isOffer: true,
    offerPrice: 3800,
  },
  {
    id: 'milanesa-de-res',
    name: 'Milanesa de Res',
    description: 'Milanesa de carne de res rebozada, lista para freír u hornear.',
    price: 5200,
    category: 'AL FUEGO',
    isAvailable: true,
  },
  {
    id: 'merluza-en-posta',
    name: 'Merluza en Posta',
    description: 'Posta de merluza fresca, ideal para cocinar al horno o sartén.',
    price: 5800,
    category: 'AL FUEGO',
    isAvailable: true,
    isOffer: true,
    offerPrice: 4990,
  },
  {
    id: 'empanadas-x6',
    name: 'Empanadas x6',
    description: 'Seis empanadas de carne cortada a cuchillo. Relleno casero, tapa rústica.',
    price: 3600,
    category: 'PRÁCTICOS Y ACOMPAÑAMIENTOS',
    isAvailable: true,
  },
  {
    id: 'ensalada-cesar',
    name: 'Ensalada César',
    description: 'Mix de lechugas, pollo, crutones, queso parmesano y aderezo César.',
    price: 4200,
    category: 'PRÁCTICOS Y ACOMPAÑAMIENTOS',
    isAvailable: true,
  },
  {
    id: 'papas-noisette',
    name: 'Papas Noisette 500g',
    description: 'Bolitas de papa seleccionada, con mantequilla y perejil. Listas para horno o freidora.',
    price: 2800,
    category: 'PRÁCTICOS Y ACOMPAÑAMIENTOS',
    isAvailable: true,
  },
  {
    id: 'pasta-al-huevo',
    name: 'Pasta al Huevo 500g',
    description: 'Ravioles de pasta fresca al huevo rellenos de ricotta y espinaca.',
    price: 3200,
    category: 'PRÁCTICOS Y ACOMPAÑAMIENTOS',
    isAvailable: true,
  },
  {
    id: 'medialunas-x6',
    name: 'Medialunas x6',
    description: 'Seis medialunas de manteca artesanales, horneadas a diario.',
    price: 2400,
    category: 'PANADERÍA Y FRESCOS',
    isAvailable: true,
    isFresh: true,
  },
];
