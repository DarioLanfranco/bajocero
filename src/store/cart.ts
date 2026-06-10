import type { CartItem, CartSummary } from '../types/cart';
import { showProductAdded, showQuantityUpdated, showProductRemoved, showCartCleared } from '../scripts/toast';

const STORAGE_KEY = 'bajocero-cart';

type Listener = (items: CartItem[]) => void;

export interface CartStore {
  readonly items: CartItem[];
  readonly count: number;
  readonly subtotal: number;
  subscribe(fn: Listener): () => void;
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
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* storage full or unavailable */
  }
}

function createCartStore(): CartStore {
  let items: CartItem[] = loadFromStorage();
  const listeners = new Set<Listener>();

  function notify(): void {
    saveToStorage(items);
    const snapshot = items.map((i) => ({ ...i }));
    listeners.forEach((fn) => fn(snapshot));
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

    addItem(item: CartItem): void {
      const existing = items.find((i) => i.productId === item.productId);
      if (existing) {
        items = items.map((i) =>
          i.productId === item.productId
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
        const updated = items.find((i) => i.productId === item.productId) as CartItem;
        showQuantityUpdated(item.name, updated.quantity);
      } else {
        items = [...items, { ...item }];
        showProductAdded(item.name);
      }
      notify();
    },

    removeItem(productId: string): void {
      const found = items.find((i) => i.productId === productId);
      if (found) showProductRemoved(found.name);
      items = items.filter((i) => i.productId !== productId);
      notify();
    },

    updateQuantity(productId: string, quantity: number): void {
      const existing = items.find((i) => i.productId === productId);
      if (!existing) return;

      const clamped = Math.max(0, quantity);
      const increased = clamped > existing.quantity;

      if (clamped === 0) {
        showProductRemoved(existing.name);
        items = items.filter((i) => i.productId !== productId);
      } else {
        items = items.map((i) =>
          i.productId === productId ? { ...i, quantity: clamped } : i
        );
        if (increased) showQuantityUpdated(existing.name, clamped);
      }
      notify();
    },

    clear(): void {
      showCartCleared();
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
