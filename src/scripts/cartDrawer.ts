import { cartStore } from '../store/cart';
import { createDrawer } from './drawer';
import { createCartViewController, type CartViewElements } from './cartViewController';
import { createCheckoutController, type CheckoutElements } from './checkoutController';

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
  const clearBtn = q(root, 'clear-btn');
  const continueBtn = q(root, 'continue-btn');
  const cartView = q(root, 'cart-view');
  const checkoutView = q(root, 'checkout-view');
  const cartActions = q(root, 'cart-actions');
  const checkoutActions = q(root, 'checkout-actions');

  if (
    !itemsEl || !emptyEl || !summaryEl || !countSummaryEl || !subtotalEl ||
    !clearBtn || !continueBtn || !cartView || !checkoutView || !cartActions ||
    !checkoutActions
  ) return null;

  return {
    itemsEl, emptyEl, summaryEl, countSummaryEl, subtotalEl,
    clearBtn, continueBtn, cartView, checkoutView, cartActions, checkoutActions,
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
  const sendBtn = q(root, 'send-btn');
  const backBtn = q(root, 'back-btn');

  if (
    !checkoutName || !checkoutDelivery || !checkoutPayment ||
    !checkoutAddress || !checkoutAddressWrapper ||
    !checkoutDeliveryInfo || !checkoutPaymentInfo || !sendBtn || !backBtn
  ) return null;

  return {
    checkoutName, checkoutDelivery, checkoutPayment,
    checkoutAddress, checkoutAddressWrapper,
    checkoutDeliveryInfo, checkoutPaymentInfo, sendBtn, backBtn,
  };
}

let drawerAPI: CartDrawerAPI | null = null;

export function createCartDrawer(drawerId: string): CartDrawerAPI {
  if (drawerAPI) return drawerAPI;

  const drawerEl = document.getElementById(drawerId);
  if (!drawerEl) return createNoopAPI();

  // Derived IDs from the drawer component convention (Drawer.astro uses `${id}-*`)
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
    },
  };

  drawerAPI = api;
  return api;
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

export function toggleCartDrawer(): void {
  drawerAPI?.toggle();
}

export function openCartDrawer(): void {
  drawerAPI?.open();
}

export function closeCartDrawer(): void {
  drawerAPI?.close();
}

export function initCartDrawerToggle(): void {
  const cartBtn = document.getElementById('cart-btn');
  if (cartBtn) cartBtn.addEventListener('click', toggleCartDrawer);
}
