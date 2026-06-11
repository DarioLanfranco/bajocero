import type { CartItem, CartSummary } from '../types/cart';

const STORAGE_KEY = 'bajocero-cart';

type Listener = (items: CartItem[]) => void;

export type CartEventType = 'item:added' | 'item:removed' | 'item:quantity-updated' | 'cart:cleared';

export interface CartEventData {
  productId?: string;
  name?: string;
  quantity?: number;
}

type CartEventFn = (data: CartEventData) => void;

export interface CartStore {
  readonly items: CartItem[];
  readonly count: number;
  readonly subtotal: number;
  subscribe(fn: Listener): () => void;
  on(event: CartEventType, fn: CartEventFn): () => void;
  addItem(item: CartItem): void;
  removeItem(productId: string): void;
  updateQuantity(productId: string, quantity: number): void;
  clear(): void;
  getItem(productId: string): CartItem | undefined;
  getSummary(): CartSummary;
}

function isCartItem(value: unknown): value is CartItem {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as CartItem).productId === 'string' &&
    typeof (value as CartItem).name === 'string' &&
    typeof (value as CartItem).price === 'number' &&
    typeof (value as CartItem).quantity === 'number'
  );
}

function loadFromStorage(): CartItem[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isCartItem);
  } catch {
    return [];
  }
}

function saveToStorage(items: CartItem[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* storage full or unavailable */
  }
}

function createCartStore(): CartStore {
  let items: CartItem[] = loadFromStorage();
  const listeners = new Set<Listener>();
  const eventListeners = new Map<CartEventType, Set<CartEventFn>>();

  function notify(): void {
    saveToStorage(items);
    const snapshot = items.map((i) => ({ ...i }));
    listeners.forEach((fn) => fn(snapshot));
  }

  function emit(event: CartEventType, data: CartEventData = {}): void {
    const fns = eventListeners.get(event);
    if (fns) fns.forEach((fn) => fn(data));
  }

  const store: CartStore = {
    get items(): CartItem[] {
      return items.map((i) => ({ ...i }));
    },

    get count(): number {
      return items.reduce((sum, item) => sum + item.quantity, 0);
    },

    get subtotal(): number {
      return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    },

    subscribe(fn: Listener): () => void {
      listeners.add(fn);
      fn(items.map((i) => ({ ...i })));
      return () => {
        listeners.delete(fn);
      };
    },

    on(event: CartEventType, fn: CartEventFn): () => void {
      if (!eventListeners.has(event)) eventListeners.set(event, new Set());
      eventListeners.get(event)!.add(fn);
      return () => {
        eventListeners.get(event)?.delete(fn);
      };
    },

    addItem(item: CartItem): void {
      const existing = items.find((i) => i.productId === item.productId);
      if (existing) {
        items = items.map((i) =>
          i.productId === item.productId
            ? { ...i, quantity: i.quantity + item.quantity }
            : i,
        );
        const updated = items.find((i) => i.productId === item.productId) as CartItem;
        emit('item:quantity-updated', { productId: item.productId, name: item.name, quantity: updated.quantity });
      } else {
        items = [...items, { ...item }];
        emit('item:added', { productId: item.productId, name: item.name, quantity: item.quantity });
      }
      notify();
    },

    removeItem(productId: string): void {
      const found = items.find((i) => i.productId === productId);
      if (found) emit('item:removed', { productId: found.productId, name: found.name });
      items = items.filter((i) => i.productId !== productId);
      notify();
    },

    updateQuantity(productId: string, quantity: number): void {
      const existing = items.find((i) => i.productId === productId);
      if (!existing) return;

      const clamped = Math.max(0, quantity);

      if (clamped === 0) {
        emit('item:removed', { productId: existing.productId, name: existing.name });
        items = items.filter((i) => i.productId !== productId);
      } else {
        items = items.map((i) =>
          i.productId === productId ? { ...i, quantity: clamped } : i,
        );
      }
      notify();
    },

    clear(): void {
      emit('cart:cleared');
      items = [];
      notify();
    },

    getItem(productId: string): CartItem | undefined {
      return items.find((i) => i.productId === productId);
    },

    getSummary(): CartSummary {
      return {
        items: items.map((i) => ({ ...i })),
        count: this.count,
        subtotal: this.subtotal,
      };
    },
  };

  return store;
}

export const cartStore = createCartStore();
