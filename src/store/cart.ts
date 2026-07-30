import type { CartItem, CartSummary } from '../types/cart';
import { TIPO_VENTA } from '../types/tipoVenta';
import { cartStorageSchema } from '../schemas/cart';
import { log } from '../utils/logger';

const STORAGE_KEY = 'bajocero-cart';
const STORAGE_VERSION = 1;
const MAX_CART_ITEMS = 50;

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

type Listener = (event: CartEvent) => void;

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

const localStorageAdapter: StorageAdapter = {
  getItem(key) {
    try {
      if (typeof localStorage === 'undefined') return null;
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key, value) {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(key, value);
    } catch {
      /* storage full or unavailable */
    }
  },
  removeItem(key) {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.removeItem(key);
    } catch {
      /* storage unavailable */
    }
  },
};

function loadFromStorage(adapter: StorageAdapter): CartItem[] {
  try {
    const raw = adapter.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const result = cartStorageSchema.safeParse(parsed);
    if (!result.success) {
      if (import.meta.env.DEV) {
        console.warn('[cart] localStorage validation failed, clearing:', result.error.issues);
      }
      adapter.removeItem(STORAGE_KEY);
      return [];
    }
    return result.data.items;
  } catch {
    adapter.removeItem(STORAGE_KEY);
    return [];
  }
}

function saveToStorage(adapter: StorageAdapter, items: CartItem[]): void {
  try {
    adapter.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, items }));
  } catch {
    /* storage full or unavailable */
  }
}

export function getPesoOFactor(item: CartItem): number {
  const config = TIPO_VENTA[item.tipoVenta ?? 'unidad'];
  if (config.isWeight) return item.quantity;
  return (config.gramsPerUnit ?? 1000) / 1000;
}

export function getPrecioCalculado(item: CartItem): number {
  const config = TIPO_VENTA[item.tipoVenta ?? 'unidad'];
  return config.isWeight ? item.price * item.quantity : item.price;
}

function createCartStore(adapter: StorageAdapter = localStorageAdapter): CartStore {
  let items: CartItem[] = loadFromStorage(adapter);
  const listeners = new Set<Listener>();

  let cacheVersion = 0;
  let snapshotVersion = -1;
  let countVersion = -1;
  let subtotalVersion = -1;
  let cachedSnapshot: CartItem[] | null = null;
  let cachedCount = 0;
  let cachedSubtotal = 0;

  function invalidateCache(): void {
    cacheVersion++;
  }

  function getSnapshot(): CartItem[] {
    if (snapshotVersion !== cacheVersion || !cachedSnapshot) {
      const len = items.length;
      cachedSnapshot = new Array<CartItem>(len);
      for (let i = 0; i < len; i++) {
        cachedSnapshot[i] = { ...items[i] };
      }
      snapshotVersion = cacheVersion;
    }
    const out = new Array<CartItem>(cachedSnapshot.length);
    for (let i = 0; i < cachedSnapshot.length; i++) {
      out[i] = { ...cachedSnapshot[i] };
    }
    return out;
  }

  listeners.add((event) => {
    if (event.type !== null) saveToStorage(adapter, items);
  });

  function notify(type: CartEventType | null, data: CartEventData = {}): void {
    const event: CartEvent = { type, items: getSnapshot(), data };
    listeners.forEach((fn) => fn(event));
  }

  const store: CartStore = {
    get items(): CartItem[] {
      return getSnapshot();
    },

    get count(): number {
      if (countVersion !== cacheVersion) {
        cachedCount = items.reduce((sum, item) => sum + item.quantity, 0);
        countVersion = cacheVersion;
      }
      return cachedCount;
    },

    get subtotal(): number {
      if (subtotalVersion !== cacheVersion) {
        cachedSubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        subtotalVersion = cacheVersion;
      }
      return cachedSubtotal;
    },

    subscribe(fn: Listener): () => void {
      listeners.add(fn);
      fn({ type: null, items: getSnapshot(), data: {} });
      return () => {
        listeners.delete(fn);
      };
    },

    addItem(item: CartItem): void {
      const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0) + item.quantity;
      if (totalQuantity > MAX_CART_ITEMS) {
        log('cart', 'warn', `Cart limit reached (${MAX_CART_ITEMS})`);
        return;
      }
      const existing = items.find((i) => i.productId === item.productId);
      if (existing) {
        const newQuantity = existing.quantity + item.quantity;
        items = items.map((i) =>
          i.productId === item.productId ? { ...i, quantity: newQuantity } : i,
        );
        invalidateCache();
        notify('item:quantity-updated', { productId: item.productId, name: item.name, quantity: newQuantity });
      } else {
        items = [...items, { ...item }];
        invalidateCache();
        notify('item:added', { productId: item.productId, name: item.name, quantity: item.quantity });
      }
    },

    removeItem(productId: string): void {
      const removed = items.find((i) => i.productId === productId);
      if (removed) {
        items = items.filter((i) => i.productId !== productId);
        invalidateCache();
        notify('item:removed', { productId: removed.productId, name: removed.name });
      }
    },

    updateQuantity(productId: string, quantity: number): void {
      const existing = items.find((i) => i.productId === productId);
      if (!existing) return;

      const clamped = Math.max(0, quantity);

      items = items.map((i) =>
        i.productId === productId ? { ...i, quantity: clamped } : i,
      );

      if (clamped === 0) {
        items = items.filter((i) => i.productId !== productId);
        invalidateCache();
        notify('item:removed', { productId: existing.productId, name: existing.name });
      } else {
        invalidateCache();
        notify('item:quantity-updated', { productId, name: existing.name, quantity: clamped });
      }
    },

    clear(): void {
      items = [];
      invalidateCache();
      notify('cart:cleared');
    },

    getItem(productId: string): CartItem | undefined {
      return items.find((i) => i.productId === productId);
    },

    getSummary(): CartSummary {
      return {
        items: getSnapshot(),
        count: this.count,
        subtotal: this.subtotal,
      };
    },
  };

  return store;
}

export function createTestCartStore(): CartStore {
  const noopAdapter: StorageAdapter = {
    getItem() { return null; },
    setItem() {},
    removeItem() {},
  };
  return createCartStore(noopAdapter);
}

export const cartStore = createCartStore();
