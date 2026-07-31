import { cartStore } from '../store/cart';
import { buildCartItemElement } from './cartRenderer';
import { showErrorToast } from './toast';

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

function buildItems(els: CartViewElements): void {
  const { items } = cartStore;
  els.itemsEl.replaceChildren();

  if (items.length === 0) {
    els.emptyEl.hidden = false;
    return;
  }

  els.emptyEl.hidden = true;

  for (const item of items) {
    const el = buildCartItemElement(item);
    if (el) els.itemsEl.appendChild(el);
  }
}

function updateSummary(els: CartViewElements): void {
  const summary = cartStore.getSummary();

  if (summary.items.length === 0) {
    els.summaryEl.hidden = true;
    els.clearBtn.hidden = true;
    if (els.disclaimerEl) els.disclaimerEl.hidden = true;
    els.countSummaryEl.textContent = '0 productos';
    els.subtotalEl.textContent = '$0';
    return;
  }

  els.summaryEl.hidden = false;
  els.clearBtn.hidden = false;

  const estimated = summary.items.some((i) => i.quantity > 0);
  if (els.disclaimerEl) els.disclaimerEl.hidden = !estimated;

  const itemWord = summary.count === 1 ? 'producto' : 'productos';
  els.countSummaryEl.textContent = `${summary.count} ${itemWord}`;
  els.subtotalEl.textContent = `$${summary.subtotal.toLocaleString('es-AR')}`;
}

function renderItems(els: CartViewElements): void {
  buildItems(els);
  updateSummary(els);
}

function showCheckoutView(els: CartViewElements): void {
  els.cartView.hidden = true;
  els.cartActions.hidden = true;
  els.checkoutView.hidden = false;
  els.checkoutActions.hidden = false;
}

function showCartView(els: CartViewElements): void {
  els.checkoutView.hidden = true;
  els.checkoutActions.hidden = true;
  els.cartView.hidden = false;
  els.cartActions.hidden = false;
}

function handleItemsClick(els: CartViewElements, e: Event): void {
  const target = e.target;
  if (!(target instanceof HTMLElement)) return;

  const cardEl = target.closest('[data-product-id]');
  if (!(cardEl instanceof HTMLElement)) return;

  const productId = cardEl.dataset.productId;
  if (!productId) return;

  const action = target.dataset.action;

  if (action === 'increment') {
    const item = cartStore.getItem(productId);
    if (item) cartStore.updateQuantity(productId, item.quantity + 1);
  } else if (action === 'decrement') {
    const item = cartStore.getItem(productId);
    if (item) cartStore.updateQuantity(productId, item.quantity - 1);
  } else if (action === 'add') {
    const select = cardEl.querySelector<HTMLSelectElement>('[data-weight-select]');
    const rawWeight = select ? parseFloat(select.value) : 1;
    const quantity = Number.isFinite(rawWeight) && rawWeight > 0 ? rawWeight : 1;
    const name = cardEl.dataset.productName || '';
    const price = parseFloat(cardEl.dataset.productPrice || '0');
    const presentacion = cardEl.dataset.productPresentacion || undefined;
    const added = cartStore.addItem({ productId, name, quantity, price, presentacion });
    if (!added) showErrorToast('No se pudo agregar: alcanzaste el límite de 50 unidades');
  }
}

export function createCartViewController(els: CartViewElements) {
  return {
    renderItems: () => renderItems(els),
    showCheckoutView: () => showCheckoutView(els),
    showCartView: () => showCartView(els),
    handleItemsClick: (e: Event) => handleItemsClick(els, e),
  };
}
