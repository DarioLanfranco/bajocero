import { cartStore } from '../store/cart';

export interface CartBadgeConfig {
  cartBtnId: string;
  cartBadgeId: string;
  cartLabelSelector: string;
}

export interface CartBadgeAPI {
  update(): void;
  destroy(): void;
}

export function createCartBadge(config: CartBadgeConfig): CartBadgeAPI {
  const cartBtn = document.getElementById(config.cartBtnId)!;
  const cartBadge = document.getElementById(config.cartBadgeId)!;
  const cartLabel = document.querySelector<HTMLElement>(config.cartLabelSelector)!;

  function update(): void {
    const items = cartStore.items;
    let count = 0;
    for (let i = 0; i < items.length; i++) {
      count += items[i].quantity;
    }

    if (count > 0) {
      cartLabel.textContent = `Ver carrito (${count})`;
      cartBadge.textContent = String(count);
      cartBadge.classList.remove('hidden', 'badge-pop');
      cartBadge.classList.add('flex');
      void cartBadge.offsetWidth;
      cartBadge.classList.add('badge-pop');
    } else {
      cartLabel.textContent = 'Ver carrito';
      cartBadge.classList.add('hidden');
      cartBadge.classList.remove('flex');
    }

    const label = count > 0 ? `Ver carrito de compras, ${count} artículos` : 'Ver carrito de compras, vacío';
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
