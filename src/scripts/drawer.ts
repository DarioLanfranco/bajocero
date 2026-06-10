export interface DrawerConfig {
  drawerId: string;
  overlayId: string;
  panelId: string;
  hamburgerId: string;
  closeId: string;
  linkSelector: string;
}

export interface DrawerAPI {
  isOpen(): boolean;
  open(): void;
  close(): void;
  toggle(): void;
  destroy(): void;
}

export function createDrawer(config: DrawerConfig): DrawerAPI {
  const drawer = document.getElementById(config.drawerId)!;
  const overlay = document.getElementById(config.overlayId)!;
  const panel = document.getElementById(config.panelId)!;
  const hamburgerBtn = document.getElementById(config.hamburgerId) as HTMLButtonElement | null;
  const closeBtn = document.getElementById(config.closeId)!;
  const linkEls = drawer.querySelectorAll<HTMLAnchorElement>(config.linkSelector);

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
    _isOpen = true;
    drawer.classList.remove('invisible', 'pointer-events-none');
    requestAnimationFrame(() => {
      overlay.classList.remove('opacity-0', 'pointer-events-none');
      overlay.classList.add('opacity-100', 'pointer-events-auto');
      panel.classList.remove('translate-x-full');
    });
    document.documentElement.setAttribute('data-drawer-open', 'true');
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.top = '0';
    document.body.style.left = '0';
    if (hamburgerBtn) {
      hamburgerBtn.setAttribute('aria-expanded', 'true');
      hamburgerBtn.setAttribute('aria-label', 'Cerrar menú de navegación');
    }
    const focusable = getFocusableElements();
    if (focusable.length > 0) focusable[0].focus();
    document.addEventListener('keydown', handleKeydown);
  }

  function close(): void {
    _isOpen = false;
    overlay.classList.remove('opacity-100', 'pointer-events-auto');
    overlay.classList.add('opacity-0', 'pointer-events-none');
    panel.classList.add('translate-x-full');
    document.documentElement.removeAttribute('data-drawer-open');
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.top = '';
    document.body.style.left = '';
    if (hamburgerBtn) {
      hamburgerBtn.setAttribute('aria-expanded', 'false');
      hamburgerBtn.setAttribute('aria-label', 'Abrir menú de navegación');
    }
    document.removeEventListener('keydown', handleKeydown);
    setTimeout(() => {
      drawer.classList.add('invisible', 'pointer-events-none');
    }, 300);
  }

  function toggle(): void {
    if (_isOpen) close();
    else open();
  }

  hamburgerBtn?.addEventListener('click', toggle);
  closeBtn.addEventListener('click', () => {
    close();
    hamburgerBtn?.focus();
  });
  overlay.addEventListener('click', () => {
    close();
    hamburgerBtn?.focus();
  });
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
