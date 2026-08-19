// @vitest-environment happy-dom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createModalShell } from './baseModal';

const RAF_WAIT_MS = 30;

function waitForAnimationFrame(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, RAF_WAIT_MS));
}

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('createModalShell cleanup', () => {
  it('removes document keydown listener and overlay click listener on close', () => {
    const controls = createModalShell();
    controls.modal.innerHTML = '<button>Acción</button>';

    const docRemoveSpy = vi.spyOn(document, 'removeEventListener');
    const overlayRemoveSpy = vi.spyOn(controls.overlay, 'removeEventListener');

    controls.close();

    expect(docRemoveSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    expect(overlayRemoveSpy).toHaveBeenCalledWith('click', expect.any(Function));
  });

  it('closes when Escape is pressed and removes listeners', () => {
    createModalShell();

    const docRemoveSpy = vi.spyOn(document, 'removeEventListener');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(docRemoveSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('closes when the overlay is clicked', () => {
    const controls = createModalShell();

    const overlayRemoveSpy = vi.spyOn(controls.overlay, 'removeEventListener');

    controls.overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(overlayRemoveSpy).toHaveBeenCalledWith('click', expect.any(Function));
  });

  it('is idempotent: closing twice does not double-clean', () => {
    const controls = createModalShell();

    const docRemoveSpy = vi.spyOn(document, 'removeEventListener');

    controls.close();
    controls.close();

    expect(docRemoveSpy).toHaveBeenCalledTimes(1);
  });
});

describe('createModalShell focus trap & accessibility', () => {
  it('stores the previously focused element and restores focus on close', async () => {
    const trigger = document.createElement('button');
    trigger.textContent = 'Abrir modal';
    document.body.appendChild(trigger);
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    const controls = createModalShell();
    controls.modal.innerHTML =
      '<button id="first">Primero</button><button id="last">Último</button>';

    await waitForAnimationFrame();

    const first = document.getElementById('first');
    expect(document.activeElement).toBe(first);

    controls.close();
    await waitForAnimationFrame();

    expect(document.activeElement).toBe(trigger);
  });

  it('wraps Tab focus forward and backward within the modal', async () => {
    const controls = createModalShell();
    controls.modal.innerHTML =
      '<button id="first">Primero</button><button id="last">Último</button>';

    await waitForAnimationFrame();

    const first = document.getElementById('first') as HTMLElement;
    const last = document.getElementById('last') as HTMLElement;

    last.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
    expect(document.activeElement).toBe(first);

    first.focus();
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true }),
    );
    expect(document.activeElement).toBe(last);
  });

  it('falls back to the modal container when no focusable element exists', async () => {
    const controls = createModalShell();

    await waitForAnimationFrame();

    expect(document.activeElement).toBe(controls.modal);
  });
});
