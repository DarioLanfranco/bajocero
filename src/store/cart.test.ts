import { describe, it, expect, beforeEach, vi } from 'vitest';

const storage = new Map<string, string>();

beforeEach(() => {
  storage.clear();
  vi.resetModules();
});

Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => { storage.set(key, value); },
    removeItem: (key: string) => { storage.delete(key); },
    clear: () => { storage.clear(); },
  },
  writable: true,
  configurable: true,
});

async function getFreshStore() {
  const mod = await import('./cart');
  return mod.cartStore;
}

describe('cartStore', () => {
  it('starts empty', async () => {
    const store = await getFreshStore();
    expect(store.items).toHaveLength(0);
    expect(store.count).toBe(0);
    expect(store.subtotal).toBe(0);
  });

  it('adds an item', async () => {
    const store = await getFreshStore();
    store.addItem({ productId: '1', name: 'Test', price: 100, quantity: 1 });
    expect(store.items).toHaveLength(1);
    expect(store.count).toBe(1);
    expect(store.subtotal).toBe(100);
  });

  it('increments quantity when adding same product', async () => {
    const store = await getFreshStore();
    store.addItem({ productId: '1', name: 'Test', price: 100, quantity: 1 });
    store.addItem({ productId: '1', name: 'Test', price: 100, quantity: 2 });
    expect(store.items).toHaveLength(1);
    expect(store.items[0].quantity).toBe(3);
    expect(store.subtotal).toBe(300);
  });

  it('removes an item', async () => {
    const store = await getFreshStore();
    store.addItem({ productId: '1', name: 'Test', price: 100, quantity: 1 });
    store.removeItem('1');
    expect(store.items).toHaveLength(0);
  });

  it('updates quantity', async () => {
    const store = await getFreshStore();
    store.addItem({ productId: '1', name: 'Test', price: 100, quantity: 3 });
    store.updateQuantity('1', 5);
    expect(store.items[0].quantity).toBe(5);
    expect(store.subtotal).toBe(500);
  });

  it('removes item when quantity updated to 0', async () => {
    const store = await getFreshStore();
    store.addItem({ productId: '1', name: 'Test', price: 100, quantity: 3 });
    store.updateQuantity('1', 0);
    expect(store.items).toHaveLength(0);
  });

  it('clears all items', async () => {
    const store = await getFreshStore();
    store.addItem({ productId: '1', name: 'Test', price: 100, quantity: 1 });
    store.addItem({ productId: '2', name: 'Test 2', price: 200, quantity: 2 });
    store.clear();
    expect(store.items).toHaveLength(0);
    expect(store.count).toBe(0);
    expect(store.subtotal).toBe(0);
  });

  it('notifies subscribers on add', async () => {
    const store = await getFreshStore();
    let eventType: string | null = null;
    store.subscribe((event) => { eventType = event.type; });
    store.addItem({ productId: '1', name: 'Test', price: 100, quantity: 1 });
    expect(eventType).toBe('item:added');
  });

  it('notifies subscribers on quantity update', async () => {
    const store = await getFreshStore();
    let eventType: string | null = null;
    store.subscribe((event) => { eventType = event.type; });
    store.addItem({ productId: '1', name: 'Test', price: 100, quantity: 1 });
    store.addItem({ productId: '1', name: 'Test', price: 100, quantity: 1 });
    expect(eventType).toBe('item:quantity-updated');
  });

  it('persists items to localStorage', async () => {
    const store = await getFreshStore();
    store.addItem({ productId: '1', name: 'Test', price: 100, quantity: 2 });

    const raw = localStorage.getItem('bajocero-cart');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.version).toBe(1);
    expect(parsed.items).toHaveLength(1);
    expect(parsed.items[0].quantity).toBe(2);
  });

  it('recovers items from localStorage on init', async () => {
    localStorage.setItem('bajocero-cart', JSON.stringify({ version: 1, items: [{ productId: '1', name: 'Saved', price: 500, quantity: 3 }] }));
    const store = await getFreshStore();
    expect(store.items).toHaveLength(1);
    expect(store.items[0].name).toBe('Saved');
    expect(store.subtotal).toBe(1500);
  });

  it('discards localStorage with mismatched version', async () => {
    localStorage.setItem('bajocero-cart', JSON.stringify({ version: 999, items: [{ productId: 'old', name: 'Old', price: 1, quantity: 1 }] }));
    const store = await getFreshStore();
    expect(store.items).toHaveLength(0);
  });

  it('provides immutable item snapshots', async () => {
    const store = await getFreshStore();
    store.addItem({ productId: '1', name: 'Test', price: 100, quantity: 1 });
    const items = store.items;
    items[0].quantity = 999;
    expect(store.items[0].quantity).toBe(1);
  });

  it('returns undefined for non-existent item', async () => {
    const store = await getFreshStore();
    expect(store.getItem('nonexistent')).toBeUndefined();
  });

  it('computes getSummary correctly', async () => {
    const store = await getFreshStore();
    store.addItem({ productId: '1', name: 'A', price: 100, quantity: 2 });
    store.addItem({ productId: '2', name: 'B', price: 50, quantity: 3 });
    const summary = store.getSummary();
    expect(summary.count).toBe(5);
    expect(summary.subtotal).toBe(350);
    expect(summary.items).toHaveLength(2);
  });

  it('handles removeItem on non-existent product gracefully', async () => {
    const store = await getFreshStore();
    expect(() => store.removeItem('nonexistent')).not.toThrow();
  });

  it('handles updateQuantity on non-existent product gracefully', async () => {
    const store = await getFreshStore();
    store.updateQuantity('nonexistent', 5);
    expect(store.items).toHaveLength(0);
  });

  it('passes event data with product info', async () => {
    const store = await getFreshStore();
    let captured: any = null;
    store.subscribe((event) => { captured = event; });
    store.addItem({ productId: 'p1', name: 'Product One', price: 200, quantity: 1 });
    expect(captured.data.productId).toBe('p1');
    expect(captured.data.name).toBe('Product One');
  });

  it('sends null type on initial subscription', async () => {
    const store = await getFreshStore();
    let initialType: string | null = 'unset';
    store.subscribe((event) => { initialType = event.type; });
    expect(initialType).toBeNull();
  });
});
