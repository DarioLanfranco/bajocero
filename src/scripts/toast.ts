type ToastType = 'success' | 'error' | 'default';
type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

interface ToastConfig {
  message: string;
  type?: ToastType;
  duration?: number;
  position?: ToastPosition;
}

interface ToastItem {
  id: number;
  el: HTMLElement;
  timer: ReturnType<typeof setTimeout>;
}

let nextId = 1;
const active: ToastItem[] = [];
const MAX_VISIBLE = 3;
const BASE_DURATION = 3000;
const GAP = 14;

function getContainer(position: ToastPosition): HTMLElement {
  const id = `toast-container-${position}`;
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('ol');
    el.id = id;
    el.className = 'toast-container';
    el.setAttribute('data-position', position);
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('aria-label', 'Notifications');
    document.body.appendChild(el);
  }
  return el;
}

function createToastEl(config: ToastConfig): HTMLElement {
  const li = document.createElement('li');
  li.className = 'toast';
  li.setAttribute('data-type', config.type || 'default');
  li.setAttribute('role', 'status');

  const content = document.createElement('div');
  content.className = 'toast__content';

  const title = document.createElement('span');
  title.className = 'toast__title';
  title.textContent = config.message;

  content.appendChild(title);
  li.appendChild(content);

  if (config.type && config.type !== 'default') {
    const icon = document.createElement('span');
    icon.className = `toast__icon toast__icon--${config.type}`;
    icon.innerHTML = config.type === 'success'
      ? '<svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd"/></svg>'
      : '<svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/></svg>';
    li.insertBefore(icon, content);
  }

  const closeBtn = document.createElement('button');
  closeBtn.className = 'toast__close';
  closeBtn.setAttribute('aria-label', 'Cerrar');
  closeBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  li.appendChild(closeBtn);

  return li;
}

function layoutToasts(position: ToastPosition): void {
  const container = getContainer(position);
  const items = container.querySelectorAll<HTMLElement>('.toast');
  let offset = 0;

  items.forEach((el, i) => {
    if (i >= MAX_VISIBLE) {
      el.style.setProperty('--toast-offset', `${offset}px`);
      el.style.opacity = '0';
      el.style.pointerEvents = 'none';
      return;
    }
    el.style.setProperty('--toast-offset', `${offset}px`);
    el.style.opacity = '';
    el.style.pointerEvents = '';
    const h = el.getBoundingClientRect().height;
    offset += h + GAP;
  });
}

function removeToast(id: number): void {
  const idx = active.findIndex((t) => t.id === id);
  if (idx === -1) return;
  const item = active[idx];
  clearTimeout(item.timer);
  active.splice(idx, 1);

  const container = item.el.parentElement;
  const pos = (container?.getAttribute('data-position') as ToastPosition) || 'top-right';
  item.el.classList.remove('toast--visible');
  item.el.addEventListener('transitionend', () => {
    item.el.remove();
    layoutToasts(pos);
  }, { once: true });
}

function showToast(config: ToastConfig): number {
  const position = config.position || 'top-right';
  const container = getContainer(position);
  const el = createToastEl(config);
  container.appendChild(el);

  const id = nextId++;

  const duration = config.duration !== undefined ? config.duration : BASE_DURATION;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.classList.add('toast--visible');
      layoutToasts(position);
    });
  });

  const closeBtn = el.querySelector('.toast__close');
  closeBtn?.addEventListener('click', () => removeToast(id));

  const timer = setTimeout(() => removeToast(id), duration);

  active.push({ id, el, timer });
  return id;
}

export function showProductAdded(name: string): void {
  showToast({ message: `${name} agregada al carrito`, type: 'success' });
}

export function showQuantityUpdated(name: string, quantity: number): void {
  showToast({ message: `${name} x${quantity}`, type: 'success' });
}

export function showProductRemoved(name: string): void {
  showToast({ message: `${name} eliminada del carrito` });
}

export function showCartCleared(): void {
  showToast({ message: 'Carrito vaciado correctamente' });
}
