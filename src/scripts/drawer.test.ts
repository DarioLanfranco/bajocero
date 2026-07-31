// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createDrawer, type DrawerConfig } from './drawer';

const CONFIG: DrawerConfig = {
  drawerId: 'site-drawer',
  overlayId: 'drawer-overlay',
  panelId: 'drawer-panel',
  closeId: 'drawer-close',
  hamburgerId: 'hamburger',
  linkSelector: 'a[href]',
};

function setupDrawerDom(): void {
  document.body.innerHTML = `
    <div id="site-drawer">
      <div id="drawer-overlay"></div>
      <div id="drawer-panel">
        <button id="drawer-close">Cerrar</button>
        <a href="#seccion">Enlace 1</a>
        <a href="#otra">Enlace 2</a>
      </div>
    </div>
    <button id="hamburger" aria-expanded="false">Menú</button>
  `;
}

beforeEach(() => {
  setupDrawerDom();
});

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('createDrawer', () => {
  it('returns a noop API when required elements are missing', () => {
    const drawer = createDrawer({ ...CONFIG, drawerId: 'missing-drawer' });
    expect(drawer.isOpen()).toBe(false);
    expect(() => drawer.open()).not.toThrow();
    expect(() => drawer.close()).not.toThrow();
    expect(() => drawer.toggle()).not.toThrow();
  });

  it('opens the drawer, moves focus and updates a11y attributes', () => {
    const drawer = createDrawer(CONFIG);
    expect(drawer.isOpen()).toBe(false);

    drawer.open();

    expect(drawer.isOpen()).toBe(true);
    expect(document.getElementById('site-drawer')!.classList.contains('drawer--open')).toBe(true);
    expect(document.documentElement.classList.contains('drawer-open')).toBe(true);

    const hamburger = document.getElementById('hamburger')!;
    expect(hamburger.getAttribute('aria-expanded')).toBe('true');
    expect(hamburger.getAttribute('aria-label')).toBe('Cerrar menú de navegación');

    expect(document.activeElement).toBe(document.getElementById('drawer-close'));
  });

  it('closes the drawer and restores a11y state', () => {
    const drawer = createDrawer(CONFIG);
    drawer.open();
    drawer.close();

    expect(drawer.isOpen()).toBe(false);
    expect(document.getElementById('site-drawer')!.classList.contains('drawer--open')).toBe(false);
    expect(document.documentElement.classList.contains('drawer-open')).toBe(false);

    const hamburger = document.getElementById('hamburger')!;
    expect(hamburger.getAttribute('aria-expanded')).toBe('false');
    expect(hamburger.getAttribute('aria-label')).toBe('Abrir menú de navegación');
  });

  it('toggles: open when closed, close when open', () => {
    const drawer = createDrawer(CONFIG);

    drawer.toggle();
    expect(drawer.isOpen()).toBe(true);

    drawer.toggle();
    expect(drawer.isOpen()).toBe(false);
  });

  it('destroy removes the hamburger click listener', () => {
    const hamburger = document.getElementById('hamburger')!;
    const removeSpy = vi.spyOn(hamburger, 'removeEventListener');

    const drawer = createDrawer(CONFIG);
    drawer.destroy();

    expect(removeSpy).toHaveBeenCalledWith('click', expect.any(Function));
  });
});
