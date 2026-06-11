import { cartStore } from '../store/cart';
import type { CartEventData } from '../store/cart';
import { showProductAdded, showQuantityUpdated, showProductRemoved, showCartCleared } from './toast';

export function initCartToast(): () => void {
  const unsub1 = cartStore.on('item:added', (data: CartEventData) => {
    showProductAdded(data.name ?? '');
  });

  const unsub2 = cartStore.on('item:quantity-updated', (data: CartEventData) => {
    showQuantityUpdated(data.name ?? '', data.quantity ?? 0);
  });

  const unsub3 = cartStore.on('item:removed', (data: CartEventData) => {
    showProductRemoved(data.name ?? '');
  });

  const unsub4 = cartStore.on('cart:cleared', () => {
    showCartCleared();
  });

  return () => {
    unsub1();
    unsub2();
    unsub3();
    unsub4();
  };
}
