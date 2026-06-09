import { drawerStore, closeDrawer } from '../store/drawer';

(function () {
  const drawer = document.getElementById('mobile-drawer')!;
  const overlay = document.getElementById('drawer-overlay')!;
  const closeBtn = document.getElementById('drawer-close-btn')!;

  const links = drawer.querySelectorAll('.drawer__link');
  let focusableElements: NodeListOf<HTMLElement> | null = null;
  let firstFocusable: HTMLElement | null = null;
  let lastFocusable: HTMLElement | null = null;

  function updateFocusable(): void {
    focusableElements = drawer.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    firstFocusable = focusableElements[0] ?? null;
    lastFocusable = focusableElements[focusableElements.length - 1] ?? null;
  }

  function open(): void {
    drawer.classList.add('is-open');
    document.body.classList.add('drawer-open');
    updateFocusable();
    firstFocusable?.focus();
    document.addEventListener('keydown', handleKeydown);
  }

  function close(): void {
    drawer.classList.remove('is-open');
    document.body.classList.remove('drawer-open');
    document.removeEventListener('keydown', handleKeydown);
  }

  function handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      closeDrawer();
      return;
    }

    if (e.key === 'Tab') {
      if (!focusableElements || focusableElements.length === 0) return;

      updateFocusable();
      if (!firstFocusable || !lastFocusable) return;

      if (e.shiftKey && document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      } else if (!e.shiftKey && document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }
  }

  drawerStore.subscribe((isOpen) => {
    if (isOpen) {
      open();
    } else {
      close();
    }
  });

  overlay.addEventListener('click', closeDrawer);
  closeBtn.addEventListener('click', closeDrawer);

  for (let i = 0; i < links.length; i++) {
    links[i].addEventListener('click', closeDrawer);
  }
})();
