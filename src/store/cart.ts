import type { CartItem, CartSummary } from '../types/cart';
import { TIPO_VENTA } from '../types/tipoVenta';
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

function loadFromStorage(adapter: StorageAdapter): CartItem[] {
  try {
    const raw = adapter.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);

    if (!parsed || typeof parsed !== 'object') return [];
    if (parsed.version !== STORAGE_VERSION) {
      adapter.removeItem(STORAGE_KEY);
      return [];
    }
    if (!Array.isArray(parsed.items)) return [];

    return parsed.items.filter(isCartItem);
  } catch {
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

function createCartStore(adapter: StorageAdapter = localStorageAdapter): CartStore {
  let items: CartItem[] = loadFromStorage(adapter);
  const listeners = new Set<Listener>();

  function getSnapshot(): CartItem[] {
    const len = items.length;
    const out = new Array<CartItem>(len);
    for (let i = 0; i < len; i++) {
      out[i] = { ...items[i] };
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

  function applyItemMeta(item: CartItem): CartItem {
    const tipo = item.tipoVenta ?? 'unidad';
    const config = TIPO_VENTA[tipo];
    return {
      ...item,
      pesoOFactor: config.isWeight ? item.quantity : (config.gramsPerUnit! / 1000),
      precioCalculado: config.isWeight ? item.price * item.quantity : item.price,
    };
  }

  const store: CartStore = {
    get items(): CartItem[] {
      return getSnapshot();
    },

    get count(): number {
      return items.reduce((sum, item) => sum + item.quantity, 0);
    },

    get subtotal(): number {
      return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
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
      items = items.map((i) =>
        i.productId === item.productId
          ? applyItemMeta({ ...i, quantity: i.quantity + item.quantity })
          : i,
      );
      const updated = items.find((i) => i.productId === item.productId) as CartItem;
        notify('item:quantity-updated', { productId: item.productId, name: item.name, quantity: updated.quantity });
      } else {
        items = [...items, applyItemMeta({ ...item })];
        notify('item:added', { productId: item.productId, name: item.name, quantity: item.quantity });
      }
    },

    removeItem(productId: string): void {
      const idx = items.findIndex((i) => i.productId === productId);
      if (idx !== -1) {
        const [removed] = items.splice(idx, 1);
        notify('item:removed', { productId: removed.productId, name: removed.name });
      }
    },

    updateQuantity(productId: string, quantity: number): void {
      const existing = items.find((i) => i.productId === productId);
      if (!existing) return;

      const clamped = Math.max(0, quantity);

      items = items.map((i) =>
        i.productId === productId ? applyItemMeta({ ...i, quantity: clamped }) : i,
      );

      if (clamped === 0) {
        items = items.filter((i) => i.productId !== productId);
        notify('item:removed', { productId: existing.productId, name: existing.name });
      } else {
        notify('item:quantity-updated', { productId, name: existing.name, quantity: clamped });
      }
    },

    clear(): void {
      items = [];
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
