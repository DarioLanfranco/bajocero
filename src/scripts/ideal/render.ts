import { cartStore } from '../../store/cart';
import { calcularComboIdeal } from '../../utils/idealEngine';
import { formatPrice, formatWeight } from '../../utils/format';
import type { IdealResult } from '../../utils/idealEngine';
import type { Product } from '../../types/Product';
import type { FilterState, PageElements } from './types';

function buildItemsHTML(template: HTMLTemplateElement, items: IdealResult['items']): DocumentFragment {
  const frag = document.createDocumentFragment();
  for (const item of items) {
    const clone = template.content.cloneNode(true);
    const el = clone instanceof DocumentFragment ? clone.firstElementChild : null;
    if (!(el instanceof HTMLElement)) continue;
    const nameEl = el.querySelector('[data-part="name"]');
    if (nameEl) nameEl.textContent = item.product.name;
    const detailEl = el.querySelector('[data-part="detail"]');
    if (detailEl) detailEl.textContent = formatWeight(item.quantity, item.product.presentacion);
    const priceEl = el.querySelector('[data-part="price"]');
    if (priceEl) priceEl.textContent = formatPrice(item.product.price * item.quantity);
    frag.appendChild(el);
  }
  return frag;
}

function addComboToCart(items: IdealResult['items']): void {
  for (const item of items) {
    cartStore.addItem({
      productId: item.product.id,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      presentacion: item.product.presentacion,
    });
  }
}

export function showLoading(els: PageElements): void {
  els.submit.textContent = 'Cocinando...';
  els.submit.disabled = true;
  els.result.replaceChildren();
  const loadingClone = els.loadingTemplate.content.cloneNode(true);
  els.result.appendChild(loadingClone);
}

export function hideLoading(els: PageElements): void {
  els.submit.textContent = 'Armar Pedido Ideal';
  els.submit.disabled = false;
}

export function syncActivePills(state: FilterState): void {
  const intentGroup = document.querySelector<HTMLElement>('[data-filter="intention"]');
  if (!intentGroup) return;
  intentGroup.querySelectorAll('.ideal__pill').forEach((p) => {
    if (p instanceof HTMLElement) {
      p.classList.toggle('ideal__pill--active', p.dataset.value === state.intention);
    }
  });
}

function renderEmptyResult(els: PageElements): void {
  const emptyClone = els.emptyTemplate.content.cloneNode(true);
  els.result.appendChild(emptyClone);
}

function fillComboContent(
  comboEl: HTMLElement,
  result: IdealResult,
  els: PageElements,
): void {
  const itemsContainer = comboEl.querySelector('[data-part="items"]');
  if (itemsContainer) {
    itemsContainer.appendChild(buildItemsHTML(els.itemTemplate, result.items));
  }
  const totalEl = comboEl.querySelector('[data-part="total"]');
  if (totalEl) totalEl.textContent = formatPrice(result.total);

  const remainingEl = comboEl.querySelector('[data-part="remaining"]');
  if (remainingEl instanceof HTMLElement) {
    if (result.budgetRemaining !== null && result.budgetRemaining > 0) {
      remainingEl.textContent = `Te sobran ${formatPrice(result.budgetRemaining)} de tu presupuesto`;
      remainingEl.classList.remove('ideal__combo-remaining--hidden');
    } else {
      remainingEl.classList.add('ideal__combo-remaining--hidden');
    }
  }
}

function setupAddToCartBtn(
  addBtn: HTMLButtonElement,
  result: IdealResult,
  state: FilterState,
): void {
  const quantityLabel = state.comensales !== null ? `para ${state.comensales}` : '';
  addBtn.textContent = `Agregar Combo al Carrito ${quantityLabel}`;
  addBtn.addEventListener('click', () => {
    addComboToCart(result.items);
    addBtn.textContent = 'Combo agregado';
    addBtn.disabled = true;
    addBtn.classList.add('ideal__combo-btn--done');
  });
}

export function renderResult(state: FilterState, products: Product[], els: PageElements): void {
  syncActivePills(state);

  const result = calcularComboIdeal({
    products,
    budget: state.budget,
    comensales: state.comensales,
    intention: state.intention,
  });

  els.result.replaceChildren();

  if (!result || result.items.length === 0) {
    renderEmptyResult(els);
    return;
  }

  const clone = els.okTemplate.content.cloneNode(true);
  const comboEl = clone instanceof DocumentFragment ? clone.firstElementChild : null;
  if (!(comboEl instanceof HTMLElement)) return;

  fillComboContent(comboEl, result, els);

  const addBtn = comboEl.querySelector('[data-part="add-btn"]');
  if (!(addBtn instanceof HTMLButtonElement)) return;
  setupAddToCartBtn(addBtn, result, state);

  els.result.appendChild(clone);

  requestAnimationFrame(() => {
    comboEl.classList.add('ideal__combo--visible');
  });
}
