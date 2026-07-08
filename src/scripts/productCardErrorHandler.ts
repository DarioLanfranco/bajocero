let cleanupFn: (() => void) | null = null;

export function initProductCardErrorHandler(): () => void {
  if (cleanupFn) cleanupFn();

  function handler(e: Event): void {
    if (!(e.target instanceof HTMLImageElement)) return;
    const img = e.target;
    if (!img.classList.contains('product-card__image')) return;
    if (img.dataset.fallback) return;
    img.dataset.fallback = 'true';
    img.style.display = 'none';
    const wrap = img.parentElement;
    if (!wrap) return;
    const placeholder = document.createElement('div');
    placeholder.className = 'product-card__image-fallback';
    placeholder.textContent = 'Fotografía en Producción';
    wrap.appendChild(placeholder);
  }

  document.addEventListener('error', handler, true);

  cleanupFn = () => {
    document.removeEventListener('error', handler, true);
    cleanupFn = null;
  };

  return cleanupFn;
}