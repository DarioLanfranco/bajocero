import { cartStore } from '../store/cart';
import { buildWhatsAppOrderUrl } from './cartMessage';
import { business } from '../data/business';

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

export function createCheckoutController(els: CheckoutElements): CheckoutController {
  function updateConditionalMessages(): void {
    const deliverySelected = els.checkoutDelivery.querySelector<HTMLInputElement>(
      'input[name="delivery"]:checked',
    );
    const isEnvio = deliverySelected?.value === 'envio';

    els.checkoutDeliveryInfo.hidden = !isEnvio;

    els.checkoutAddressWrapper.classList.toggle('visible', isEnvio);
    if (!isEnvio) {
      els.checkoutAddress.value = '';
    }

    const paymentSelected = els.checkoutPayment.querySelector<HTMLInputElement>(
      'input[name="payment"]:checked',
    );
    els.checkoutPaymentInfo.hidden = paymentSelected?.value !== 'transferencia';
  }

  function handleSend(): void {
    const name = els.checkoutName.value.trim();
    if (!name) {
      els.checkoutName.focus();
      els.checkoutName.classList.add('field--error');
      return;
    }
    els.checkoutName.classList.remove('field--error');

    const deliveryInput = els.checkoutDelivery.querySelector<HTMLInputElement>(
      'input[name="delivery"]:checked',
    );
    const paymentInput = els.checkoutPayment.querySelector<HTMLInputElement>(
      'input[name="payment"]:checked',
    );

    const deliveryMode = deliveryInput?.value === 'envio' ? 'envio' : 'retiro';
    const address = els.checkoutAddress.value.trim();

    if (deliveryMode === 'envio' && !address) {
      els.checkoutAddress.focus();
      els.checkoutAddress.classList.add('field--error');
      return;
    }
    els.checkoutAddress.classList.remove('field--error');

    const paymentMethod = paymentInput?.value === 'transferencia' ? 'transferencia' : 'efectivo';

    const url = buildWhatsAppOrderUrl(business.whatsapp, {
      name,
      items: cartStore.items,
      deliveryMode,
      deliveryAddress: address,
      paymentMethod,
      subtotal: cartStore.subtotal,
    });

    window.location.href = url;
  }

  function init(cartViewController: { showCartView(): void }): void {
    els.checkoutDelivery.addEventListener('change', updateConditionalMessages);
    els.checkoutPayment.addEventListener('change', updateConditionalMessages);

    els.sendBtn.addEventListener('click', handleSend);
    els.backBtn.addEventListener('click', () => cartViewController.showCartView());
  }

  return { init };
}
