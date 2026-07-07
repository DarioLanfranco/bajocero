import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { initCatalogSearch } from './catalogSearch';

function createCatalogFixture(): HTMLElement {
  document.body.innerHTML = `
    <div id="catalog-page">
      <input type="text" data-catalog-role="search-input" />
      <span data-catalog-role="count">0</span>
      <div data-catalog-role="grid">
        <article class="product-card" data-product-name="Milanesa de pollo" data-product-id="1">
          <p class="product-card__description">Pechuga de pollo empanizada</p>
        </article>
        <article class="product-card" data-product-name="Milanesa de ternera" data-product-id="2">
          <p class="product-card__description">Carne vacuna empanizada</p>
        </article>
        <article class="product-card" data-product-name="Papa frita congelada" data-product-id="3">
          <p class="product-card__description">Papas precocidas congeladas</p>
        </article>
      </div>
      <div data-catalog-role="empty" class="hidden">
        <button data-catalog-role="clear-btn">Limpiar búsqueda</button>
      </div>
      <button data-catalog-role="load-more" class="hidden">Cargar más</button>
    </div>
  `;
  return document.getElementById('catalog-page')!;
}

describe('initCatalogSearch', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows all cards by default with pageSize limit', () => {
    const root = createCatalogFixture();
    initCatalogSearch('catalog-page', 10);

    const visible = root.querySelectorAll('.product-card:not(.is-hidden)');
    expect(visible.length).toBe(3);
    const count = root.querySelector('[data-catalog-role="count"]');
    expect(count?.textContent).toBe('3');
  });

  it('filters cards by search query', () => {
    const root = createCatalogFixture();
    initCatalogSearch('catalog-page', 10);

    const input = root.querySelector<HTMLInputElement>('[data-catalog-role="search-input"]')!;
    input.value = 'milanesa';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    vi.advanceTimersByTime(200);

    const visible = root.querySelectorAll('.product-card:not(.is-hidden)');
    expect(visible.length).toBe(2);
    const count = root.querySelector('[data-catalog-role="count"]');
    expect(count?.textContent).toBe('2');
  });

  it('shows empty state when no cards match', () => {
    const root = createCatalogFixture();
    initCatalogSearch('catalog-page', 10);

    const input = root.querySelector<HTMLInputElement>('[data-catalog-role="search-input"]')!;
    input.value = 'zzzzz';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    vi.advanceTimersByTime(200);

    const empty = root.querySelector('[data-catalog-role="empty"]');
    expect(empty?.classList.contains('hidden')).toBe(false);
    const count = root.querySelector('[data-catalog-role="count"]');
    expect(count?.textContent).toBe('0');
  });

  it('clear button restores all cards', () => {
    const root = createCatalogFixture();
    initCatalogSearch('catalog-page', 10);

    const input = root.querySelector<HTMLInputElement>('[data-catalog-role="search-input"]')!;
    input.value = 'milanesa';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    vi.advanceTimersByTime(200);

    const clearBtn = root.querySelector<HTMLButtonElement>('[data-catalog-role="clear-btn"]')!;
    clearBtn.click();

    const visible = root.querySelectorAll('.product-card:not(.is-hidden)');
    expect(visible.length).toBe(3);
  });
});
