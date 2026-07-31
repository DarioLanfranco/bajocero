// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Product } from '../types/Product';
import {
  initProductRevalidation,
  PRODUCTS_UPDATED_EVENT,
} from './productRevalidation';
import { getCachedProducts, revalidateProducts } from '../data/csvProducts';

vi.mock('../data/csvProducts', () => ({
  getCachedProducts: vi.fn(),
  revalidateProducts: vi.fn(),
}));

const mockedGetCachedProducts = vi.mocked(getCachedProducts);
const mockedRevalidateProducts = vi.mocked(revalidateProducts);

const mockProduct: Product = {
  id: '1',
  name: 'Milanesa de pollo',
  price: 9999,
  category: 'PRODUCTOS',
  isAvailable: true,
  tipoVenta: 'unidad',
};

function renderCatalog(): void {
  document.body.innerHTML = `
    <div id="pdf-products-data" data-products="[]"></div>
    <div id="ideal-data" data-products="[]"></div>
    <div class="product-card" data-product-id="1" data-product-price="1000" data-product-available="true">
      <span class="product-card__price">$1.000</span>
    </div>
  `;
}

beforeEach(() => {
  localStorage.clear();
  renderCatalog();
});

afterEach(() => {
  vi.clearAllMocks();
});

it('applies revalidated products, updates DOM and dispatches event', async () => {
  mockedGetCachedProducts.mockReturnValue(null);
  mockedRevalidateProducts.mockResolvedValue([mockProduct]);

  const listener = vi.fn();
  window.addEventListener(PRODUCTS_UPDATED_EVENT, listener);

  initProductRevalidation();
  await new Promise((resolve) => setTimeout(resolve, 0));

  const ideal = document.getElementById('ideal-data');
  expect(ideal?.getAttribute('data-products')).toContain('9999');

  const priceEl = document.querySelector<HTMLElement>('.product-card__price');
  expect(priceEl?.textContent).toBe('$9.999');

  expect(listener).toHaveBeenCalledTimes(1);
});

it('applies cached products synchronously on init', () => {
  mockedGetCachedProducts.mockReturnValue([mockProduct]);
  mockedRevalidateProducts.mockResolvedValue([]);

  initProductRevalidation();

  const ideal = document.getElementById('ideal-data');
  expect(ideal?.getAttribute('data-products')).toContain('9999');

  const priceEl = document.querySelector<HTMLElement>('.product-card__price');
  expect(priceEl?.textContent).toBe('$9.999');
});

it('keeps previous DOM state when revalidation fails', async () => {
  mockedGetCachedProducts.mockReturnValue(null);
  mockedRevalidateProducts.mockRejectedValue(new TypeError('Network Error'));

  const listener = vi.fn();
  window.addEventListener(PRODUCTS_UPDATED_EVENT, listener);

  expect(() => initProductRevalidation()).not.toThrow();
  await new Promise((resolve) => setTimeout(resolve, 0));

  const ideal = document.getElementById('ideal-data');
  expect(ideal?.getAttribute('data-products')).toBe('[]');

  const priceEl = document.querySelector<HTMLElement>('.product-card__price');
  expect(priceEl?.textContent).toBe('$1.000');

  expect(listener).not.toHaveBeenCalled();
});

it('returns a cleanup function that cancels pending updates', async () => {
  mockedGetCachedProducts.mockReturnValue(null);
  mockedRevalidateProducts.mockResolvedValue([mockProduct]);

  const cleanup = initProductRevalidation();
  cleanup();
  await new Promise((resolve) => setTimeout(resolve, 0));

  const ideal = document.getElementById('ideal-data');
  expect(ideal?.getAttribute('data-products')).toBe('[]');
});
