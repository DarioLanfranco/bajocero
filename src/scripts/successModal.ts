const TRANSITION_FALLBACK_MS = 300;

function buildWindow(): HTMLElement {
  const overlay = document.createElement('div');
  overlay.className = 'success-modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'success-modal anim-visible';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'success-modal-title');

  const title = document.createElement('h2');
  title.id = 'success-modal-title';
  title.className = 'success-modal__title';
  title.textContent = '¡Gracias por tu pedido! 🎉';

  const body = document.createElement('div');
  body.className = 'success-modal__body';

  const line1 = document.createElement('p');
  line1.className = 'success-modal__text';
  line1.textContent = 'Hemos abierto WhatsApp para enviar tu lista de productos.';

  const line2 = document.createElement('p');
  line2.className = 'success-modal__text success-modal__text--disclaimer';
  line2.textContent = '⚖️ En breve pesaremos tus productos en balanza y te confirmaremos el ticket con el monto final exacto por chat.';

  body.append(line1, line2);

  const actions = document.createElement('div');
  actions.className = 'success-modal__actions';

  const okBtn = document.createElement('button');
  okBtn.className = 'success-modal__btn';
  okBtn.type = 'button';
  okBtn.textContent = 'Entendido';

  actions.appendChild(okBtn);

  modal.append(title, body, actions);
  overlay.appendChild(modal);

  return overlay;
}

export function showSuccessModal(): Promise<void> {
  return new Promise((resolve) => {
    const overlay = buildWindow();
    document.body.appendChild(overlay);

    const modal = overlay.querySelector('.success-modal') as HTMLElement;
    const okBtn = overlay.querySelector('.success-modal__btn') as HTMLButtonElement;

    requestAnimationFrame(() => {
      overlay.classList.add('success-modal-overlay--visible');
    });

    function closeModal(): void {
      modal.classList.remove('anim-visible');
      overlay.classList.remove('success-modal-overlay--visible');

      let cleaned = false;
      function cleanup() {
        if (cleaned) return;
        cleaned = true;
        overlay.remove();
        resolve();
      }

      modal.addEventListener('transitionend', cleanup, { once: true });
      setTimeout(cleanup, TRANSITION_FALLBACK_MS);
    }

    okBtn.addEventListener('click', closeModal);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });

    document.addEventListener('keydown', function onKey(e) {
      if (e.key === 'Escape') {
        document.removeEventListener('keydown', onKey);
        closeModal();
      }
    });
  });
}
