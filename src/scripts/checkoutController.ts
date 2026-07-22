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

export function createCheckoutController(els: CheckoutElements): CheckoutController {
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

        window.open(url, '_blank');
        cartStore.clear();
        closeCartDrawer();
        showSuccessModal();
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
