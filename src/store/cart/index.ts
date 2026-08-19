import type { CartItem, CartSummary } from '../../types/cart';
import { TIPO_VENTA } from '../../types/tipoVenta';
import { log } from '../../utils/logger';
import type { CartStore, CartEventType, CartEventData, CartEvent, Listener, StorageAdapter } from './types';
import { localStorageAdapter, loadFromStorage, saveToStorage } from './storage';

export type { CartStore, CartEventType, CartEventData, CartEvent, Listener, StorageAdapter };

const MAX_CART_ITEMS = 50;

export function getPesoOFactor(item: CartItem): number {
  const config = TIPO_VENTA[item.tipoVenta ?? 'unidad'];
  if (config.isWeight) return item.quantity;
  return (config.gramsPerUnit ?? 1000) / 1000;
}

export function getPrecioCalculado(item: CartItem): number {
  const config = TIPO_VENTA[item.tipoVenta ?? 'unidad'];
  return config.isWeight ? item.price * item.quantity : item.price;
}

function cloneSnapshot(items: CartItem[]): CartItem[] {
  const len = items.length;
  const out = new Array<CartItem>(len);
  for (let i = 0; i < len; i++) out[i] = { ...items[i] };
  return out;
}

function calcCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

function calcSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function findItem(items: CartItem[], productId: string): CartItem | undefined {
  return items.find((i) => i.productId === productId);
}

function notifier(listeners: Set<Listener>, getItems: () => CartItem[]) {
  return (type: CartEventType | null, data: CartEventData = {}): void => {
    const event: CartEvent = { type, items: cloneSnapshot(getItems()), data };
    listeners.forEach((fn) => fn(event));
  };
}

interface CartState {
  items: CartItem[];
  listeners: Set<Listener>;
  adapter: StorageAdapter;
}

function createAddItem(state: CartState, notify: ReturnType<typeof notifier>) {
  return function addItem(item: CartItem): boolean {
    if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
      log('cart', 'warn', 'Invalid quantity rejected');
      return false;
    }
    if (calcCount(state.items) + item.quantity > MAX_CART_ITEMS) {
      log('cart', 'warn', `Cart limit reached (${MAX_CART_ITEMS})`);
      return false;
    }
    const existing = findItem(state.items, item.productId);
    if (existing) {
      const newQuantity = existing.quantity + item.quantity;
      state.items = state.items.map((i) =>
        i.productId === item.productId ? { ...i, quantity: newQuantity } : i,
      );
      notify('item:quantity-updated', { productId: item.productId, name: item.name, quantity: newQuantity });
    } else {
      state.items = [...state.items, { ...item }];
      notify('item:added', { productId: item.productId, name: item.name, quantity: item.quantity });
    }
    return true;
  };
}

function createRemoveItem(state: CartState, notify: ReturnType<typeof notifier>) {
  return function removeItem(productId: string): void {
    const removed = findItem(state.items, productId);
    if (!removed) return;
    state.items = state.items.filter((i) => i.productId !== productId);
    notify('item:removed', { productId: removed.productId, name: removed.name });
  };
}

function createUpdateQuantity(state: CartState, notify: ReturnType<typeof notifier>) {
  return function updateQuantity(productId: string, quantity: number): boolean {
    const existing = findItem(state.items, productId);
    if (!existing) return false;
    if (!Number.isFinite(quantity)) {
      log('cart', 'warn', 'Invalid quantity rejected');
      return false;
    }
    const clamped = Math.max(0, quantity);
    state.items = state.items.map((i) =>
      i.productId === productId ? { ...i, quantity: clamped } : i,
    );
    if (clamped === 0) {
      state.items = state.items.filter((i) => i.productId !== productId);
      notify('item:removed', { productId: existing.productId, name: existing.name });
    } else {
      notify('item:quantity-updated', { productId, name: existing.name, quantity: clamped });
    }
    return true;
  };
}

function createClear(state: CartState, notify: ReturnType<typeof notifier>) {
  return function clear(): void {
    state.items = [];
    notify('cart:cleared');
  };
}

function createSubscribe(state: CartState) {
  return function subscribe(fn: Listener): () => void {
    state.listeners.add(fn);
    fn({ type: null, items: cloneSnapshot(state.items), data: {} });
    return () => { state.listeners.delete(fn); };
  };
}

function createGetItem(state: CartState) {
  return function getItem(productId: string): CartItem | undefined {
    return findItem(state.items, productId);
  };
}

function createGetSummary(state: CartState) {
  return function getSummary(): CartSummary {
    return {
      items: cloneSnapshot(state.items),
      count: calcCount(state.items),
      subtotal: calcSubtotal(state.items),
    };
  };
}

function createCartStore(adapter: StorageAdapter = localStorageAdapter): CartStore {
  const state: CartState = {
    items: loadFromStorage(adapter),
    listeners: new Set<Listener>(),
    adapter,
  };
  const notify = notifier(state.listeners, () => state.items);

  state.listeners.add((event) => {
    if (event.type !== null) saveToStorage(state.adapter, state.items);
  });

  const store: CartStore = {
    get items(): CartItem[] { return cloneSnapshot(state.items); },
    get count(): number { return calcCount(state.items); },
    get subtotal(): number { return calcSubtotal(state.items); },
    subscribe: createSubscribe(state),
    addItem: createAddItem(state, notify),
    removeItem: createRemoveItem(state, notify),
    updateQuantity: createUpdateQuantity(state, notify),
    clear: createClear(state, notify),
    getItem: createGetItem(state),
    getSummary: createGetSummary(state),
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
