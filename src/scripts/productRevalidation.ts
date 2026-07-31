import type { Product } from '../types/Product';
import { getCachedProducts, revalidateProducts } from '../data/csvProducts';
import { formatPrice } from '../utils/format';
import { log } from '../utils/logger';

export const PRODUCTS_UPDATED_EVENT = 'bajocero:products-updated';

const PRODUCT_DATA_SOURCE_IDS = ['pdf-products-data', 'ideal-data'];

function syncProductDataSources(products: Product[]): boolean {
  let changed = false;
  const serialized = JSON.stringify(products);
  for (const id of PRODUCT_DATA_SOURCE_IDS) {
    const el = document.getElementById(id);
    if (!el) continue;
    if (el.getAttribute('data-products') !== serialized) {
      el.setAttribute('data-products', serialized);
      changed = true;
    }
  }
  return changed;
}

function applyProducts(products: Product[]): void {
  let changed = syncProductDataSources(products);
  const byId = new Map(products.map((p) => [p.id, p]));

  const cards = document.querySelectorAll<HTMLElement>('[data-product-id]');
  for (const card of cards) {
    const id = card.getAttribute('data-product-id');
    if (!id) continue;
    const fresh = byId.get(id);
    if (!fresh) continue;

    if (Number(card.getAttribute('data-product-price')) !== fresh.price) {
      card.setAttribute('data-product-price', String(fresh.price));
      changed = true;
    }

    const priceEl = card.querySelector<HTMLElement>('.product-card__price');
    if (priceEl) {
      const label = fresh.price > 0 ? formatPrice(fresh.price) : 'Consultar';
      if (priceEl.textContent !== label) {
        priceEl.textContent = label;
        changed = true;
      }
    }

    const currentAvailable = card.getAttribute('data-product-available') !== 'false';
    if (currentAvailable !== fresh.isAvailable) {
      card.setAttribute('data-product-available', String(fresh.isAvailable));
      changed = true;
    }
  }

  if (changed) {
    window.dispatchEvent(new CustomEvent(PRODUCTS_UPDATED_EVENT, { detail: products }));
  }
}

let cleanupFn: (() => void) | null = null;

export function initProductRevalidation(): () => void {
  try {
    if (cleanupFn) cleanupFn();

    const cached = getCachedProducts();
    if (cached && cached.length > 0) {
      applyProducts(cached);
    }

    let cancelled = false;

    revalidateProducts()
      .then((fresh) => {
        if (!cancelled && fresh && fresh.length > 0) {
          applyProducts(fresh);
        }
      })
      .catch((err) => {
        log('productRevalidation', 'error', 'revalidation failed', err);
      });

    cleanupFn = () => {
      cancelled = true;
    };

    return cleanupFn;
  } catch (err) {
    log('productRevalidation', 'error', 'init failed', err);
    cleanupFn = null;
    return () => {};
  }
}
