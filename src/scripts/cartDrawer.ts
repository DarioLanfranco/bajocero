import { cartStore } from '../store/cart';
import { createDrawer } from './drawer';
import type { CartItem } from '../types/cart';
import { formatPrice } from '../utils/format';
import { createMinusIcon, createPlusIcon } from './icons';

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

function buildCartItemElement(item: CartItem): HTMLElement {
  const lineTotal = item.price * item.quantity;

  const div = document.createElement('div');
  div.className = 'cart-drawer__item';
  div.dataset.productId = item.productId;

  const info = document.createElement('div');
  info.className = 'cart-drawer__item-info';

  const name = document.createElement('span');
  name.className = 'cart-drawer__item-name';
  name.textContent = item.name;

  const priceSpan = document.createElement('span');
  priceSpan.className = 'cart-drawer__item-price';
  priceSpan.textContent = `${formatPrice(item.price)} c/u`;

  info.append(name, priceSpan);

  const controls = document.createElement('div');
  controls.className = 'cart-drawer__item-controls';

  const decBtn = document.createElement('button');
  decBtn.className = 'cart-drawer__qty-btn';
  decBtn.type = 'button';
  decBtn.dataset.action = 'decrement';
  decBtn.setAttribute('aria-label', `Disminuir cantidad de ${item.name}`);
  decBtn.appendChild(createMinusIcon(16));

  const qty = document.createElement('span');
  qty.className = 'cart-drawer__qty-value';
  qty.textContent = String(item.quantity);

  const incBtn = document.createElement('button');
  incBtn.className = 'cart-drawer__qty-btn cart-drawer__qty-btn--increment';
  incBtn.type = 'button';
  incBtn.dataset.action = 'increment';
  incBtn.setAttribute('aria-label', `Aumentar cantidad de ${item.name}`);
  incBtn.appendChild(createPlusIcon(16));

  controls.append(decBtn, qty, incBtn);

  const total = document.createElement('span');
  total.className = 'cart-drawer__item-total';
  total.textContent = formatPrice(lineTotal);

  div.append(info, controls, total);
  return div;
}

let drawerAPI: CartDrawerAPI | null = null;

export function createCartDrawer(config: CartDrawerConfig): CartDrawerAPI {
  if (drawerAPI) return drawerAPI;

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
    const noop = drawer;
    return noop;
  }

  function renderItems(): void {
    const summary = cartStore.getSummary();

    clearItemElements();

    if (summary.items.length === 0) {
      emptyEl.hidden = false;
      summaryEl.hidden = true;
      return;
    }

    emptyEl.hidden = true;
    summaryEl.hidden = false;

    countSummaryEl.textContent = String(summary.count);
    subtotalEl.textContent = formatPrice(summary.subtotal);

    const fragment = document.createDocumentFragment();
    for (const item of summary.items) {
      fragment.appendChild(buildCartItemElement(item));
    }
    itemsEl.appendChild(fragment);
  }

  function clearItemElements(): void {
    const existing = itemsEl.querySelectorAll('.cart-drawer__item');
    for (let i = 0; i < existing.length; i++) {
      existing[i].remove();
    }
  }

  function handleItemsClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    const actionBtn = target.closest<HTMLButtonElement>('[data-action]');
    if (!actionBtn) return;

    const itemEl = actionBtn.closest<HTMLElement>('[data-product-id]');
    if (!itemEl) return;

    const productId = itemEl.dataset.productId!;
    const action = actionBtn.dataset.action;

    if (action === 'increment') {
      const item = cartStore.getItem(productId);
      if (item) cartStore.updateQuantity(productId, item.quantity + 1);
    } else if (action === 'decrement') {
      const item = cartStore.getItem(productId);
      if (item) {
        cartStore.updateQuantity(productId, item.quantity - 1);
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
  return api;
}

export function toggleCartDrawer(): void {
  drawerAPI?.toggle();
}

export function openCartDrawer(): void {
  drawerAPI?.open();
}

export function closeCartDrawer(): void {
  drawerAPI?.close();
}
