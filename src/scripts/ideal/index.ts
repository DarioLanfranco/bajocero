import type { Product } from '../../types/Product';
import type { FilterState } from './types';
import { getElements } from './types';
import { buildFilterGroups } from './filters';
import { renderResult, showLoading, hideLoading } from './render';
import { setupResultModal } from './modal';
import { readCatalogFromElement } from '../../utils/catalogSerializer';

function readFreshProducts(fallback: Product[]): Product[] {
  const raw = readCatalogFromElement();
  return raw.length > 0 ? (raw as Product[]) : fallback;
}

export function initIdealPage(products: Product[]): void {
  const els = getElements();
  if (!els) return;

  const state: FilterState = {
    budget: null,
    comensales: null,
    intention: 'variado',
    includePostre: false,
    includeFrutas: false,
  };

  const pills = document.querySelectorAll<HTMLButtonElement>('.ideal__pill');
  const inputs = document.querySelectorAll<HTMLInputElement>('.ideal__input');

  buildFilterGroups(pills, inputs, state);
  setupResultModal(els);

  els.submit.addEventListener('click', () => {
    showLoading(els);
    requestAnimationFrame(() => {
      renderResult(state, readFreshProducts(products), els);
      hideLoading(els);
    });
  });
}
