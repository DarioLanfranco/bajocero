import type { CartItem } from '../types/cart';
import { formatPrice } from '../utils/format';
import { createMinusIcon, createPlusIcon } from './icons';

export function buildCartItemElement(item: CartItem): HTMLElement {
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

export function clearItemElements(container: HTMLElement): void {
  const existing = container.querySelectorAll('.cart-drawer__item');
  for (let i = 0; i < existing.length; i++) {
    existing[i].remove();
  }
}
