export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface CartSummary {
  items: CartItem[];
  count: number;
  subtotal: number;
}
