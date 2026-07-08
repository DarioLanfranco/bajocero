import { cartStore } from '../store/cart';
import type { CartEvent } from '../store/cart';
import { showProductAdded, showQuantityUpdated, showProductRemoved, showCartCleared } from './toast';
import { log } from '../utils/logger';

export function initCartToast(): () => void {
  try {
    const unsub = cartStore.subscribe((event: CartEvent) => {
      switch (event.type) {
        case 'item:added':
          showProductAdded(event.data.name ?? '');
          break;
        case 'item:quantity-updated':
          showQuantityUpdated(event.data.name ?? '', event.data.quantity ?? 0);
          break;
        case 'item:removed':
          showProductRemoved(event.data.name ?? '');
          break;
        case 'cart:cleared':
          showCartCleared();
          break;
      }
    });

    return () => {
      unsub();
    };
  } catch (err) {
    log('cartToast', 'error', 'init failed', err);
    return () => {};
  }
}
