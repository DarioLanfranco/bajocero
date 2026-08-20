import { cartStore } from '../store/cart';
import { createDrawer } from './drawer';
import { createCartViewController, type CartViewElements } from './cartViewController';
import { createCheckoutController, type CheckoutElements } from './checkoutController';
import { log } from '../utils/logger';

export interface CartDrawerAPI {
  isOpen(): boolean;
  open(): void;
  close(): void;
  toggle(): void;
  destroy(): void;
}

const ROLE_ATTR = 'data-cart-role';

function q(root: HTMLElement, role: string): HTMLElement | null {
  return root.querySelector(`[${ROLE_ATTR}="${role}"]`);
}

function resolveCartViewElements(root: HTMLElement): CartViewElements | null {
  const itemsEl = q(root, 'items');
  const emptyEl = q(root, 'empty');
  const summaryEl = q(root, 'summary');
  const countSummaryEl = q(root, 'count-summary');
  const subtotalEl = q(root, 'subtotal');
  const totalLabelEl = q(root, 'total-label');
  const clearBtn = q(root, 'clear-btn');
  const continueBtn = q(root, 'continue-btn');
  const cartView = q(root, 'cart-view');
  const checkoutView = q(root, 'checkout-view');
  const cartActions = q(root, 'cart-actions');
  const checkoutActions = q(root, 'checkout-actions');
  const disclaimerEl = q(root, 'disclaimer');

  if (
    !itemsEl || !emptyEl || !summaryEl || !countSummaryEl || !subtotalEl ||
    !totalLabelEl || !clearBtn || !continueBtn || !cartView || !checkoutView ||
    !cartActions || !checkoutActions
  ) return null;

  return {
    itemsEl, emptyEl, summaryEl, countSummaryEl, subtotalEl, totalLabelEl,
    clearBtn: clearBtn as HTMLButtonElement,
    continueBtn: continueBtn as HTMLButtonElement,
    cartView, checkoutView, cartActions, checkoutActions,
    disclaimerEl: disclaimerEl || undefined,
  };
}

function resolveCheckoutElements(root: HTMLElement): CheckoutElements | null {
  const checkoutNameEl = q(root, 'checkout-name');
  const checkoutDelivery = q(root, 'checkout-delivery');
  const checkoutPayment = q(root, 'checkout-payment');
  const checkoutAddressEl = q(root, 'checkout-address');
  const checkoutAddressWrapper = q(root, 'checkout-address-wrapper');
  const checkoutDeliveryInfo = q(root, 'checkout-delivery-info');
  const checkoutPaymentInfo = q(root, 'checkout-payment-info');
  const checkoutPaymentRestriction = q(root, 'checkout-payment-restriction');
  const sendBtn = q(root, 'send-btn');
  const backBtn = q(root, 'back-btn');

  if (
    !(checkoutNameEl instanceof HTMLInputElement) ||
    !checkoutDelivery || !checkoutPayment ||
    !(checkoutAddressEl instanceof HTMLInputElement) ||
    !checkoutAddressWrapper ||
    !checkoutDeliveryInfo || !checkoutPaymentInfo ||
    !checkoutPaymentRestriction || !sendBtn || !backBtn
  ) return null;

  return {
    checkoutName: checkoutNameEl, checkoutDelivery, checkoutPayment,
    checkoutAddress: checkoutAddressEl, checkoutAddressWrapper,
    checkoutDeliveryInfo, checkoutPaymentInfo,
    checkoutPaymentRestriction, sendBtn, backBtn,
  };
}

function closeWithFocus(drawer: { close(): void }): void {
  drawer.close();
  const cartTrigger = document.getElementById('cart-btn');
  if (cartTrigger instanceof HTMLElement) cartTrigger.focus();
}

function setupCartEvents(
  cartViewEls: CartViewElements,
  checkoutEls: CheckoutElements,
  cvc: ReturnType<typeof createCartViewController>,
): void {
  cartViewEls.clearBtn.addEventListener('click', () => {
    cartStore.clear();
    cvc.renderItems();
    const cartBtn = document.getElementById('cart-btn');
    cartBtn?.focus();
  });

  cartViewEls.continueBtn.addEventListener('click', () => {
    if (cartStore.items.length === 0) return;
    cvc.showCheckoutView();
    checkoutEls.checkoutName.value = '';
    checkoutEls.checkoutName.focus();
  });

  cartViewEls.itemsEl.addEventListener('click', cvc.handleItemsClick);
}

function buildCartDrawerAPI(
  cvc: ReturnType<typeof createCartViewController>,
  drawer: ReturnType<typeof createDrawer>,
  closeWithFocusFn: () => void,
  unsubscribe: () => void,
  drawerId: string,
): CartDrawerAPI {
  return {
    isOpen: drawer.isOpen,
    open() {
      cvc.renderItems();
      cvc.showCartView();
      drawer.open();
    },
    close: closeWithFocusFn,
    toggle() {
      if (drawer.isOpen()) {
        closeWithFocusFn();
      } else {
        cvc.renderItems();
        cvc.showCartView();
        drawer.open();
      }
    },
    destroy() {
      drawer.destroy();
      unsubscribe();
      instances.delete(drawerId);
    },
  };
}

function createNoopAPI(): CartDrawerAPI {
  return {
    isOpen: () => false,
    open() {},
    close() {},
    toggle() {},
    destroy() {},
  };
}

const instances = new Map<string, CartDrawerAPI>();

export function createCartDrawer(drawerId: string): CartDrawerAPI {
  const existing = instances.get(drawerId);
  if (existing) return existing;

  try {
    const drawerEl = document.getElementById(drawerId);
    if (!drawerEl) return createNoopAPI();

    const drawer = createDrawer({
      drawerId,
      overlayId: `${drawerId}-overlay`,
      panelId: `${drawerId}-panel`,
      closeId: `${drawerId}-close`,
    });

    const cartViewEls = resolveCartViewElements(drawerEl);
    const checkoutEls = resolveCheckoutElements(drawerEl);
    if (!cartViewEls || !checkoutEls) return drawer;

    const cvc = createCartViewController(cartViewEls);
    const cc = createCheckoutController(checkoutEls, () => closeWithFocus(drawer));
    cc.init(cvc);

    setupCartEvents(cartViewEls, checkoutEls, cvc);

    const cwf = () => closeWithFocus(drawer);
    const unsubscribe = cartStore.subscribe(() => {
      if (drawer.isOpen()) {
        const inCheckout = !cartViewEls.checkoutView.hidden;
        if (inCheckout && cartStore.items.length === 0) cvc.showCartView();
        cvc.renderItems();
      }
    });

    const api = buildCartDrawerAPI(cvc, drawer, cwf, unsubscribe, drawerId);
    instances.set(drawerId, api);
    return api;
  } catch (err) {
    log('cartDrawer', 'error', 'create failed', err);
    return createNoopAPI();
  }
}

export function toggleCartDrawer(drawerId: string = 'cart-drawer'): void {
  instances.get(drawerId)?.toggle();
}

export function openCartDrawer(drawerId: string = 'cart-drawer'): void {
  instances.get(drawerId)?.open();
}

export function closeCartDrawer(drawerId: string = 'cart-drawer'): void {
  instances.get(drawerId)?.close();
}

export function initCartDrawerToggle(drawerId: string = 'cart-drawer'): void {
  const cartBtn = document.getElementById('cart-btn');
  if (cartBtn) cartBtn.addEventListener('click', () => toggleCartDrawer(drawerId));
}
