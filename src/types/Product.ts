import type { TipoVentaKey } from './tipoVenta';

export type ProductCategory = 'AL FUEGO' | 'PRÁCTICOS Y ACOMPAÑAMIENTOS' | 'PANADERÍA Y FRESCOS' | 'PRODUCTOS';

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: ProductCategory;
  isAvailable: boolean;
  offerLabel?: string;
  isFresh?: boolean;
  presentacion?: string;
  imageUrl?: string;
  cantidadPorKg?: number;
  tipoVenta: TipoVentaKey;
}
