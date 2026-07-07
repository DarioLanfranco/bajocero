import type { CartItem } from '../types/cart';
import { formatPrice, formatWeightDetail } from '../utils/format';

export interface ConfirmModalResult {
  confirmed: boolean;
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

function buildWindow(total: number, productRows: HTMLElement[]): HTMLElement {
  const overlay = document.createElement('div');
  overlay.className = 'confirm-modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'confirm-modal anim-visible';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'confirm-modal-title');

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
  overlay.appendChild(modal);

  return overlay;
}

export function showConfirmModal(items: CartItem[], total: number): Promise<ConfirmModalResult> {
  return new Promise((resolve) => {
    const productRows = buildProductRows(items);
    const overlay = buildWindow(total, productRows);
    document.body.appendChild(overlay);

    const modal = overlay.querySelector('.confirm-modal') as HTMLElement;
    const cancelBtn = overlay.querySelector('.confirm-modal__btn--secondary') as HTMLButtonElement;
    const confirmBtn = overlay.querySelector('.confirm-modal__btn--primary') as HTMLButtonElement;

    requestAnimationFrame(() => {
      overlay.classList.add('confirm-modal-overlay--visible');
    });

    function closeModal(result: ConfirmModalResult): void {
      modal.classList.remove('anim-visible');
      overlay.classList.remove('confirm-modal-overlay--visible');

      modal.addEventListener('transitionend', () => {
        overlay.remove();
        resolve(result);
      }, { once: true });
    }

    cancelBtn.addEventListener('click', () => closeModal({ confirmed: false }));
    confirmBtn.addEventListener('click', () => closeModal({ confirmed: true }));

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal({ confirmed: false });
    });

    document.addEventListener('keydown', function onKey(e) {
      if (e.key === 'Escape') {
        document.removeEventListener('keydown', onKey);
        closeModal({ confirmed: false });
      }
    });
  });
}
