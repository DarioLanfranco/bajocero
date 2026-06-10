const OBSERVED_ATTRIBUTE = 'data-reveal';

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function revealElement(el: HTMLElement, delay: number): void {
  el.style.transitionDelay = `${delay}ms`;
  el.classList.remove('anim-hidden');
  el.classList.add('anim-visible');
}

function hideElement(el: HTMLElement): void {
  el.classList.add('anim-hidden');
}

function initReveal(): void {
  if (prefersReducedMotion()) {
    document.querySelectorAll(`[${OBSERVED_ATTRIBUTE}]`).forEach((el) => {
      (el as HTMLElement).classList.add('anim-visible');
    });
    return;
  }

  const elements = document.querySelectorAll<HTMLElement>(`[${OBSERVED_ATTRIBUTE}]`);

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLElement;
          const stagger = el.getAttribute(`${OBSERVED_ATTRIBUTE}-stagger`);
          const baseDelay = parseInt(el.getAttribute(`${OBSERVED_ATTRIBUTE}-delay`) || '0', 10);

          if (stagger === 'children') {
            const children = Array.from(el.children) as HTMLElement[];
            children.forEach((child, i) => {
              revealElement(child as HTMLElement, baseDelay + i * 50);
            });
          } else {
            revealElement(el, baseDelay);
          }

          observer.unobserve(el);
        }
      }
    },
    {
      threshold: 0.05,
      rootMargin: '0px 0px -20px 0px',
    }
  );

  for (const el of elements) {
    const stagger = el.getAttribute(`${OBSERVED_ATTRIBUTE}-stagger`);
    const baseDelay = parseInt(el.getAttribute(`${OBSERVED_ATTRIBUTE}-delay`) || '50', 10);

    if (isElementInViewport(el)) {
      if (stagger === 'children') {
        const children = Array.from(el.children) as HTMLElement[];
        children.forEach((child, i) => {
          revealElement(child as HTMLElement, baseDelay + i * 50);
        });
      } else {
        revealElement(el, baseDelay);
      }
    } else {
      if (stagger === 'children') {
        const children = Array.from(el.children) as HTMLElement[];
        children.forEach((child) => hideElement(child));
      } else {
        hideElement(el);
      }
      observer.observe(el);
    }
  }
}

function isElementInViewport(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight;
  return rect.top < vh - 40 && rect.bottom > 0;
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReveal);
  } else {
    initReveal();
  }
}
