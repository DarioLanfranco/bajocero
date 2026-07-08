import { cartStore } from '../store/cart';
import { formatPrice } from '../utils/format';

export interface CartStickyBarConfig {
  barId: string;
  countId: string;
  totalId: string;
  btnSelector: string;
}

export interface CartStickyBarAPI {
  update(): void;
  destroy(): void;
}

export function createCartStickyBar(config: CartStickyBarConfig): CartStickyBarAPI {
  const bar = document.getElementById(config.barId);
  const countEl = document.getElementById(config.countId);
  const totalEl = document.getElementById(config.totalId);
  const btn = bar?.querySelector<HTMLButtonElement>(config.btnSelector);

  if (!bar || !countEl || !totalEl || !btn) {
    return { update() {}, destroy() {} };
  }

  function update(): void {
    const items = cartStore.items;
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    countEl!.textContent = `(${totalItems})`;
    totalEl!.textContent = `— ${formatPrice(totalPrice)}`;
    bar!.classList.toggle('visible', totalItems > 0);
  }

  const unsubscribeStore = cartStore.subscribe(update);
  const handleClick = () => {
    import('./cartDrawer').then((m) => m.openCartDrawer()).catch(() => {});
  };
  btn.addEventListener('click', handleClick);

  update();

  return {
    update,
    destroy() {
      unsubscribeStore();
      btn.removeEventListener('click', handleClick);
    },
  };
}