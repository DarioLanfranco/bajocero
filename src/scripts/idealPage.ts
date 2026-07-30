import { cartStore } from '../store/cart';
import { calcularComboIdeal } from '../utils/idealEngine';
import { formatPrice, formatWeight } from '../utils/format';
import type { IdealResult } from '../utils/idealEngine';
import type { Product } from '../types/Product';

interface FilterState {
  budget: number | null;
  comensales: number | null;
  intention: string;
}

interface PageElements {
  result: HTMLElement;
  submit: HTMLButtonElement;
  okTemplate: HTMLTemplateElement;
  emptyTemplate: HTMLTemplateElement;
  itemTemplate: HTMLTemplateElement;
  loadingTemplate: HTMLTemplateElement;
}

function getElements(): PageElements | null {
  const result = document.getElementById('resultado-combo');
  const submit = document.getElementById('ideal-submit');
  const okTemplate = document.getElementById('ideal-result-ok');
  const emptyTemplate = document.getElementById('ideal-result-empty');
  const itemTemplate = document.getElementById('ideal-result-item');
  const loadingTemplate = document.getElementById('ideal-loading');

  if (
    !(result instanceof HTMLElement) ||
    !(submit instanceof HTMLButtonElement) ||
    !(okTemplate instanceof HTMLTemplateElement) ||
    !(emptyTemplate instanceof HTMLTemplateElement) ||
    !(itemTemplate instanceof HTMLTemplateElement) ||
    !(loadingTemplate instanceof HTMLTemplateElement)
  ) return null;

  return { result, submit, okTemplate, emptyTemplate, itemTemplate, loadingTemplate };
}

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

function buildFilterGroups(
  pills: NodeListOf<HTMLButtonElement>,
  inputs: NodeListOf<HTMLInputElement>,
  state: FilterState,
): void {
  pills.forEach((pill) => {
    pill.addEventListener('click', () => {
      const group = pill.closest('.ideal__filter-group');
      if (!(group instanceof HTMLElement)) return;

      const filter = group.dataset.filter;
      if (!filter) return;
      const value = pill.dataset.value;
      if (value === undefined) return;
      const isAny = pill.classList.contains('ideal__pill--any');

      group.querySelectorAll('.ideal__pill').forEach((p) => p.classList.remove('ideal__pill--active'));

      if (filter !== 'intention') {
        const input = group.querySelector<HTMLInputElement>('.ideal__input');
        if (input) input.value = '';
      }

      if (isAny) {
        if (filter === 'budget') state.budget = null;
        else if (filter === 'comensales') state.comensales = null;
      } else {
        pill.classList.add('ideal__pill--active');
        if (filter === 'budget') state.budget = parseInt(value, 10);
        else if (filter === 'comensales') state.comensales = parseInt(value, 10);
        else if (filter === 'intention') state.intention = value;
      }
    });
  });

  inputs.forEach((input) => {
    input.addEventListener('input', () => {
      const group = input.closest('.ideal__filter-group');
      if (!(group instanceof HTMLElement)) return;

      const filter = group.dataset.filter;
      if (!filter) return;
      const val = input.value.trim();

      group.querySelectorAll('.ideal__pill').forEach((p) => p.classList.remove('ideal__pill--active'));

      if (val === '') {
        if (filter === 'budget') state.budget = null;
        else if (filter === 'comensales') state.comensales = null;
      } else {
        const parsed = parseInt(val, 10);
        if (Number.isFinite(parsed) && parsed > 0) {
          if (filter === 'budget') state.budget = parsed;
          else if (filter === 'comensales') state.comensales = parsed;
        }
      }
    });
  });
}

function showLoading(els: PageElements): void {
  els.submit.textContent = 'Cocinando...';
  els.submit.disabled = true;
  els.result.replaceChildren();
  const loadingClone = els.loadingTemplate.content.cloneNode(true);
  els.result.appendChild(loadingClone);
}

function hideLoading(els: PageElements): void {
  els.submit.textContent = 'Armar Pedido Ideal';
  els.submit.disabled = false;
}

function renderResult(state: FilterState, products: Product[], els: PageElements): void {
  const intentGroup = document.querySelector<HTMLElement>('[data-filter="intention"]');
  if (intentGroup) {
    intentGroup.querySelectorAll('.ideal__pill').forEach((p) => {
      if (p instanceof HTMLElement) {
        p.classList.toggle('ideal__pill--active', p.dataset.value === state.intention);
      }
    });
  }

  const result = calcularComboIdeal({
    products,
    budget: state.budget,
    comensales: state.comensales,
    intention: state.intention,
  });

  els.result.replaceChildren();

  if (!result || result.items.length === 0) {
    const emptyClone = els.emptyTemplate.content.cloneNode(true);
    els.result.appendChild(emptyClone);
    return;
  }

  const clone = els.okTemplate.content.cloneNode(true);
  const comboEl = clone instanceof DocumentFragment ? clone.firstElementChild : null;
  if (!(comboEl instanceof HTMLElement)) return;

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

  const addBtn = comboEl.querySelector('[data-part="add-btn"]');
  if (!(addBtn instanceof HTMLButtonElement)) return;
  const quantityLabel = state.comensales !== null ? `para ${state.comensales}` : '';
  addBtn.textContent = `Agregar Combo al Carrito ${quantityLabel}`;

  addBtn.addEventListener('click', () => {
    addComboToCart(result.items);
    addBtn.textContent = 'Combo agregado';
    addBtn.disabled = true;
    addBtn.classList.add('ideal__combo-btn--done');
  });

  els.result.appendChild(clone);

  requestAnimationFrame(() => {
    comboEl.classList.add('ideal__combo--visible');
  });
}

export function initIdealPage(products: Product[]): void {
  const els = getElements();
  if (!els) return;

  const state: FilterState = {
    budget: null,
    comensales: null,
    intention: 'variado',
  };

  const pills = document.querySelectorAll<HTMLButtonElement>('.ideal__pill');
  const inputs = document.querySelectorAll<HTMLInputElement>('.ideal__input');

  buildFilterGroups(pills, inputs, state);

  els.submit.addEventListener('click', () => {
    showLoading(els);
    requestAnimationFrame(() => {
      renderResult(state, products, els);
      hideLoading(els);
    });
  });
}