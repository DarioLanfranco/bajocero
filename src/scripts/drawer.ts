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

function createNoopAPI(): DrawerAPI {
  return {
    isOpen: () => false,
    open: () => {},
    close: () => {},
    toggle: () => {},
    destroy: () => {},
  };
}

export function createDrawer(config: DrawerConfig): DrawerAPI {
  const drawer = document.getElementById(config.drawerId);
  if (!drawer) {
    console.error(`[drawer] Element #${config.drawerId} not found`);
    return createNoopAPI();
  }

  const overlay = document.getElementById(config.overlayId);
  const panel = document.getElementById(config.panelId);
  const closeBtn = document.getElementById(config.closeId);
  const hamburgerBtn = config.hamburgerId ? document.getElementById(config.hamburgerId) as HTMLButtonElement | null : null;
  const linkEls = config.linkSelector ? drawer.querySelectorAll<HTMLAnchorElement>(config.linkSelector) : [];

  if (!overlay) {
    console.error(`[drawer] Overlay #${config.overlayId} not found`);
    return createNoopAPI();
  }
  if (!panel) {
    console.error(`[drawer] Panel #${config.panelId} not found`);
    return createNoopAPI();
  }
  if (!closeBtn) {
    console.error(`[drawer] Close button #${config.closeId} not found`);
    return createNoopAPI();
  }

  console.log(`[drawer] Initialized: ${config.drawerId}`);

  let _isOpen = false;

  function getFocusableElements(): HTMLElement[] {
    const all = drawer.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    return Array.from(all).filter((el) => el.offsetParent !== null || el === closeBtn);
  }

  function handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      hamburgerBtn?.focus();
      return;
    }
    if (e.key === 'Tab') {
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
  }

  function open(): void {
    if (_isOpen) return;
    _isOpen = true;
    console.log(`[drawer] Open: ${config.drawerId}`);

    drawer.classList.add('drawer--open');
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
    if (!_isOpen) return;
    _isOpen = false;
    console.log(`[drawer] Close: ${config.drawerId}`);

    drawer.classList.remove('drawer--open');
    document.documentElement.classList.remove('drawer-open');

    if (hamburgerBtn) {
      document.documentElement.removeAttribute('data-drawer-open');
      hamburgerBtn.setAttribute('aria-expanded', 'false');
      hamburgerBtn.setAttribute('aria-label', 'Abrir menú de navegación');
    }

    document.removeEventListener('keydown', handleKeydown);
  }

  function toggle(): void {
    console.log(`[drawer] Toggle: ${config.drawerId}`);
    if (_isOpen) close();
    else open();
  }

  closeBtn.addEventListener('click', () => {
    close();
    hamburgerBtn?.focus();
  });

  overlay.addEventListener('click', () => {
    close();
    hamburgerBtn?.focus();
  });

  hamburgerBtn?.addEventListener('click', toggle);
  linkEls.forEach((link) => link.addEventListener('click', close));

  return {
    isOpen: () => _isOpen,
    open,
    close,
    toggle,
    destroy() {
      hamburgerBtn?.removeEventListener('click', toggle);
      document.removeEventListener('keydown', handleKeydown);
      linkEls.forEach((link) => link.removeEventListener('click', close));
    },
  };
}
