const OBSERVED_ATTRIBUTE = 'data-reveal';

const OBSERVER_OPTIONS: IntersectionObserverInit = {
  threshold: 0.05,
  rootMargin: '0px 0px -20px 0px',
};

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function revealElement(el: HTMLElement, delay: number): void {
  el.style.opacity = '';
  el.style.transform = '';
  el.style.transitionDelay = `${delay}ms`;
  el.classList.add('anim-visible');
}

function setHidden(el: HTMLElement): void {
  el.style.opacity = '0';
  el.style.transform = 'translateY(12px)';
}

function getStaggerDelay(el: HTMLElement): [string | null, number] {
  const stagger = el.getAttribute(`${OBSERVED_ATTRIBUTE}-stagger`);
  const baseDelay = parseInt(el.getAttribute(`${OBSERVED_ATTRIBUTE}-delay`) || '0', 10);
  return [stagger, baseDelay];
}

function handleRevealEntry(
  entry: IntersectionObserverEntry,
  obs: IntersectionObserver,
  remaining: { value: number },
  onAllDone: () => void,
): void {
  if (!entry.isIntersecting) return;
  if (!(entry.target instanceof HTMLElement)) return;
  const el = entry.target;
  const [stagger, baseDelay] = getStaggerDelay(el);
  if (stagger === 'children') {
    const children = Array.from(el.children).filter((c): c is HTMLElement => c instanceof HTMLElement);
    children.forEach((child, i) => revealElement(child, baseDelay + i * 50));
  } else {
    revealElement(el, baseDelay);
  }
  obs.unobserve(el);
  remaining.value--;
  if (remaining.value === 0) onAllDone();
}

function initReducedMotion(targets: NodeListOf<HTMLElement>): () => void {
  targets.forEach((el) => {
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
  });
  return () => {};
}

function prepareTargets(targets: NodeListOf<HTMLElement>): void {
  for (const el of targets) {
    const [stagger] = getStaggerDelay(el);
    if (stagger === 'children') {
      Array.from(el.children).forEach((child) => {
        if (child instanceof HTMLElement) setHidden(child);
      });
    } else {
      setHidden(el);
    }
  }
}

function observeTargets(
  targets: NodeListOf<HTMLElement>,
  observer: IntersectionObserver,
): void {
  for (const el of targets) {
    const [stagger, baseDelay] = getStaggerDelay(el);
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
}

let observer: IntersectionObserver | null = null;

export function initReveal(): () => void {
  if (observer) destroyReveal();

  const targets = document.querySelectorAll<HTMLElement>(`[${OBSERVED_ATTRIBUTE}]`);
  if (targets.length === 0) return () => {};
  if (prefersReducedMotion()) return initReducedMotion(targets);

  prepareTargets(targets);

  const remaining = { value: targets.length };

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        handleRevealEntry(entry, observer!, remaining, destroyReveal);
      }
    },
    OBSERVER_OPTIONS,
  );

  observeTargets(targets, observer);

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

