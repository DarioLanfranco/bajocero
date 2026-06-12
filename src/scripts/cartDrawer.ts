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
  continueBtnId: string;
  checkoutViewId: string;
  cartViewId: string;
  checkoutActionsId: string;
  cartActionsId: string;
  checkoutNameId: string;
  checkoutDeliveryId: string;
  checkoutPaymentId: string;
  checkoutDeliveryInfoId: string;
  checkoutPaymentInfoId: string;
  sendBtnId: string;
  backBtnId: string;
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

  const cartViewEls = getCartViewElements(config);
  const checkoutEls = getCheckoutElements(config);
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

function getCartViewElements(config: CartDrawerConfig): CartViewElements | null {
  const itemsEl = document.getElementById(config.itemsId);
  const emptyEl = document.getElementById(config.emptyId);
  const summaryEl = document.getElementById(config.summaryId);
  const countSummaryEl = document.getElementById(config.countSummaryId);
  const subtotalEl = document.getElementById(config.subtotalId);
  const clearBtn = document.getElementById(config.clearId);
  const continueBtn = document.getElementById(config.continueBtnId);
  const cartView = document.getElementById(config.cartViewId);
  const checkoutView = document.getElementById(config.checkoutViewId);
  const cartActions = document.getElementById(config.cartActionsId);
  const checkoutActions = document.getElementById(config.checkoutActionsId);

  if (
    !itemsEl || !emptyEl || !summaryEl || !countSummaryEl || !subtotalEl ||
    !clearBtn || !continueBtn || !cartView || !checkoutView || !cartActions ||
    !checkoutActions
  ) {
    return null;
  }

  return {
    itemsEl, emptyEl, summaryEl, countSummaryEl, subtotalEl,
    clearBtn, continueBtn, cartView, checkoutView, cartActions, checkoutActions,
  };
}

function getCheckoutElements(config: CartDrawerConfig): CheckoutElements | null {
  const checkoutName = document.getElementById(config.checkoutNameId) as HTMLInputElement | null;
  const checkoutDelivery = document.getElementById(config.checkoutDeliveryId);
  const checkoutPayment = document.getElementById(config.checkoutPaymentId);
  const checkoutDeliveryInfo = document.getElementById(config.checkoutDeliveryInfoId);
  const checkoutPaymentInfo = document.getElementById(config.checkoutPaymentInfoId);
  const sendBtn = document.getElementById(config.sendBtnId);
  const backBtn = document.getElementById(config.backBtnId);

  if (
    !checkoutName || !checkoutDelivery || !checkoutPayment ||
    !checkoutDeliveryInfo || !checkoutPaymentInfo || !sendBtn || !backBtn
  ) {
    return null;
  }

  return {
    checkoutName, checkoutDelivery, checkoutPayment,
    checkoutDeliveryInfo, checkoutPaymentInfo, sendBtn, backBtn,
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
