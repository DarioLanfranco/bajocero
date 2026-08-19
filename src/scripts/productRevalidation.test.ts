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
  category: 'AL FUEGO',
  isAvailable: true,
  tipoVenta: 'unidad',
};

function renderCatalog(): void {
  document.body.innerHTML = `
    <script type="application/json" id="catalog-data"></script>
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

  const catalogData = document.getElementById('catalog-data');
  expect(catalogData?.textContent).toContain('9999');

  const priceEl = document.querySelector<HTMLElement>('.product-card__price');
  expect(priceEl?.textContent).toBe('$9.999');

  expect(mockedRevalidateProducts).toHaveBeenCalledWith();

  expect(listener).toHaveBeenCalledTimes(1);
});

it('revalidates without force when the tab returns to the foreground', () => {
  mockedGetCachedProducts.mockReturnValue(null);
  mockedRevalidateProducts.mockResolvedValue([]);

  initProductRevalidation();
  expect(mockedRevalidateProducts).toHaveBeenCalledWith();

  mockedRevalidateProducts.mockClear();
  document.dispatchEvent(new Event('visibilitychange'));
  window.dispatchEvent(new Event('focus'));

  expect(mockedRevalidateProducts).toHaveBeenCalledWith();
});

it('applies cached products synchronously on init', () => {
  mockedGetCachedProducts.mockReturnValue([mockProduct]);
  mockedRevalidateProducts.mockResolvedValue([]);

  initProductRevalidation();

  const catalogData = document.getElementById('catalog-data');
  expect(catalogData?.textContent).toContain('9999');

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

  const catalogData = document.getElementById('catalog-data');
  expect(catalogData?.textContent).toBe('');

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

  const catalogData = document.getElementById('catalog-data');
  expect(catalogData?.textContent).toBe('');
});
