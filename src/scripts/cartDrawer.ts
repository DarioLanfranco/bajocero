import { cartStore } from '../store/cart';
import { createDrawer } from './drawer';
import type { CartItem } from '../types/cart';
import { formatPrice } from '../utils/format';

export interface CartDrawerConfig {
  drawerId: string;
  overlayId: string;
  panelId: string;
  closeId: string;
  itemsId: string;
  emptyId: string;
  summaryId: string;
  countSummaryId: string;
  subtotalId: string;
  clearId: string;
}

export interface CartDrawerAPI {
  isOpen(): boolean;
  open(): void;
  close(): void;
  toggle(): void;
  destroy(): void;
}

const GLOBAL_DRAWER_KEY = '__bajocero_cart_drawer__';
let drawerAPI: CartDrawerAPI | null = null;

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderCartItem(item: CartItem): string {
  const lineTotal = item.price * item.quantity;
  const safeName = escapeHTML(item.name);
  return `
    <div class="cart-drawer__item" data-product-id="${item.productId}">
      <div class="cart-drawer__item-info">
        <span class="cart-drawer__item-name">${safeName}</span>
        <span class="cart-drawer__item-price">${formatPrice(item.price)} c/u</span>
      </div>
      <div class="cart-drawer__item-controls">
        <button class="cart-drawer__qty-btn" data-action="decrement" type="button" aria-label="Disminuir cantidad de ${safeName}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
        <span class="cart-drawer__qty-value">${item.quantity}</span>
        <button class="cart-drawer__qty-btn cart-drawer__qty-btn--increment" data-action="increment" type="button" aria-label="Aumentar cantidad de ${safeName}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
      </div>
      <span class="cart-drawer__item-total">${formatPrice(lineTotal)}</span>
    </div>
  `;
}

function createCartDrawer(config: CartDrawerConfig): CartDrawerAPI {
  const existing = getDrawerAPI();
  if (existing) return existing;

  const drawer = createDrawer({
    drawerId: config.drawerId,
    overlayId: config.overlayId,
    panelId: config.panelId,
    closeId: config.closeId,
  });

  const itemsEl = document.getElementById(config.itemsId);
  const emptyEl = document.getElementById(config.emptyId);
  const summaryEl = document.getElementById(config.summaryId);
  const countSummaryEl = document.getElementById(config.countSummaryId);
  const subtotalEl = document.getElementById(config.subtotalId);
  const clearBtn = document.getElementById(config.clearId);

  if (!itemsEl || !emptyEl || !summaryEl || !countSummaryEl || !subtotalEl || !clearBtn) {
    console.error('[cartDrawer] Missing required DOM elements');
    return {
      isOpen: drawer.isOpen,
      open: drawer.open,
      close: drawer.close,
      toggle: drawer.toggle,
      destroy: drawer.destroy,
    };
  }

  function renderItems(): void {
    const summary = cartStore.getSummary();

    if (summary.items.length === 0) {
      emptyEl.hidden = false;
      summaryEl.hidden = true;
      itemsEl.querySelectorAll('.cart-drawer__item').forEach((el) => el.remove());
      return;
    }

    emptyEl.hidden = true;
    summaryEl.hidden = false;

    countSummaryEl.textContent = String(summary.count);
    subtotalEl.textContent = formatPrice(summary.subtotal);

    const html = summary.items.map(renderCartItem).join('');
    itemsEl.querySelectorAll('.cart-drawer__item').forEach((el) => el.remove());
    itemsEl.insertAdjacentHTML('beforeend', html);
  }

  function handleItemsClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    const actionBtn = target.closest<HTMLButtonElement>('[data-action]');
    if (!actionBtn) return;

    const itemEl = actionBtn.closest<HTMLElement>('[data-product-id]');
    if (!itemEl) return;

    const productId = itemEl.getAttribute('data-product-id')!;
    const action = actionBtn.getAttribute('data-action');

    if (action === 'increment') {
      const item = cartStore.getItem(productId);
      if (item) cartStore.updateQuantity(productId, item.quantity + 1);
    } else if (action === 'decrement') {
      const item = cartStore.getItem(productId);
      if (item) {
        if (item.quantity <= 1) {
          cartStore.removeItem(productId);
        } else {
          cartStore.updateQuantity(productId, item.quantity - 1);
        }
      }
    }
  }

  clearBtn.addEventListener('click', () => {
    cartStore.clear();
    renderItems();
    const cartBtn = document.getElementById('cart-btn');
    cartBtn?.focus();
  });

  itemsEl.addEventListener('click', handleItemsClick);

  const unsubscribe = cartStore.subscribe(() => {
    if (drawer.isOpen()) renderItems();
  });

  const api: CartDrawerAPI = {
    isOpen: drawer.isOpen,
    open() {
      renderItems();
      drawer.open();
    },
    close: drawer.close,
    toggle() {
      if (drawer.isOpen()) {
        drawer.close();
      } else {
        renderItems();
        drawer.open();
      }
    },
    destroy() {
      drawer.destroy();
      unsubscribe();
    },
  };

  drawerAPI = api;
  setDrawerAPI(api);
  return api;
}

export { createCartDrawer };

function getDrawerAPI(): CartDrawerAPI | null {
  if (typeof window !== 'undefined') {
    return (window as any)[GLOBAL_DRAWER_KEY] as CartDrawerAPI | null;
  }
  return null;
}

function setDrawerAPI(api: CartDrawerAPI): void {
  if (typeof window !== 'undefined') {
    (window as any)[GLOBAL_DRAWER_KEY] = api;
  }
}

export function toggleCartDrawer(): void {
  const api = getDrawerAPI() || drawerAPI;
  api?.toggle();
}

export function openCartDrawer(): void {
  const api = getDrawerAPI() || drawerAPI;
  api?.open();
}

export function closeCartDrawer(): void {
  const api = getDrawerAPI() || drawerAPI;
  api?.close();
}
