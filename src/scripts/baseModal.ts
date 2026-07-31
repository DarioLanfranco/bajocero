const TRANSITION_FALLBACK_MS = 300;

let baseStylesInjected = false;

function injectBaseModalStyles(): void {
  if (baseStylesInjected) return;
  baseStylesInjected = true;
  const style = document.createElement('style');
  style.textContent = `
.modal-overlay {
  position: fixed; inset: 0; z-index: 400;
  display: flex; align-items: center; justify-content: center;
  padding: var(--space-lg);
  background-color: rgba(0,0,0,0);
  transition: background-color 0.3s ease;
}
.modal-overlay--visible { background-color: var(--color-overlay); }
.modal {
  width: 100%;
  display: flex; flex-direction: column;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  box-shadow: 0 16px 48px rgba(0,0,0,0.35);
  overflow: hidden;
  opacity: 0;
  transform: translateY(16px) scale(0.97);
  transition: opacity 0.3s var(--easing-smooth), transform 0.3s var(--easing-smooth);
}
.modal.anim-visible { opacity: 1; transform: translateY(0) scale(1); }
`;
  document.head.appendChild(style);
}

export interface ModalControls {
  overlay: HTMLElement;
  modal: HTMLElement;
  close(): void;
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.hasAttribute('hidden') && el.getAttribute('aria-hidden') !== 'true',
  );
}

function buildModalDom(maxWidth: string, maxHeight: string): { overlay: HTMLElement; modal: HTMLElement } {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal anim-visible';
  modal.style.maxWidth = maxWidth;
  modal.style.maxHeight = maxHeight;
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.tabIndex = -1;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  return { overlay, modal };
}

export function createModalShell(maxWidth = '420px', maxHeight = '80vh'): ModalControls {
  injectBaseModalStyles();

  const { overlay, modal } = buildModalDom(maxWidth, maxHeight);

  let closed = false;
  let cleaned = false;
  let previouslyFocusedElement: HTMLElement | null = null;

  function open(): void {
    if (document.activeElement instanceof HTMLElement) {
      previouslyFocusedElement = document.activeElement;
    }
    const focusables = getFocusableElements(modal);
    const target = focusables[0] ?? modal;
    target.focus();
  }

  function trapFocus(e: KeyboardEvent): void {
    if (e.key !== 'Tab') return;

    const focusables = getFocusableElements(modal);
    if (focusables.length === 0) {
      e.preventDefault();
      modal.focus();
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;

    if (e.shiftKey) {
      if (active === first || !modal.contains(active)) {
        e.preventDefault();
        last.focus();
      }
    } else if (active === last || !modal.contains(active)) {
      e.preventDefault();
      first.focus();
    }
  }

  function handleKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      close();
      return;
    }
    trapFocus(e);
  }

  function handleOverlayClick(e: MouseEvent): void {
    if (e.target === overlay) close();
  }

  function close(): void {
    if (closed) return;
    closed = true;

    document.removeEventListener('keydown', handleKeyDown);
    overlay.removeEventListener('click', handleOverlayClick);

    previouslyFocusedElement?.focus();

    modal.classList.remove('anim-visible');
    overlay.classList.remove('modal-overlay--visible');

    function cleanup() {
      if (cleaned) return;
      cleaned = true;
      overlay.remove();
    }

    modal.addEventListener('transitionend', cleanup, { once: true });
    setTimeout(cleanup, TRANSITION_FALLBACK_MS);
  }

  overlay.addEventListener('click', handleOverlayClick);
  document.addEventListener('keydown', handleKeyDown);

  requestAnimationFrame(() => {
    if (closed) return;
    overlay.classList.add('modal-overlay--visible');
    open();
  });

  return { overlay, modal, close };
}
