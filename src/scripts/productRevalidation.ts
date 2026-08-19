import type { Product } from '../types/Product';
import { getCachedProducts, revalidateProducts } from '../data/csvProducts';
import { formatPrice } from '../utils/format';
import { log } from '../utils/logger';
import {
  CATALOG_DATA_ELEMENT_ID,
  serializeCatalogJSON,
} from '../utils/catalogSerializer';

export const PRODUCTS_UPDATED_EVENT = 'bajocero:products-updated';

function syncProductDataSources(products: Product[]): boolean {
  const serialized = serializeCatalogJSON(products);
  const el = document.getElementById(CATALOG_DATA_ELEMENT_ID);
  if (!el) return false;
  if (el.textContent !== serialized) {
    el.textContent = serialized;
    return true;
  }
  return false;
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

    const refresh = () => {
      revalidateProducts()
        .then((fresh) => {
          if (!cancelled && fresh && fresh.length > 0) {
            applyProducts(fresh);
          }
        })
        .catch((err) => {
          log('productRevalidation', 'error', 'revalidation failed', err);
        });
    };

    refresh();

    // Revalida cada vez que la pestaña vuelve a primer plano para reflejar
    // actualizaciones de la planilla de forma inmediata.
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);

    cleanupFn = () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };

    return cleanupFn;
  } catch (err) {
    log('productRevalidation', 'error', 'init failed', err);
    cleanupFn = null;
    return () => {};
  }
}
