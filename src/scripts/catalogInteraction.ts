import { TIPO_VENTA } from '../types/tipoVenta';
import type { TipoVentaKey } from '../types/tipoVenta';
import { TipoVentaKeySchema } from '../schemas/cart';
import { cartStore } from '../store/cart';
import { log } from '../utils/logger';

function getProductId(card: HTMLElement): string | null {
  return card.getAttribute('data-product-id');
}

function syncCardUI(card: HTMLElement): void {
  const id = getProductId(card);
  if (!id) return;
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
  if (!(e.target instanceof Element)) return;
  const actionBtn = e.target.closest<HTMLButtonElement>('[data-action]');
  if (!actionBtn) return;

  const card = actionBtn.closest<HTMLElement>('[data-product-id]');
  if (!card) return;

  const id = getProductId(card);
  if (!id) return;
  const name = card.getAttribute('data-product-name') || '';
  const price = Number(card.getAttribute('data-product-price')) || 0;
  const presentacion = card.getAttribute('data-product-presentacion') || undefined;
  const rawTipo = card.getAttribute('data-product-tipo-venta');
  const parsedTipo = TipoVentaKeySchema.safeParse(rawTipo);
  if (!parsedTipo.success) return;
  const tipoVenta: TipoVentaKey = parsedTipo.data;
  const action = actionBtn.getAttribute('data-action');

  if (action === 'add') {
    const quantity = TIPO_VENTA[tipoVenta].isWeight
      ? parseFloat(card.querySelector<HTMLSelectElement>('[data-weight-select]')?.value || '1')
      : 1;
    cartStore.addItem({
      productId: id, name, price, quantity,
      presentacion, tipoVenta,
    });
  } else if (action === 'increment') {
    cartStore.addItem({
      productId: id, name, price, quantity: 1,
      presentacion, tipoVenta,
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

    const cards = document.querySelectorAll<HTMLElement>('.product-card');
    document.addEventListener('click', handleCardClick);

    const unsubscribe = cartStore.subscribe(() => {
      cards.forEach(syncCardUI);
    });

    cards.forEach(syncCardUI);

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
