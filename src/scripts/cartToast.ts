import { cartStore } from '../store/cart';
import type { CartEvent } from '../store/cart';
import { showProductAdded, showQuantityUpdated, showProductRemoved, showCartCleared } from './toast';

export function initCartToast(): () => void {
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
}
