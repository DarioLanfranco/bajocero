const OBSERVED_ATTRIBUTE = 'data-reveal';

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function revealElement(el: HTMLElement, delay: number): void {
  el.style.transitionDelay = `${delay}ms`;
  el.classList.add('anim-visible');
}

function initReveal(): void {
  const targets = document.querySelectorAll<HTMLElement>(`[${OBSERVED_ATTRIBUTE}]`);
  if (targets.length === 0) return;

  if (prefersReducedMotion()) {
    targets.forEach((el) => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        const stagger = el.getAttribute(`${OBSERVED_ATTRIBUTE}-stagger`);
        const baseDelay = parseInt(el.getAttribute(`${OBSERVED_ATTRIBUTE}-delay`) || '0', 10);
        if (stagger === 'children') {
          const children = Array.from(el.children) as HTMLElement[];
          children.forEach((child, i) => revealElement(child, baseDelay + i * 50));
        } else {
          revealElement(el, baseDelay);
        }
        observer.unobserve(el);
      }
    },
    {
      threshold: 0.05,
      rootMargin: '0px 0px -20px 0px',
    },
  );

  for (const el of targets) {
    const stagger = el.getAttribute(`${OBSERVED_ATTRIBUTE}-stagger`);
    const baseDelay = parseInt(el.getAttribute(`${OBSERVED_ATTRIBUTE}-delay`) || '0', 10);

    if (stagger === 'children') {
      const children = Array.from(el.children) as HTMLElement[];
      children.forEach((child, i) => {
        child.style.transitionDelay = `${baseDelay + i * 50}ms`;
      });
    } else {
      el.style.transitionDelay = `${baseDelay}ms`;
    }
    observer.observe(el);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initReveal);
} else {
  initReveal();
}