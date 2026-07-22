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

export function createModalShell(maxWidth = '420px', maxHeight = '80vh'): ModalControls {
  injectBaseModalStyles();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal anim-visible';
  modal.style.maxWidth = maxWidth;
  modal.style.maxHeight = maxHeight;
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  requestAnimationFrame(() => {
    overlay.classList.add('modal-overlay--visible');
  });

  let cleaned = false;

  function close(): void {
    if (cleaned) return;
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

  function closeOnEscape(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      document.removeEventListener('keydown', closeOnEscape);
      close();
    }
  }

  function closeOnOverlayClick(e: MouseEvent): void {
    if (e.target === overlay) close();
  }

  overlay.addEventListener('click', closeOnOverlayClick);
  document.addEventListener('keydown', closeOnEscape);

  return { overlay, modal, close };
}
