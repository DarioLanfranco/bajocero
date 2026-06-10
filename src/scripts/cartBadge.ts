import { cartStore } from '../store/cart';

export interface CartBadgeConfig {
  cartBtnId: string;
  cartBadgeId: string;
}

export interface CartBadgeAPI {
  update(): void;
  destroy(): void;
}

export function createCartBadge(config: CartBadgeConfig): CartBadgeAPI {
  const cartBtn = document.getElementById(config.cartBtnId)!;
  const cartBadge = document.getElementById(config.cartBadgeId)!;

  function update(): void {
    const items = cartStore.items;
    let count = 0;
    for (let i = 0; i < items.length; i++) {
      count += items[i].quantity;
    }
    if (count > 0) {
      cartBadge.textContent = String(count);
      cartBadge.classList.remove('hidden');
      cartBadge.classList.add('flex');
    } else {
      cartBadge.classList.add('hidden');
      cartBadge.classList.remove('flex');
    }
    const label = 'Carrito de compras' + (count > 0 ? ', ' + count + ' artículos' : ', vacío');
    cartBtn.setAttribute('aria-label', label);
  }

  const unsubscribe = cartStore.subscribe(update);
  update();

  return {
    update,
    destroy() {
      unsubscribe();
    },
  };
}
