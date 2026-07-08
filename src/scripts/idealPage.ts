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

export function initIdealPage(products: Product[]): void {
  const state: FilterState = {
    budget: null,
    comensales: null,
    intention: 'variado',
  };

  const resultEl = document.getElementById('resultado-combo')!;
  const submitBtn = document.getElementById('ideal-submit')!;
  const okTemplate = document.getElementById('ideal-result-ok') as HTMLTemplateElement;
  const emptyTemplate = document.getElementById('ideal-result-empty') as HTMLTemplateElement;
  const itemTemplate = document.getElementById('ideal-result-item') as HTMLTemplateElement;
  const loadingTemplate = document.getElementById('ideal-loading') as HTMLTemplateElement;

  const pills = document.querySelectorAll<HTMLButtonElement>('.ideal__pill');
  const inputs = document.querySelectorAll<HTMLInputElement>('.ideal__input');

  pills.forEach((pill) => {
    pill.addEventListener('click', () => {
      const group = pill.closest('.ideal__filter-group') as HTMLElement | null;
      if (!group) return;

      const filter = group.dataset.filter!;
      const value = pill.dataset.value!;
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
      const group = input.closest('.ideal__filter-group') as HTMLElement | null;
      if (!group) return;

      const filter = group.dataset.filter!;
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

  function buildItemsHTML(items: IdealResult['items']): DocumentFragment {
    const frag = document.createDocumentFragment();
    for (const item of items) {
      const clone = itemTemplate.content.cloneNode(true) as DocumentFragment;
      const el = clone.firstElementChild as HTMLElement;
      (el.querySelector('[data-part="name"]') as HTMLElement).textContent = item.product.name;
      (el.querySelector('[data-part="detail"]') as HTMLElement).textContent = formatWeight(
        item.quantity,
        item.product.presentacion,
      );
      (el.querySelector('[data-part="price"]') as HTMLElement).textContent = formatPrice(
        item.product.price * item.quantity,
      );
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

  function showLoading(): void {
    submitBtn.textContent = 'Cocinando...';
    submitBtn.disabled = true;
    resultEl.replaceChildren();
    const loadingClone = loadingTemplate.content.cloneNode(true);
    resultEl.appendChild(loadingClone);
  }

  function hideLoading(): void {
    submitBtn.textContent = 'Armar Pedido Ideal';
    submitBtn.disabled = false;
  }

  function renderResult(): void {
    const intentGroup = document.querySelector<HTMLElement>('[data-filter="intention"]');
    if (intentGroup) {
      intentGroup.querySelectorAll('.ideal__pill').forEach((p) => {
        p.classList.toggle('ideal__pill--active', p.dataset.value === state.intention);
      });
    }

    const result = calcularComboIdeal({
      products,
      budget: state.budget,
      comensales: state.comensales,
      intention: state.intention,
    });

    resultEl.replaceChildren();

    if (!result || result.items.length === 0) {
      const emptyClone = emptyTemplate.content.cloneNode(true);
      resultEl.appendChild(emptyClone);
      return;
    }

    const clone = okTemplate.content.cloneNode(true) as DocumentFragment;
    const comboEl = clone.firstElementChild as HTMLElement;

    (comboEl.querySelector('[data-part="items"]') as HTMLElement).appendChild(buildItemsHTML(result.items));
    (comboEl.querySelector('[data-part="total"]') as HTMLElement).textContent = formatPrice(result.total);

    const remainingEl = comboEl.querySelector('[data-part="remaining"]') as HTMLElement;
    if (result.budgetRemaining !== null && result.budgetRemaining > 0) {
      remainingEl.textContent = `Te sobran ${formatPrice(result.budgetRemaining)} de tu presupuesto`;
      remainingEl.classList.remove('ideal__combo-remaining--hidden');
    } else {
      remainingEl.classList.add('ideal__combo-remaining--hidden');
    }

    const addBtn = comboEl.querySelector('[data-part="add-btn"]') as HTMLButtonElement;
    const quantityLabel = state.comensales !== null ? `para ${state.comensales}` : '';
    addBtn.textContent = `Agregar Combo al Carrito ${quantityLabel}`;

    addBtn.addEventListener('click', () => {
      addComboToCart(result.items);
      addBtn.textContent = 'Combo agregado';
      addBtn.disabled = true;
      addBtn.classList.add('ideal__combo-btn--done');
    });

    resultEl.appendChild(clone);

    requestAnimationFrame(() => {
      comboEl.classList.add('ideal__combo--visible');
    });
  }

  submitBtn.addEventListener('click', () => {
    showLoading();
    requestAnimationFrame(() => {
      renderResult();
      hideLoading();
    });
  });
}
