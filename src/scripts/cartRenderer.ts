import type { CartItem } from '../types/cart';
import { TIPO_VENTA } from '../types/tipoVenta';
import { formatPrice, formatWeightDetail } from '../utils/format';
import { createMinusIcon, createPlusIcon } from './icons';

function createNameElement(item: CartItem): HTMLElement {
  const el = document.createElement('span');
  el.className = 'cart-drawer__item-name';
  el.textContent = item.name;
  el.id = `cart-item-name-${item.productId}`;
  return el;
}

function createWeightDetailElement(item: CartItem): HTMLElement {
  const el = document.createElement('span');
  el.className = 'cart-drawer__item-weight';
  const detail = formatWeightDetail(item.quantity, item.presentacion);
  el.textContent = detail || `${item.quantity} unidad(es)`;
  return el;
}

function createQuantityControls(item: CartItem): HTMLElement {
  const controls = document.createElement('div');
  controls.className = 'cart-drawer__item-controls';

  const decBtn = document.createElement('button');
  decBtn.className = 'cart-drawer__qty-btn';
  decBtn.type = 'button';
  decBtn.dataset.action = 'decrement';
  decBtn.setAttribute('aria-label', `Disminuir cantidad de ${item.name}`);
  decBtn.appendChild(createMinusIcon(20));

  const qty = document.createElement('span');
  qty.className = 'cart-drawer__qty-value';
  qty.textContent = String(item.quantity);

  const incBtn = document.createElement('button');
  incBtn.className = 'cart-drawer__qty-btn cart-drawer__qty-btn--increment';
  incBtn.type = 'button';
  incBtn.dataset.action = 'increment';
  incBtn.setAttribute('aria-label', `Aumentar cantidad de ${item.name}`);
  incBtn.appendChild(createPlusIcon(20));

  controls.append(decBtn, qty, incBtn);
  return controls;
}

function createPricingElement(item: CartItem): HTMLElement {
  const lineTotal = item.price * item.quantity;
  const pricing = document.createElement('div');
  pricing.className = 'cart-drawer__item-pricing';

  const total = document.createElement('span');
  total.className = 'cart-drawer__item-total';
  total.textContent = formatPrice(lineTotal);

  const unitPrice = document.createElement('span');
  unitPrice.className = 'cart-drawer__item-unit';
  const ventaTipo = item.tipoVenta ?? 'unidad';
  const config = TIPO_VENTA[ventaTipo];
  const unitLabel = config.isWeight ? '/kg' : ' c/u';
  unitPrice.textContent = `a ${formatPrice(item.price)}${unitLabel}`;

  pricing.append(total, unitPrice);
  return pricing;
}

export function buildCartItemElement(item: CartItem): HTMLElement {
  const div = document.createElement('div');
  div.className = 'cart-drawer__item';
  div.dataset.productId = item.productId;

  const footer = document.createElement('div');
  footer.className = 'cart-drawer__item-footer';
  footer.append(createQuantityControls(item), createPricingElement(item));

  div.append(createNameElement(item), createWeightDetailElement(item), footer);
  return div;
}

export function updateCartItemElement(el: HTMLElement, item: CartItem): void {
  const qtyEl = el.querySelector<HTMLElement>('.cart-drawer__qty-value');
  const totalEl = el.querySelector<HTMLElement>('.cart-drawer__item-total');
  const weightEl = el.querySelector<HTMLElement>('.cart-drawer__item-weight');
  const unitEl = el.querySelector<HTMLElement>('.cart-drawer__item-unit');

  if (qtyEl) qtyEl.textContent = String(item.quantity);
  if (totalEl) totalEl.textContent = formatPrice(item.price * item.quantity);
  if (weightEl) {
    const detail = formatWeightDetail(item.quantity, item.presentacion);
    weightEl.textContent = detail || `${item.quantity} unidad(es)`;
  }
  if (unitEl) {
    const ventaTipo = item.tipoVenta ?? 'unidad';
    const config = TIPO_VENTA[ventaTipo];
    const unitLabel = config.isWeight ? '/kg' : ' c/u';
    unitEl.textContent = `a ${formatPrice(item.price)}${unitLabel}`;
  }
}

export function reconcileCartItems(container: HTMLElement, items: CartItem[]): void {
  const existing = new Map<string, HTMLElement>();
  container.querySelectorAll<HTMLElement>('.cart-drawer__item').forEach((el) => {
    existing.set(el.dataset.productId!, el);
  });

  const fragment = document.createDocumentFragment();
  for (const item of items) {
    const existingEl = existing.get(item.productId);
    if (existingEl) {
      updateCartItemElement(existingEl, item);
      existing.delete(item.productId);
      fragment.appendChild(existingEl);
    } else {
      fragment.appendChild(buildCartItemElement(item));
    }
  }

  container.replaceChildren(fragment);
}
