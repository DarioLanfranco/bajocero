import { drawerStore, toggleDrawer } from '../store/drawer';
import { cartStore } from '../store/cart';

(function () {
  const actions = document.getElementById('header-actions')!;

  let hamburgerBtn: HTMLButtonElement | null = null;
  let cartBadge: HTMLElement | null = null;

  function updateCartBadge(count: number): void {
    if (!cartBadge) return;
    if (count > 0) {
      cartBadge.textContent = String(count);
      cartBadge.removeAttribute('hidden');
    } else {
      cartBadge.setAttribute('hidden', '');
    }
  }

  function getOrCreateCartBadge(btn: HTMLElement): HTMLElement {
    const existing = btn.querySelector('.header__cart-badge');
    if (existing) return existing as HTMLElement;

    const badge = document.createElement('span');
    badge.className = 'header__cart-badge';
    badge.setAttribute('aria-hidden', 'true');
    badge.setAttribute('hidden', '');
    btn.appendChild(badge);
    return badge;
  }

  function createHamburger(): HTMLButtonElement {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <button class="header__hamburger" type="button" aria-label="Abrir menú de navegación" aria-expanded="false">
        <span class="header__hamburger-line"></span>
        <span class="header__hamburger-line"></span>
        <span class="header__hamburger-line"></span>
      </button>`;
    return wrapper.firstElementChild as HTMLButtonElement;
  }

  function updateHamburger(): void {
    const isMobile = window.innerWidth < 1024;
    const hasButton = hamburgerBtn !== null && hamburgerBtn.isConnected;

    if (isMobile && !hasButton) {
      hamburgerBtn = createHamburger();
      hamburgerBtn.addEventListener('click', toggleDrawer);
      actions.appendChild(hamburgerBtn);

      drawerStore.subscribe((open) => {
        hamburgerBtn?.setAttribute('aria-expanded', String(open));
      });
    } else if (!isMobile && hasButton) {
      hamburgerBtn?.remove();
      hamburgerBtn = null;
    }
  }

  const cartBtn = actions.querySelector('.header__cart-btn');
  if (cartBtn) {
    cartBadge = getOrCreateCartBadge(cartBtn as HTMLElement);

    cartStore.subscribe((items) => {
      const count = items.reduce((sum, i) => sum + i.quantity, 0);
      updateCartBadge(count);
    });
  }

  updateHamburger();

  let resizeTimer: ReturnType<typeof setTimeout> | undefined;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(updateHamburger, 100);
  });
})();
