import { createModalShell } from './baseModal';

let stylesInjected = false;

function injectSuccessModalStyles(): void {
  if (stylesInjected) return;
  stylesInjected = true;
  const style = document.createElement('style');
  style.textContent = `
.success-modal { gap: var(--space-lg); padding: var(--space-xl); }
.success-modal__title {
  font-size: var(--font-size-xl); font-weight: 700;
  color: var(--color-text); line-height: 1.3; text-align: center;
}
.success-modal__body { display: flex; flex-direction: column; gap: var(--space-md); }
.success-modal__text {
  font-size: var(--font-size-base); color: var(--color-text-secondary);
  line-height: 1.5; margin: 0; text-align: center;
}
.success-modal__text--disclaimer { font-size: var(--font-size-sm); color: var(--color-text-tertiary); }
.success-modal__actions { display: flex; flex-direction: column; }
.success-modal__btn {
  display: flex; align-items: center; justify-content: center;
  width: 100%; padding: 16px var(--space-lg);
  font-size: var(--font-size-base); font-weight: 700;
  border-radius: var(--radius-md);
  background-color: var(--color-brand); color: var(--color-text);
  transition: opacity var(--transition-fast), transform var(--transition-fast);
  line-height: 1.2; text-decoration: none;
}
.success-modal__btn:active { transform: scale(0.97); }
@media (hover: hover) { .success-modal__btn:hover { opacity: 0.9; } }
`;
  document.head.appendChild(style);
}

export interface SuccessModalConfig {
  whatsappUrl?: string;
  onConfirm?: () => void;
}

function buildContent(modal: HTMLElement, config: SuccessModalConfig): void {
  const hasUrl = !!config.whatsappUrl;
  modal.classList.add('success-modal');

  const title = document.createElement('h2');
  title.id = 'success-modal-title';
  title.className = 'success-modal__title';
  title.textContent = '¡Gracias por tu pedido! 🎉';

  modal.appendChild(title);

  const body = document.createElement('div');
  body.className = 'success-modal__body';

  const line1 = document.createElement('p');
  line1.className = 'success-modal__text';
  line1.textContent = hasUrl
    ? 'Hacé clic en el botón de abajo para abrir WhatsApp con tu pedido.'
    : 'Hemos abierto WhatsApp para enviar tu lista de productos.';

  const line2 = document.createElement('p');
  line2.className = 'success-modal__text success-modal__text--disclaimer';
  line2.textContent = '⚖️ En breve pesaremos tus productos en balanza y te confirmaremos el ticket con el monto final exacto por chat.';

  body.append(line1, line2);
  modal.appendChild(body);

  const actions = document.createElement('div');
  actions.className = 'success-modal__actions';

  if (hasUrl) {
    const link = document.createElement('a');
    link.className = 'success-modal__btn';
    link.href = config.whatsappUrl!;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Abrir WhatsApp';
    link.addEventListener('click', () => {
      config.onConfirm?.();
    });
    actions.appendChild(link);
  } else {
    const btn = document.createElement('button');
    btn.className = 'success-modal__btn';
    btn.type = 'button';
    btn.textContent = 'Entendido';
    actions.appendChild(btn);
  }

  modal.appendChild(actions);
}

export function showSuccessModal(config: SuccessModalConfig = {}): Promise<void> {
  if (!stylesInjected) {
    injectSuccessModalStyles();
    stylesInjected = true;
  }
  return new Promise((resolve) => {
    const { overlay, close } = createModalShell('420px');
    const modal = overlay.querySelector('.modal') as HTMLElement;
    modal.setAttribute('aria-labelledby', 'success-modal-title');

    buildContent(modal, config);

    const okBtn = modal.querySelector('.success-modal__btn') as HTMLElement;
    okBtn.addEventListener('click', () => {
      config.onConfirm?.();
      close();
      resolve();
    });
  });
}
