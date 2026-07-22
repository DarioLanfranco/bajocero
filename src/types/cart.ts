export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  presentacion?: string;
  tipoVenta?: 'kg' | 'unidad' | 'unidad400' | 'pack';
  pesoOFactor?: number;
  precioCalculado?: number;
}

export interface CartSummary {
  items: CartItem[];
  count: number;
  subtotal: number;
}
