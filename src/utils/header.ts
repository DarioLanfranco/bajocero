import { drawerStore, toggleDrawer } from '../store/drawer';
import { cartStore } from '../store/cart';

(function () {
  const hamburgerBtn = document.getElementById('hamburger-btn') as HTMLButtonElement | null;
  const cartBadge = document.querySelector('.header__cart-badge') as HTMLElement | null;

  if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', toggleDrawer);

    drawerStore.subscribe((open) => {
      hamburgerBtn.setAttribute('aria-expanded', String(open));
    });
  }

  if (cartBadge) {
    cartStore.subscribe((items) => {
      const count = items.reduce((sum, i) => sum + i.quantity, 0);
      if (count > 0) {
        cartBadge.textContent = String(count);
        cartBadge.classList.add('is-visible');
      } else {
        cartBadge.classList.remove('is-visible');
      }
    });
  }
})();
