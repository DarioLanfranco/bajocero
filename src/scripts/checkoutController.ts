import { cartStore } from '../store/cart';
import { buildWhatsAppOrderUrl } from './cartMessage';
import { business } from '../data/business';
import { showErrorToast } from './toast';
import { validateCheckoutForm } from './checkoutValidation';
import { markFieldError, clearAllFieldErrors } from './fieldError';
import { showConfirmModal } from './confirmModal';
import { showSuccessModal } from './successModal';
import { closeCartDrawer } from './cartDrawer';

export interface CheckoutElements {
  checkoutName: HTMLInputElement;
  checkoutDelivery: HTMLElement;
  checkoutPayment: HTMLElement;
  checkoutAddress: HTMLInputElement;
  checkoutAddressWrapper: HTMLElement;
  checkoutDeliveryInfo: HTMLElement;
  checkoutPaymentInfo: HTMLElement;
  checkoutPaymentRestriction: HTMLElement;
  sendBtn: HTMLElement;
  backBtn: HTMLElement;
}

export interface CheckoutController {
  init(cartViewController: { showCartView(): void }): void;
}

function getRadioValue(container: HTMLElement, name: string): string | null {
  const checked = container.querySelector<HTMLInputElement>(
    `input[name="${name}"]:checked`,
  );
  return checked?.value ?? null;
}

function setRadio(container: HTMLElement, name: string, value: string): void {
  const input = container.querySelector<HTMLInputElement>(
    `input[name="${name}"][value="${value}"]`,
  );
  if (input) input.checked = true;
}

function getEfectivoInput(container: HTMLElement): HTMLInputElement | null {
  return container.querySelector<HTMLInputElement>('input[name="payment"][value="efectivo"]');
}

function getEfectivoLabel(container: HTMLElement): HTMLElement | null {
  const input = getEfectivoInput(container);
  return input?.closest<HTMLElement>('.cart-drawer__option') ?? null;
}

export function createCheckoutController(els: CheckoutElements): CheckoutController {
  function updatePaymentState(): void {
    const deliveryValue = getRadioValue(els.checkoutDelivery, 'delivery');
    const isEnvio = deliveryValue === 'envio';
    const efectivoInput = getEfectivoInput(els.checkoutPayment);
    const efectivoLabel = getEfectivoLabel(els.checkoutPayment);

    if (isEnvio) {
      setRadio(els.checkoutPayment, 'payment', 'transferencia');
      if (efectivoInput) efectivoInput.disabled = true;
      if (efectivoLabel) efectivoLabel.classList.add('cart-drawer__option--disabled');
      els.checkoutPaymentRestriction.hidden = false;
    } else {
      if (efectivoInput) efectivoInput.disabled = false;
      if (efectivoLabel) efectivoLabel.classList.remove('cart-drawer__option--disabled');
      els.checkoutPaymentRestriction.hidden = true;
    }
  }

  function updateConditionalMessages(): void {
    const deliveryValue = getRadioValue(els.checkoutDelivery, 'delivery');
    const isEnvio = deliveryValue === 'envio';

    els.checkoutDeliveryInfo.hidden = !isEnvio;
    els.checkoutAddressWrapper.classList.toggle('visible', isEnvio);
    if (!isEnvio) {
      els.checkoutAddress.value = '';
    }

    const paymentValue = getRadioValue(els.checkoutPayment, 'payment');
    els.checkoutPaymentInfo.hidden = paymentValue !== 'transferencia';

    updatePaymentState();
  }

  function handleSend(): void {
    clearAllFieldErrors([els.checkoutName, els.checkoutAddress]);

    const result = validateCheckoutForm({
      name: els.checkoutName.value,
      deliveryMode: getRadioValue(els.checkoutDelivery, 'delivery') ?? 'retiro',
      address: els.checkoutAddress.value,
      paymentMethod: getRadioValue(els.checkoutPayment, 'payment') ?? 'efectivo',
    });

    if (!result.valid) {
      if (result.errors.name) {
        markFieldError(els.checkoutName, true);
        els.checkoutName.focus();
      } else if (result.errors.address) {
        markFieldError(els.checkoutAddress, true);
        els.checkoutAddress.focus();
      }
      return;
    }

    const deliveryMode = getRadioValue(els.checkoutDelivery, 'delivery') === 'envio' ? 'envio' : 'retiro';

    showConfirmModal(cartStore.items, cartStore.subtotal).then((result) => {
      if (!result.confirmed) return;

      try {
        const url = buildWhatsAppOrderUrl(business.whatsapp, {
          name: els.checkoutName.value.trim(),
          items: cartStore.items,
          deliveryMode,
          deliveryAddress: els.checkoutAddress.value.trim(),
          paymentMethod: getRadioValue(els.checkoutPayment, 'payment') === 'transferencia' ? 'transferencia' : 'efectivo',
          subtotal: cartStore.subtotal,
        });

        const win = window.open(url, '_blank');
        if (win) {
          cartStore.clear();
          closeCartDrawer();
          showSuccessModal();
        } else {
          showSuccessModal({
            whatsappUrl: url,
            onConfirm: () => {
              cartStore.clear();
              closeCartDrawer();
            },
          });
        }
      } catch {
        showErrorToast('Error al generar el pedido. Intentá de nuevo.');
      }
    });
  }

  function init(cartViewController: { showCartView(): void }): void {
    els.checkoutDelivery.addEventListener('change', updateConditionalMessages);
    els.checkoutPayment.addEventListener('change', updateConditionalMessages);

    els.sendBtn.addEventListener('click', handleSend);
    els.backBtn.addEventListener('click', () => cartViewController.showCartView());
  }

  return { init };
}
