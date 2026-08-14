import type { PageElements } from './types';

let isOpen = false;
let prevBodyOverflow = '';

function resetToIdle(els: PageElements): void {
  const clone = els.idleTemplate.content.cloneNode(true);
  els.result.replaceChildren(clone);
}

export function openResultModal(els: PageElements): void {
  if (!isOpen) {
    prevBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  isOpen = true;
  els.result.classList.add('ideal__result--open');
  els.result.setAttribute('aria-modal', 'true');
}

export function closeResultModal(els: PageElements): void {
  if (!isOpen) return;
  isOpen = false;
  document.body.style.overflow = prevBodyOverflow;
  els.result.classList.remove('ideal__result--open');
  els.result.removeAttribute('aria-modal');
  resetToIdle(els);
  els.submit.focus();
}

export function setupResultModal(els: PageElements): void {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) {
      e.preventDefault();
      closeResultModal(els);
    }
  });

  els.result.addEventListener('click', (e) => {
    const target = e.target;
    if (!(target instanceof Node)) return;
    if (target instanceof Element && target.closest('[data-part="close"]')) {
      closeResultModal(els);
      return;
    }
    if (target === els.result) {
      closeResultModal(els);
    }
  });
}