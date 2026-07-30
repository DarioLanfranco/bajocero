const OBSERVED_ATTRIBUTE = 'data-reveal';

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function revealElement(el: HTMLElement, delay: number): void {
  el.style.opacity = '';
  el.style.transform = '';
  el.style.transitionDelay = `${delay}ms`;
  el.classList.add('anim-visible');
}

let observer: IntersectionObserver | null = null;

export function initReveal(): () => void {
  if (observer) destroyReveal();

  const targets = document.querySelectorAll<HTMLElement>(`[${OBSERVED_ATTRIBUTE}]`);
  if (targets.length === 0) return () => {};

  if (prefersReducedMotion()) {
    targets.forEach((el) => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    });
    return () => {};
  }

  function setHidden(el: HTMLElement): void {
    el.style.opacity = '0';
    el.style.transform = 'translateY(12px)';
  }

  for (const el of targets) {
    const stagger = el.getAttribute(`${OBSERVED_ATTRIBUTE}-stagger`);
    if (stagger === 'children') {
      Array.from(el.children).forEach((child) => {
        if (child instanceof HTMLElement) setHidden(child);
      });
    } else {
      setHidden(el);
    }
  }

  let remaining = targets.length;

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        if (!(entry.target instanceof HTMLElement)) continue;
        const el = entry.target;
        const stagger = el.getAttribute(`${OBSERVED_ATTRIBUTE}-stagger`);
        const baseDelay = parseInt(el.getAttribute(`${OBSERVED_ATTRIBUTE}-delay`) || '0', 10);
        if (stagger === 'children') {
          const children = Array.from(el.children).filter((c): c is HTMLElement => c instanceof HTMLElement);
          children.forEach((child, i) => revealElement(child, baseDelay + i * 50));
        } else {
          revealElement(el, baseDelay);
        }
        observer!.unobserve(el);
        remaining--;
        if (remaining === 0) destroyReveal();
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
      const children = Array.from(el.children).filter((c): c is HTMLElement => c instanceof HTMLElement);
      children.forEach((child, i) => {
        child.style.transitionDelay = `${baseDelay + i * 50}ms`;
      });
    } else {
      el.style.transitionDelay = `${baseDelay}ms`;
    }
    observer.observe(el);
  }

  let cleanupCalled = false;
  const cleanup = () => {
    if (cleanupCalled) return;
    cleanupCalled = true;
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  };

  return cleanup;
}

export function destroyReveal(): void {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
}

