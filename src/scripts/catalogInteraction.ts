import { cartStore } from '../store/cart';
import { log } from '../utils/logger';

function getProductId(card: HTMLElement): string {
  return card.getAttribute('data-product-id')!;
}

function syncCardUI(card: HTMLElement): void {
  const id = getProductId(card);
  const tipoVenta = card.getAttribute('data-product-tipo-venta');
  const addBtn = card.querySelector<HTMLButtonElement>('[data-action="add"]');
  const qtyWrap = card.querySelector<HTMLElement>('.product-card__qty');
  const kgWrap = card.querySelector<HTMLElement>('[data-kg-selector]');
  const qtyValue = card.querySelector<HTMLElement>('[data-qty-value]');
  if (!addBtn || !qtyWrap || !qtyValue) return;

  const item = cartStore.items.find((i) => i.productId === id);
  const qty = item ? item.quantity : 0;

  if (qty > 0) {
    if (kgWrap) kgWrap.hidden = true;
    addBtn.hidden = true;
    qtyWrap.hidden = false;
    qtyValue.textContent = String(qty);
  } else {
    if (kgWrap) kgWrap.hidden = false;
    addBtn.hidden = false;
    qtyWrap.hidden = true;
  }
}

function handleCardClick(e: MouseEvent): void {
  const target = e.target as HTMLElement;
  const actionBtn = target.closest<HTMLButtonElement>('[data-action]');
  if (!actionBtn) return;

  const card = actionBtn.closest<HTMLElement>('[data-product-id]');
  if (!card) return;

  const id = getProductId(card);
  const name = card.getAttribute('data-product-name') || '';
  const price = Number(card.getAttribute('data-product-price')) || 0;
  const presentacion = card.getAttribute('data-product-presentacion') || undefined;
  const tipoVenta = card.getAttribute('data-product-tipo-venta') as 'kg' | 'unidad' | 'unidad400' | 'pack' | null;
  const action = actionBtn.getAttribute('data-action');

  if (action === 'add') {
    if (tipoVenta === 'kg') {
      const weightSelect = card.querySelector<HTMLSelectElement>('[data-weight-select]');
      const weightKg = parseFloat(weightSelect?.value || '1');
      cartStore.addItem({
        productId: id, name, price, quantity: weightKg,
        presentacion, tipoVenta: 'kg',
        pesoOFactor: weightKg,
        precioCalculado: price * weightKg,
      });
    } else {
      const isPack = tipoVenta === 'pack';
      cartStore.addItem({
        productId: id, name, price, quantity: 1,
        presentacion, tipoVenta: tipoVenta || 'unidad',
        pesoOFactor: isPack ? 1 : (tipoVenta === 'unidad400' ? 0.4 : 0.5),
        precioCalculado: price,
      });
    }
  } else if (action === 'increment') {
    const isKg = tipoVenta === 'kg';
    const isPack = tipoVenta === 'pack';
    cartStore.addItem({
      productId: id, name, price, quantity: 1,
      presentacion, tipoVenta: tipoVenta || 'unidad',
      pesoOFactor: isKg ? 1 : (isPack ? 1 : (tipoVenta === 'unidad400' ? 0.4 : 0.5)),
      precioCalculado: price,
    });
  } else if (action === 'decrement') {
    const item = cartStore.items.find((i) => i.productId === id);
    const currentQty = item ? item.quantity : 0;
    if (currentQty <= 1) {
      cartStore.removeItem(id);
    } else {
      cartStore.updateQuantity(id, currentQty - 1);
    }
  }
}

let cleanupFn: (() => void) | null = null;

export function initCatalogInteraction(): () => void {
  try {
    if (cleanupFn) cleanupFn();

    document.addEventListener('click', handleCardClick);

    const unsubscribe = cartStore.subscribe(() => {
      document.querySelectorAll<HTMLElement>('.product-card').forEach(syncCardUI);
    });

    document.querySelectorAll<HTMLElement>('.product-card').forEach(syncCardUI);

    cleanupFn = () => {
      document.removeEventListener('click', handleCardClick);
      unsubscribe();
    };

    return cleanupFn;
  } catch (err) {
    log('catalogInteraction', 'error', 'init failed', err);
    cleanupFn = null;
    return () => {};
  }
}
