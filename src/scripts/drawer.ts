export interface DrawerConfig {
  drawerId: string;
  overlayId: string;
  panelId: string;
  closeId: string;
  hamburgerId?: string;
  linkSelector?: string;
}

export interface DrawerAPI {
  isOpen(): boolean;
  open(): void;
  close(): void;
  toggle(): void;
  destroy(): void;
}

function noop(): void {}

function createNoopAPI(): DrawerAPI {
  return {
    isOpen: () => false,
    open: noop,
    close: noop,
    toggle: noop,
    destroy: noop,
  };
}

function devLog(...args: unknown[]): void {
  if (import.meta.env.DEV) {
    console.log('[drawer]', ...args);
  }
}

export function createDrawer(config: DrawerConfig): DrawerAPI {
  const drawer = document.getElementById(config.drawerId);
  if (!drawer) {
    devLog(`Element #${config.drawerId} not found`);
    return createNoopAPI();
  }

  const overlay = document.getElementById(config.overlayId);
  const panel = document.getElementById(config.panelId);
  const closeBtn = document.getElementById(config.closeId);
  const hamburgerBtn = config.hamburgerId
    ? (document.getElementById(config.hamburgerId) as HTMLButtonElement | null)
    : null;
  const linkEls = config.linkSelector
    ? drawer.querySelectorAll<HTMLAnchorElement>(config.linkSelector)
    : [];

  if (!overlay || !panel || !closeBtn) {
    devLog('Missing required drawer elements');
    return createNoopAPI();
  }

  devLog(`Initialized: ${config.drawerId}`);

  let isOpen = false;

  function getFocusableElements(): HTMLElement[] {
    const all = drawer!.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    return Array.from(all).filter((el) => el.offsetWidth !== 0 || el.offsetHeight !== 0 || el === closeBtn);
  }

  function handleKeydown(e: KeyboardEvent): void {
    if (e.key !== 'Tab') return;

    const focusable = getFocusableElements();
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function open(): void {
    if (isOpen) return;
    isOpen = true;

    drawer!.classList.add('drawer--open');
    document.documentElement.classList.add('drawer-open');

    if (hamburgerBtn) {
      document.documentElement.setAttribute('data-drawer-open', 'true');
      hamburgerBtn.setAttribute('aria-expanded', 'true');
      hamburgerBtn.setAttribute('aria-label', 'Cerrar menú de navegación');
    }

    const focusable = getFocusableElements();
    if (focusable.length > 0) focusable[0].focus();
    document.addEventListener('keydown', handleKeydown);
  }

  function close(): void {
    if (!isOpen) return;
    isOpen = false;

    drawer!.classList.remove('drawer--open');
    document.documentElement.classList.remove('drawer-open');

    if (hamburgerBtn) {
      document.documentElement.removeAttribute('data-drawer-open');
      hamburgerBtn.setAttribute('aria-expanded', 'false');
      hamburgerBtn.setAttribute('aria-label', 'Abrir menú de navegación');
    }

    document.removeEventListener('keydown', handleKeydown);
  }

  function toggle(): void {
    if (isOpen) close();
    else open();
  }

  function closeAndFocusHamburger(): void {
    close();
    hamburgerBtn?.focus();
  }

  closeBtn.addEventListener('click', closeAndFocusHamburger);
  overlay.addEventListener('click', closeAndFocusHamburger);
  hamburgerBtn?.addEventListener('click', toggle);
  linkEls.forEach((link) => link.addEventListener('click', close));

  return {
    isOpen: () => isOpen,
    open,
    close,
    toggle,
    destroy() {
      closeBtn.removeEventListener('click', closeAndFocusHamburger);
      overlay.removeEventListener('click', closeAndFocusHamburger);
      hamburgerBtn?.removeEventListener('click', toggle);
      document.removeEventListener('keydown', handleKeydown);
      linkEls.forEach((link) => link.removeEventListener('click', close));
    },
  };
}
