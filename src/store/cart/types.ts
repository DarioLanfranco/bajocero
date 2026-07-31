import type { CartItem, CartSummary } from '../../types/cart';

export type CartEventType = 'item:added' | 'item:removed' | 'item:quantity-updated' | 'cart:cleared';

export interface CartEventData {
  productId?: string;
  name?: string;
  quantity?: number;
}

export interface CartEvent {
  type: CartEventType | null;
  items: CartItem[];
  data: CartEventData;
}

export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type Listener = (event: CartEvent) => void;

export interface CartStore {
  readonly items: CartItem[];
  readonly count: number;
  readonly subtotal: number;
  subscribe(fn: Listener): () => void;
  addItem(item: CartItem): boolean;
  removeItem(productId: string): void;
  updateQuantity(productId: string, quantity: number): boolean;
  clear(): void;
  getItem(productId: string): CartItem | undefined;
  getSummary(): CartSummary;
}
