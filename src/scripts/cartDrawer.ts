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
    clearBtn, continueBtn, cartView, checkoutView, cartActions, checkoutActions,
    disclaimerEl: disclaimerEl || undefined,
  };
}

function resolveCheckoutElements(root: HTMLElement): CheckoutElements | null {
  const checkoutName = q(root, 'checkout-name') as HTMLInputElement | null;
  const checkoutDelivery = q(root, 'checkout-delivery');
  const checkoutPayment = q(root, 'checkout-payment');
  const checkoutAddress = q(root, 'checkout-address') as HTMLInputElement | null;
  const checkoutAddressWrapper = q(root, 'checkout-address-wrapper');
  const checkoutDeliveryInfo = q(root, 'checkout-delivery-info');
  const checkoutPaymentInfo = q(root, 'checkout-payment-info');
  const checkoutPaymentRestriction = q(root, 'checkout-payment-restriction');
  const sendBtn = q(root, 'send-btn');
  const backBtn = q(root, 'back-btn');

  if (
    !checkoutName || !checkoutDelivery || !checkoutPayment ||
    !checkoutAddress || !checkoutAddressWrapper ||
    !checkoutDeliveryInfo || !checkoutPaymentInfo ||
    !checkoutPaymentRestriction || !sendBtn || !backBtn
  ) return null;

  return {
    checkoutName, checkoutDelivery, checkoutPayment,
    checkoutAddress, checkoutAddressWrapper,
    checkoutDeliveryInfo, checkoutPaymentInfo,
    checkoutPaymentRestriction, sendBtn, backBtn,
  };
}

const instances = new Map<string, CartDrawerAPI>();

export function createCartDrawer(drawerId: string): CartDrawerAPI {
  const existing = instances.get(drawerId);
  if (existing) return existing;

  try {
    const drawerEl = document.getElementById(drawerId);
    if (!drawerEl) return createNoopAPI();

    const derivedOverlayId = `${drawerId}-overlay`;
    const derivedPanelId = `${drawerId}-panel`;
    const derivedCloseId = `${drawerId}-close`;

    const drawer = createDrawer({
      drawerId,
      overlayId: derivedOverlayId,
      panelId: derivedPanelId,
      closeId: derivedCloseId,
    });

    const cartViewEls = resolveCartViewElements(drawerEl);
    const checkoutEls = resolveCheckoutElements(drawerEl);
    if (!cartViewEls || !checkoutEls) return drawer;

    const cvc = createCartViewController(cartViewEls);
    const cc = createCheckoutController(checkoutEls);
    cc.init(cvc);

    cartViewEls.clearBtn.addEventListener('click', () => {
      cartStore.clear();
      cvc.renderItems();
      const cartBtn = document.getElementById('cart-btn');
      cartBtn?.focus();
    });

    cartViewEls.continueBtn.addEventListener('click', () => {
      cvc.showCheckoutView();
      checkoutEls.checkoutName.value = '';
      checkoutEls.checkoutName.focus();
    });

    cartViewEls.itemsEl.addEventListener('click', cvc.handleItemsClick);

    const unsubscribe = cartStore.subscribe(() => {
      if (drawer.isOpen()) {
        const inCheckout = !cartViewEls.checkoutView.hidden;
        if (inCheckout && cartStore.items.length === 0) {
          cvc.showCartView();
        }
        cvc.renderItems();
      }
    });

    const api: CartDrawerAPI = {
      isOpen: drawer.isOpen,
      open() {
        cvc.renderItems();
        cvc.showCartView();
        drawer.open();
      },
      close: drawer.close,
      toggle() {
        if (drawer.isOpen()) {
          drawer.close();
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

    instances.set(drawerId, api);
    return api;
  } catch (err) {
    log('cartDrawer', 'error', 'create failed', err);
    return createNoopAPI();
  }
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
