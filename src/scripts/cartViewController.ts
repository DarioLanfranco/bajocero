import { cartStore } from '../store/cart';
import { reconcileCartItems } from './cartRenderer';
import { formatPrice } from '../utils/format';
import { hasEstimatedItems } from './cartMessage';

export interface CartViewElements {
  itemsEl: HTMLElement;
  emptyEl: HTMLElement;
  summaryEl: HTMLElement;
  countSummaryEl: HTMLElement;
  subtotalEl: HTMLElement;
  totalLabelEl: HTMLElement;
  clearBtn: HTMLElement;
  continueBtn: HTMLElement;
  cartView: HTMLElement;
  checkoutView: HTMLElement;
  cartActions: HTMLElement;
  checkoutActions: HTMLElement;
  disclaimerEl?: HTMLElement;
}

export interface CartViewController {
  renderItems(): void;
  showCartView(): void;
  showCheckoutView(): void;
  handleItemsClick(e: MouseEvent): void;
}

export function createCartViewController(els: CartViewElements): CartViewController {
  function renderItems(): void {
    const summary = cartStore.getSummary();

    if (summary.items.length === 0) {
      els.emptyEl.hidden = false;
      els.summaryEl.hidden = true;
      showCartView();
      els.itemsEl.replaceChildren();
      return;
    }

    els.emptyEl.hidden = true;
    els.summaryEl.hidden = false;
    els.countSummaryEl.textContent = String(summary.count);
    els.subtotalEl.textContent = formatPrice(summary.subtotal);

    const hasEstimated = hasEstimatedItems(summary.items);
    if (els.totalLabelEl) {
      els.totalLabelEl.textContent = hasEstimated ? 'Total estimado' : 'Total';
    }
    if (els.disclaimerEl) {
      els.disclaimerEl.hidden = !hasEstimated;
    }

    reconcileCartItems(els.itemsEl, summary.items);
  }

  function showCartView(): void {
    els.cartView.hidden = false;
    els.checkoutView.hidden = true;
    els.cartActions.hidden = false;
    els.checkoutActions.hidden = true;
  }

  function showCheckoutView(): void {
    els.cartView.hidden = true;
    els.checkoutView.hidden = false;
    els.cartActions.hidden = true;
    els.checkoutActions.hidden = false;
  }

  function handleItemsClick(e: MouseEvent): void {
    if (!(e.target instanceof Element)) return;
    const actionBtn = e.target.closest<HTMLButtonElement>('[data-action]');
    if (!actionBtn) return;

    const itemEl = actionBtn.closest<HTMLElement>('[data-product-id]');
    if (!itemEl) return;

    const productId = itemEl.dataset.productId;
    if (!productId) return;
    const action = actionBtn.dataset.action;

    if (action === 'increment') {
      const item = cartStore.getItem(productId);
      if (item) cartStore.updateQuantity(productId, item.quantity + 1);
    } else if (action === 'decrement') {
      const item = cartStore.getItem(productId);
      if (item) cartStore.updateQuantity(productId, item.quantity - 1);
    }
  }

  return { renderItems, showCartView, showCheckoutView, handleItemsClick };
}
