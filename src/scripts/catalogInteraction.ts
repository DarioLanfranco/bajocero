import { cartStore } from '../store/cart';

function getProductId(card: HTMLElement): string {
  return card.getAttribute('data-product-id')!;
}

function syncCardUI(card: HTMLElement): void {
  const id = getProductId(card);
  const addBtn = card.querySelector<HTMLButtonElement>('[data-action="add"]');
  const qtyWrap = card.querySelector<HTMLElement>('.product-card__qty');
  const qtyValue = card.querySelector<HTMLElement>('[data-qty-value]');
  if (!addBtn || !qtyWrap || !qtyValue) return;

  const item = cartStore.items.find((i) => i.productId === id);
  const qty = item ? item.quantity : 0;

  if (qty > 0) {
    addBtn.hidden = true;
    qtyWrap.hidden = false;
    qtyValue.textContent = String(qty);
  } else {
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
  const action = actionBtn.getAttribute('data-action');

  if (action === 'add' || action === 'increment') {
    cartStore.addItem({ productId: id, name, price, quantity: 1, presentacion });
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

let initialized = false;
let unsubscribeStore: (() => void) | null = null;

export function initCatalogInteraction(): () => void {
  if (initialized) return () => {};
  initialized = true;

  document.addEventListener('click', handleCardClick);

  unsubscribeStore = cartStore.subscribe(() => {
    document.querySelectorAll<HTMLElement>('.product-card').forEach(syncCardUI);
  });

  document.querySelectorAll<HTMLElement>('.product-card').forEach(syncCardUI);

  return () => {
    document.removeEventListener('click', handleCardClick);
    if (unsubscribeStore) {
      unsubscribeStore();
      unsubscribeStore = null;
    }
    initialized = false;
  };
}
