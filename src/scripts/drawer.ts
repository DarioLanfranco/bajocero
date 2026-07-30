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

import { log } from '../utils/logger';

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

type ResolvedElements = {
  drawer: HTMLElement;
  overlay: HTMLElement;
  panel: HTMLElement;
  closeBtn: HTMLElement;
  hamburgerBtn: HTMLElement | null;
  linkEls: NodeListOf<HTMLAnchorElement>;
};

function resolveDrawerElements(config: DrawerConfig): ResolvedElements | null {
  const drawer = document.getElementById(config.drawerId);
  if (!drawer) {
    log('drawer', 'info', `Element #${config.drawerId} not found`);
    return null;
  }
  const overlay = document.getElementById(config.overlayId);
  const panel = document.getElementById(config.panelId);
  const closeBtn = document.getElementById(config.closeId);
  const hamburgerBtn = config.hamburgerId
    ? document.getElementById(config.hamburgerId)
    : null;
  const linkEls = config.linkSelector
    ? drawer.querySelectorAll<HTMLAnchorElement>(config.linkSelector)
    : ([] as unknown as NodeListOf<HTMLAnchorElement>);

  if (!overlay || !panel || !closeBtn) {
    log('drawer', 'info', 'Missing required drawer elements');
    return null;
  }

  return { drawer, overlay, panel, closeBtn, hamburgerBtn, linkEls };
}

function updateFocusableCache(drawer: HTMLElement, closeBtn: HTMLElement, cache: { value: HTMLElement[] }): void {
  const all = drawer.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  );
  cache.value = Array.from(all).filter((el) => el.offsetWidth !== 0 || el.offsetHeight !== 0 || el === closeBtn);
}

function trapTabFocus(e: KeyboardEvent, cache: { value: HTMLElement[] }): void {
  if (e.key !== 'Tab') return;
  const focusable = cache.value;
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

function setHamburgerAria(hamburgerBtn: HTMLElement | null, expanded: boolean): void {
  if (!hamburgerBtn) return;
  if (expanded) {
    document.documentElement.setAttribute('data-drawer-open', 'true');
    hamburgerBtn.setAttribute('aria-expanded', 'true');
    hamburgerBtn.setAttribute('aria-label', 'Cerrar menú de navegación');
  } else {
    document.documentElement.removeAttribute('data-drawer-open');
    hamburgerBtn.setAttribute('aria-expanded', 'false');
    hamburgerBtn.setAttribute('aria-label', 'Abrir menú de navegación');
  }
}

interface DrawerState {
  isOpen: boolean;
  focusCache: { value: HTMLElement[] };
}

function openDrawer(state: DrawerState, els: ResolvedElements): void {
  if (state.isOpen) return;
  state.isOpen = true;
  els.drawer.classList.add('drawer--open');
  document.documentElement.classList.add('drawer-open');
  setHamburgerAria(els.hamburgerBtn, true);
  updateFocusableCache(els.drawer, els.closeBtn, state.focusCache);
  if (state.focusCache.value.length > 0) state.focusCache.value[0].focus();
}

function closeDrawer(state: DrawerState, els: ResolvedElements): void {
  if (!state.isOpen) return;
  state.isOpen = false;
  els.drawer.classList.remove('drawer--open');
  document.documentElement.classList.remove('drawer-open');
  setHamburgerAria(els.hamburgerBtn, false);
}

function toggleDrawer(state: DrawerState, els: ResolvedElements): void {
  if (state.isOpen) closeDrawer(state, els);
  else openDrawer(state, els);
}

function buildDrawerAPI(els: ResolvedElements, config: DrawerConfig): DrawerAPI {
  log('drawer', 'info', `Initialized: ${config.drawerId}`);

  const state: DrawerState = { isOpen: false, focusCache: { value: [] as HTMLElement[] } };
  const handleKeydown = (e: KeyboardEvent) => trapTabFocus(e, state.focusCache);
  const boundClose = () => closeDrawer(state, els);
  const boundToggle = () => toggleDrawer(state, els);
  const boundCloseAndFocus = () => {
    closeDrawer(state, els);
    els.hamburgerBtn?.focus();
  };

  els.closeBtn.addEventListener('click', boundCloseAndFocus);
  els.overlay.addEventListener('click', boundCloseAndFocus);
  els.hamburgerBtn?.addEventListener('click', boundToggle);
  els.linkEls.forEach((link) => link.addEventListener('click', boundClose));

  return {
    isOpen: () => state.isOpen,
    open: () => { openDrawer(state, els); document.addEventListener('keydown', handleKeydown); },
    close() {
      closeDrawer(state, els);
      document.removeEventListener('keydown', handleKeydown);
    },
    toggle: boundToggle,
    destroy() {
      els.closeBtn.removeEventListener('click', boundCloseAndFocus);
      els.overlay.removeEventListener('click', boundCloseAndFocus);
      if (els.hamburgerBtn) els.hamburgerBtn.removeEventListener('click', boundToggle);
      document.removeEventListener('keydown', handleKeydown);
      els.linkEls.forEach((link) => link.removeEventListener('click', boundClose));
      state.focusCache.value = [];
    },
  };
}

export function createDrawer(config: DrawerConfig): DrawerAPI {
  const els = resolveDrawerElements(config);
  if (!els) return createNoopAPI();
  return buildDrawerAPI(els, config);
}
