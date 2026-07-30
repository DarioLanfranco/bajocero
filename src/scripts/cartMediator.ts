import { cartStore, type CartEvent } from '../store/cart';
import { showProductAdded, showQuantityUpdated, showProductRemoved, showCartCleared } from './toast';
import { log } from '../utils/logger';

type CartUpdateFn = () => void;

let mediatorInstance: CartMediator | null = null;
const updateFns = new Set<CartUpdateFn>();

function handleCartEvent(event: CartEvent): void {
  if (event.type === null) return;
  try {
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
  } catch (err) {
    log('cartMediator', 'error', 'toast notification failed', err);
  }
  updateFns.forEach((fn) => fn());
}

export interface CartMediator {
  onUpdate(fn: CartUpdateFn): () => void;
}

export function getCartMediator(): CartMediator {
  if (!mediatorInstance) {
    cartStore.subscribe(handleCartEvent);
    mediatorInstance = {
      onUpdate(fn: CartUpdateFn): () => void {
        updateFns.add(fn);
        return () => { updateFns.delete(fn); };
      },
    };
  }
  return mediatorInstance;
}
