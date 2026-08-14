import type { Product } from '../types/Product';

// Fallback products with numeric IDs that map to PLU ranges in catalog.ts:
//   al-fuego          [1, 29]
//   pescados          [30, 48]
//   vegetariano       [49, 59]
//   panaderia-frescos [60, 76]
//   papas             [77, 79]
//   frutas            [89, 97]
//   verduras          [99, 107]
//   postres           [110, 111]

export const products: Product[] = [
  {
    id: '1',
    name: 'Hamburguesa Angus 220g',
    description: 'Medallón de carne Angus, papa noisette y cheddar.',
    price: 3800,
    category: 'AL FUEGO',
    isAvailable: true,
    offerLabel: 'Oferta',
    tipoVenta: 'unidad',
  },
  {
    id: '2',
    name: 'Milanesa de Res',
    description: 'Milanesa de carne de res rebozada, lista para freír u hornear.',
    price: 5200,
    category: 'AL FUEGO',
    isAvailable: true,
    tipoVenta: 'unidad',
  },
  {
    id: '3',
    name: 'Merluza en Posta',
    description: 'Posta de merluza fresca, ideal para cocinar al horno o sartén.',
    price: 4990,
    category: 'AL FUEGO',
    isAvailable: true,
    offerLabel: 'Oferta',
    tipoVenta: 'unidad',
  },
  {
    id: '71',
    name: 'Empanadas x6',
    description: 'Seis empanadas de carne cortada a cuchillo. Relleno casero, tapa rústica.',
    price: 3600,
    category: 'PANADERÍA Y FRESCOS',
    isAvailable: true,
    tipoVenta: 'unidad',
  },
  {
    id: '72',
    name: 'Ensalada César',
    description: 'Mix de lechugas, pollo, crutones, queso parmesano y aderezo César.',
    price: 4200,
    category: 'PANADERÍA Y FRESCOS',
    isAvailable: true,
    tipoVenta: 'unidad',
  },
  {
    id: '73',
    name: 'Papas Noisette 500g',
    description: 'Bolitas de papa seleccionada, con mantequilla y perejil. Listas para horno o freidora.',
    price: 2800,
    category: 'PANADERÍA Y FRESCOS',
    isAvailable: true,
    presentacion: '500g aprox.',
    tipoVenta: 'unidad',
  },
  {
    id: '74',
    name: 'Pasta al Huevo 500g',
    description: 'Ravioles de pasta fresca al huevo rellenos de ricotta y espinaca.',
    price: 3200,
    category: 'PANADERÍA Y FRESCOS',
    isAvailable: true,
    presentacion: '500g aprox.',
    tipoVenta: 'unidad',
  },
  {
    id: '50',
    name: 'Medialunas x6',
    description: 'Seis medialunas de manteca artesanales, horneadas a diario.',
    price: 2400,
    category: 'VEGETARIANO',
    isAvailable: true,
    isFresh: true,
    tipoVenta: 'unidad',
  },
];
