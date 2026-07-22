import type { CartItem } from '../types/cart';
import { formatPrice, formatWeightDetail } from '../utils/format';
import { createModalShell } from './baseModal';

export interface ConfirmModalResult {
  confirmed: boolean;
}

let stylesInjected = false;

function injectConfirmModalStyles(): void {
  if (stylesInjected) return;
  stylesInjected = true;
  const style = document.createElement('style');
  style.textContent = `
.confirm-modal__header { padding: var(--space-xl) var(--space-lg) 0; }
.confirm-modal__title {
  font-size: var(--font-size-xl); font-weight: 700;
  color: var(--color-text); line-height: 1.3;
}
.confirm-modal__body {
  flex: 1; min-height: 0; overflow-y: auto;
  padding: var(--space-lg); display: flex; flex-direction: column; gap: var(--space-lg);
}
.confirm-modal__products { display: flex; flex-direction: column; gap: var(--space-md); }
.confirm-modal__product { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-md); }
.confirm-modal__product-left { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
.confirm-modal__product-name {
  font-size: var(--font-size-sm); font-weight: 600;
  color: var(--color-text); line-height: 1.3;
}
.confirm-modal__product-weight {
  font-size: var(--font-size-xs); color: var(--color-text-secondary); line-height: 1.4;
}
.confirm-modal__product-total {
  font-size: var(--font-size-sm); font-weight: 700;
  color: var(--color-text); white-space: nowrap; flex-shrink: 0;
}
.confirm-modal__total {
  display: flex; align-items: center; justify-content: space-between;
  padding-top: var(--space-md); border-top: 1px solid var(--color-border);
}
.confirm-modal__total-label { font-size: var(--font-size-base); font-weight: 600; color: var(--color-text); }
.confirm-modal__total-value { font-size: var(--font-size-lg); font-weight: 800; color: var(--color-brand); }
.confirm-modal__actions { display: flex; flex-direction: column; gap: var(--space-sm); padding: 0 var(--space-lg) var(--space-xl); }
.confirm-modal__btn {
  display: flex; align-items: center; justify-content: center;
  width: 100%; padding: 16px var(--space-lg);
  font-size: var(--font-size-base); font-weight: 700;
  border-radius: var(--radius-md);
  transition: opacity var(--transition-fast), transform var(--transition-fast);
  line-height: 1.2;
}
.confirm-modal__btn:active { transform: scale(0.97); }
.confirm-modal__btn--primary { background-color: var(--color-brand); color: var(--color-text); }
@media (hover: hover) { .confirm-modal__btn--primary:hover { opacity: 0.9; } }
.confirm-modal__btn--secondary { background: none; border: 1px solid var(--color-border); color: var(--color-text-secondary); }
@media (hover: hover) { .confirm-modal__btn--secondary:hover { border-color: var(--color-text-tertiary); color: var(--color-text); } }
`;
  document.head.appendChild(style);
}

let styleCleanup: (() => void) | null = null;

function ensureStyles(): void {
  if (!styleCleanup) {
    injectConfirmModalStyles();
    styleCleanup = () => {};
  }
}

function buildProductRows(items: CartItem[]): HTMLElement[] {
  return items.map((item) => {
    const lineTotal = item.price * item.quantity;
    const detail = formatWeightDetail(item.quantity, item.presentacion);
    const qtyLabel = detail || `${item.quantity} unidad(es)`;

    const row = document.createElement('div');
    row.className = 'confirm-modal__product';

    const left = document.createElement('div');
    left.className = 'confirm-modal__product-left';

    const name = document.createElement('span');
    name.className = 'confirm-modal__product-name';
    name.textContent = item.name;

    const weight = document.createElement('span');
    weight.className = 'confirm-modal__product-weight';
    weight.textContent = qtyLabel;

    left.append(name, weight);

    const total = document.createElement('span');
    total.className = 'confirm-modal__product-total';
    total.textContent = formatPrice(lineTotal);

    row.append(left, total);
    return row;
  });
}

function buildContent(modal: HTMLElement, productRows: HTMLElement[], total: number): void {
  const header = document.createElement('div');
  header.className = 'confirm-modal__header';

  const title = document.createElement('h2');
  title.id = 'confirm-modal-title';
  title.className = 'confirm-modal__title';
  title.textContent = '¿Está todo bien con tu compra?';

  header.appendChild(title);

  const body = document.createElement('div');
  body.className = 'confirm-modal__body';

  const productList = document.createElement('div');
  productList.className = 'confirm-modal__products';
  productRows.forEach((r) => productList.appendChild(r));

  const totalRow = document.createElement('div');
  totalRow.className = 'confirm-modal__total';

  const totalLabel = document.createElement('span');
  totalLabel.className = 'confirm-modal__total-label';
  totalLabel.textContent = 'Total';

  const totalValue = document.createElement('span');
  totalValue.className = 'confirm-modal__total-value';
  totalValue.textContent = formatPrice(total);

  totalRow.append(totalLabel, totalValue);

  body.append(productList, totalRow);

  const actions = document.createElement('div');
  actions.className = 'confirm-modal__actions';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'confirm-modal__btn confirm-modal__btn--secondary';
  cancelBtn.type = 'button';
  cancelBtn.textContent = 'No, quiero seguir mirando';

  const confirmBtn = document.createElement('button');
  confirmBtn.className = 'confirm-modal__btn confirm-modal__btn--primary';
  confirmBtn.type = 'button';
  confirmBtn.textContent = '¡Sí, estoy seguro de mi compra!';

  actions.append(cancelBtn, confirmBtn);
  modal.append(header, body, actions);
}

export function showConfirmModal(items: CartItem[], total: number): Promise<ConfirmModalResult> {
  ensureStyles();
  return new Promise((resolve) => {
    const productRows = buildProductRows(items);
    const { overlay, close } = createModalShell('480px', '80vh');
    const modal = overlay.querySelector('.modal') as HTMLElement;
    modal.setAttribute('aria-labelledby', 'confirm-modal-title');

    buildContent(modal, productRows, total);

    const cancelBtn = modal.querySelector('.confirm-modal__btn--secondary') as HTMLButtonElement;
    const confirmBtn = modal.querySelector('.confirm-modal__btn--primary') as HTMLButtonElement;

    cancelBtn.addEventListener('click', () => {
      close();
      resolve({ confirmed: false });
    });

    confirmBtn.addEventListener('click', () => {
      close();
      resolve({ confirmed: true });
    });
  });
}
