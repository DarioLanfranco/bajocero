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
  const cartBtn = document.getElementById(config.cartBtnId);
  const cartBadge = document.getElementById(config.cartBadgeId);
  const cartLabel = document.querySelector<HTMLElement>(config.cartLabelSelector);

  if (!cartBtn || !cartBadge || !cartLabel) {
    return { update() {}, destroy() {} };
  }

  function update(): void {
    const count = cartStore.items.reduce((sum, item) => sum + item.quantity, 0);

    if (count > 0) {
      cartLabel!.textContent = `Ver carrito (${count})`;
      cartBadge!.textContent = String(count);
      cartBadge!.classList.add('visible');
      cartBadge!.animate(
        [
          { transform: 'scale(1)' },
          { transform: 'scale(1.3)', offset: 0.4 },
          { transform: 'scale(0.92)', offset: 0.7 },
          { transform: 'scale(1)' },
        ],
        {
          duration: 250,
          easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        }
      );
    } else {
      cartLabel!.textContent = 'Ver carrito';
      cartBadge!.textContent = '0';
      cartBadge!.classList.remove('visible');
    }

    const label = count > 0 ? `Ver carrito de compras, ${count} artículos` : 'Ver carrito de compras, vacío';
    cartBtn!.setAttribute('aria-label', label);
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
