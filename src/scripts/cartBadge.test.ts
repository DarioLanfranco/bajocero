import { describe, it, expect, beforeEach, vi } from 'vitest';
import { cartStore } from '../store/cart';

const storage = new Map<string, string>();

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

beforeEach(() => {
  storage.clear();
  document.body.innerHTML = `
    <button id="cart-btn" aria-label="Ver carrito de compras, vacío">
      <span class="cart-btn__label">Carrito</span>
      <span id="cart-badge" class="cart-btn__badge">0</span>
    </button>
  `;
  cartStore.clear();

  if (typeof Element.prototype.animate !== 'function') {
    Object.defineProperty(Element.prototype, 'animate', {
      writable: true,
      configurable: true,
      value: vi.fn(() => ({
        play: vi.fn(),
        cancel: vi.fn(),
        finish: vi.fn(),
        pause: vi.fn(),
        reverse: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  }
});

describe('createCartBadge — integration', () => {
  it('updates badge count when items are added to store', async () => {
    const { createCartBadge } = await import('./cartBadge');

    createCartBadge({
      cartBtnId: 'cart-btn',
      cartBadgeId: 'cart-badge',
      cartLabelSelector: '.cart-btn__label',
    });

    const badge = document.getElementById('cart-badge')!;
    const label = document.querySelector('.cart-btn__label')!;

    expect(badge.classList.contains('visible')).toBe(false);

    cartStore.addItem({ productId: '1', name: 'Product A', price: 100, quantity: 1 });

    expect(badge.classList.contains('visible')).toBe(true);
    expect(badge.textContent).toBe('1');
    expect(label.textContent).toBe('Ver carrito (1)');
  });

  it('updates badge when quantity changes', async () => {
    const { createCartBadge } = await import('./cartBadge');

    createCartBadge({
      cartBtnId: 'cart-btn',
      cartBadgeId: 'cart-badge',
      cartLabelSelector: '.cart-btn__label',
    });

    const badge = document.getElementById('cart-badge')!;

    cartStore.addItem({ productId: '1', name: 'Product A', price: 100, quantity: 1 });
    cartStore.addItem({ productId: '1', name: 'Product A', price: 100, quantity: 2 });

    expect(badge.textContent).toBe('3');
  });

  it('hides badge when cart is cleared', async () => {
    const { createCartBadge } = await import('./cartBadge');

    createCartBadge({
      cartBtnId: 'cart-btn',
      cartBadgeId: 'cart-badge',
      cartLabelSelector: '.cart-btn__label',
    });

    const badge = document.getElementById('cart-badge')!;

    cartStore.addItem({ productId: '1', name: 'Product A', price: 100, quantity: 1 });
    expect(badge.classList.contains('visible')).toBe(true);

    cartStore.clear();
    expect(badge.classList.contains('visible')).toBe(false);
    expect(badge.textContent).toBe('0');
  });

  it('handles multiple items and computes correct total count', async () => {
    const { createCartBadge } = await import('./cartBadge');

    createCartBadge({
      cartBtnId: 'cart-btn',
      cartBadgeId: 'cart-badge',
      cartLabelSelector: '.cart-btn__label',
    });

    const badge = document.getElementById('cart-badge')!;

    cartStore.addItem({ productId: '1', name: 'A', price: 100, quantity: 2 });
    cartStore.addItem({ productId: '2', name: 'B', price: 200, quantity: 3 });

    expect(badge.textContent).toBe('5');
  });

  it('cleanup destroys subscription', async () => {
    const { createCartBadge } = await import('./cartBadge');

    const api = createCartBadge({
      cartBtnId: 'cart-btn',
      cartBadgeId: 'cart-badge',
      cartLabelSelector: '.cart-btn__label',
    });

    api.destroy();

    const badgeEl = document.getElementById('cart-badge')!;
    cartStore.addItem({ productId: '1', name: 'A', price: 100, quantity: 1 });

    expect(badgeEl.classList.contains('visible')).toBe(false);
  });
});
