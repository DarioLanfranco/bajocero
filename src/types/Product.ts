import type { TipoVentaKey } from './tipoVenta';
import type { ProductCategory } from '../data/catalog';

export type { ProductCategory };

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
