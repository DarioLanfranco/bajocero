import type { TipoVentaKey } from './tipoVenta';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  presentacion?: string;
  tipoVenta?: TipoVentaKey;
}

export interface CartSummary {
  items: CartItem[];
  count: number;
  subtotal: number;
}
