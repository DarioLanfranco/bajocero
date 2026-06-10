import type { CartItem, CartSummary } from '../types/cart';
import { showProductAdded, showQuantityUpdated, showProductRemoved, showCartCleared } from '../scripts/toast';

const STORAGE_KEY = 'bajocero-cart';
const GLOBAL_STORE_KEY = '__bajocero_cart_store__';

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

function loadFromStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (i: unknown): i is CartItem =>
        typeof i === 'object' &&
        i !== null &&
        typeof (i as CartItem).productId === 'string' &&
        typeof (i as CartItem).name === 'string' &&
        typeof (i as CartItem).price === 'number' &&
        typeof (i as CartItem).quantity === 'number'
    );
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
  if (typeof window !== 'undefined') {
    const existing = (window as any)[GLOBAL_STORE_KEY] as CartStore | undefined;
    if (existing) return existing;
  }

  let items: CartItem[] = loadFromStorage();
  const listeners = new Set<Listener>();

  function notify(): void {
    saveToStorage(items);
    const snapshot = [...items];
    listeners.forEach((fn) => fn(snapshot));
  }

  const store: CartStore = {
    get items(): CartItem[] {
      return [...items];
    },

    get count(): number {
      return items.reduce((sum, item) => sum + item.quantity, 0);
    },

    get subtotal(): number {
      return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    },

    subscribe(fn: Listener): () => void {
      listeners.add(fn);
      fn([...items]);
      return () => {
        listeners.delete(fn);
      };
    },

    addItem(item: CartItem): void {
      const existing = items.find((i) => i.productId === item.productId);
      if (existing) {
        existing.quantity += item.quantity;
        showQuantityUpdated(item.name, existing.quantity);
      } else {
        items.push({ ...item });
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
      const item = items.find((i) => i.productId === productId);
      if (item) {
        const increased = quantity > item.quantity;
        item.quantity = Math.max(0, quantity);
        if (item.quantity === 0) {
          showProductRemoved(item.name);
          items = items.filter((i) => i.productId !== productId);
        } else if (increased) {
          showQuantityUpdated(item.name, item.quantity);
        }
        notify();
      }
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
        items: [...items],
        count: this.count,
        subtotal: this.subtotal,
      };
    },
  };

  if (typeof window !== 'undefined') {
    (window as any)[GLOBAL_STORE_KEY] = store;
  }

  return store;
}

export const cartStore = createCartStore();
