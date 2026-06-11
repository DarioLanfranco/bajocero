import { cartStore } from '../store/cart';
import { createDrawer } from './drawer';
import { buildCartItemElement, clearItemElements } from './cartRenderer';
import { buildWhatsAppMessage } from './cartMessage';
import { formatPrice } from '../utils/format';

const WHATSAPP_PHONE = '543584201263';

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

export interface CartDrawerAPI {
  isOpen(): boolean;
  open(): void;
  close(): void;
  toggle(): void;
  destroy(): void;
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

  const els = getElements(config);
  if (!els) return drawer;

  const {
    itemsEl, emptyEl, summaryEl, countSummaryEl, subtotalEl,
    clearBtn, continueBtn, cartView, checkoutView, cartActions,
    checkoutActions, checkoutName, checkoutDelivery, checkoutPayment,
    checkoutDeliveryInfo, checkoutPaymentInfo, sendBtn, backBtn,
  } = els;

  function renderItems(): void {
    const summary = cartStore.getSummary();
    clearItemElements(itemsEl);

    if (summary.items.length === 0) {
      emptyEl.hidden = false;
      summaryEl.hidden = true;
      showCartView();
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

  function showCartView(): void {
    cartView.hidden = false;
    checkoutView.hidden = true;
    cartActions.hidden = false;
    checkoutActions.hidden = true;
  }

  function showCheckoutView(): void {
    cartView.hidden = true;
    checkoutView.hidden = false;
    cartActions.hidden = true;
    checkoutActions.hidden = false;
    checkoutName.value = '';
    checkoutName.focus();
    updateConditionalMessages();
  }

  function updateConditionalMessages(): void {
    const deliverySelected = checkoutDelivery.querySelector<HTMLInputElement>(
      'input[name="delivery"]:checked',
    );
    checkoutDeliveryInfo.hidden = deliverySelected?.value !== 'envio';

    const paymentSelected = checkoutPayment.querySelector<HTMLInputElement>(
      'input[name="payment"]:checked',
    );
    checkoutPaymentInfo.hidden = paymentSelected?.value !== 'transferencia';
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
      if (item) cartStore.updateQuantity(productId, item.quantity - 1);
    }
  }

  clearBtn.addEventListener('click', () => {
    cartStore.clear();
    renderItems();
    const cartBtn = document.getElementById('cart-btn');
    cartBtn?.focus();
  });

  continueBtn.addEventListener('click', showCheckoutView);

  backBtn.addEventListener('click', showCartView);

  checkoutDelivery.addEventListener('change', updateConditionalMessages);
  checkoutPayment.addEventListener('change', updateConditionalMessages);

  sendBtn.addEventListener('click', () => {
    const name = checkoutName.value.trim();
    if (!name) {
      checkoutName.focus();
      checkoutName.style.borderBottomColor = 'var(--color-coral)';
      setTimeout(() => {
        checkoutName.style.borderBottomColor = '';
      }, 2000);
      return;
    }

    const deliveryInput = checkoutDelivery.querySelector<HTMLInputElement>(
      'input[name="delivery"]:checked',
    );
    const paymentInput = checkoutPayment.querySelector<HTMLInputElement>(
      'input[name="payment"]:checked',
    );

    const mensaje = buildWhatsAppMessage({
      name,
      items: cartStore.items,
      deliveryLabel: deliveryInput?.value === 'envio' ? 'Envío por Cadete' : 'Retiro en Local',
      paymentLabel: paymentInput?.value === 'transferencia' ? 'Transferencia' : 'Efectivo',
      subtotal: cartStore.subtotal,
    });

    window.location.href = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(mensaje)}`;
  });

  itemsEl.addEventListener('click', handleItemsClick);

  const unsubscribe = cartStore.subscribe(() => {
    if (drawer.isOpen()) {
      const inCheckout = !checkoutView.hidden;
      if (inCheckout && cartStore.items.length === 0) {
        showCartView();
      }
      renderItems();
    }
  });

  const api: CartDrawerAPI = {
    isOpen: drawer.isOpen,
    open() {
      renderItems();
      showCartView();
      drawer.open();
    },
    close: drawer.close,
    toggle() {
      if (drawer.isOpen()) {
        drawer.close();
      } else {
        renderItems();
        showCartView();
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

function getElements(config: CartDrawerConfig) {
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
  const checkoutName = document.getElementById(config.checkoutNameId) as HTMLInputElement | null;
  const checkoutDelivery = document.getElementById(config.checkoutDeliveryId);
  const checkoutPayment = document.getElementById(config.checkoutPaymentId);
  const checkoutDeliveryInfo = document.getElementById(config.checkoutDeliveryInfoId);
  const checkoutPaymentInfo = document.getElementById(config.checkoutPaymentInfoId);
  const sendBtn = document.getElementById(config.sendBtnId);
  const backBtn = document.getElementById(config.backBtnId);

  if (
    !itemsEl || !emptyEl || !summaryEl || !countSummaryEl || !subtotalEl ||
    !clearBtn || !continueBtn || !cartView || !checkoutView || !cartActions ||
    !checkoutActions || !checkoutName || !checkoutDelivery || !checkoutPayment ||
    !checkoutDeliveryInfo || !checkoutPaymentInfo || !sendBtn || !backBtn
  ) {
    return null;
  }

  return {
    itemsEl, emptyEl, summaryEl, countSummaryEl, subtotalEl,
    clearBtn, continueBtn, cartView, checkoutView, cartActions,
    checkoutActions, checkoutName, checkoutDelivery, checkoutPayment,
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
