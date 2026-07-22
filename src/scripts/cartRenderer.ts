import type { CartItem } from '../types/cart';
import { formatPrice, formatWeightDetail } from '../utils/format';
import { createMinusIcon, createPlusIcon } from './icons';

export function buildCartItemElement(item: CartItem): HTMLElement {
  const lineTotal = item.price * item.quantity;

  const div = document.createElement('div');
  div.className = 'cart-drawer__item';
  div.dataset.productId = item.productId;

  const name = document.createElement('span');
  name.className = 'cart-drawer__item-name';
  name.textContent = item.name;
  name.id = `cart-item-name-${item.productId}`;

  const weightDetail = document.createElement('span');
  weightDetail.className = 'cart-drawer__item-weight';
  const detail = formatWeightDetail(item.quantity, item.presentacion);
  weightDetail.textContent = detail || `${item.quantity} unidad(es)`;

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

  const pricing = document.createElement('div');
  pricing.className = 'cart-drawer__item-pricing';

  const total = document.createElement('span');
  total.className = 'cart-drawer__item-total';
  total.textContent = formatPrice(lineTotal);

  const unitPrice = document.createElement('span');
  unitPrice.className = 'cart-drawer__item-unit';
  const isPack = item.tipoVenta === 'pack';
  const isKg = item.tipoVenta === 'kg';
  if (isKg) {
    unitPrice.textContent = `a ${formatPrice(item.price)}/kg`;
  } else if (isPack) {
    unitPrice.textContent = `a ${formatPrice(item.price)} c/u`;
  } else {
    unitPrice.textContent = `a ${formatPrice(item.price)} c/u`;
  }

  pricing.append(total, unitPrice);

  const footer = document.createElement('div');
  footer.className = 'cart-drawer__item-footer';
  footer.append(controls, pricing);

  div.append(name, weightDetail, footer);
  return div;
}

export function clearItemElements(container: HTMLElement): void {
  container.querySelectorAll('.cart-drawer__item').forEach((el) => el.remove());
}
