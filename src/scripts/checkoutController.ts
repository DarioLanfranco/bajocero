import { cartStore } from '../store/cart';
import { buildWhatsAppMessage } from './cartMessage';
import { business } from '../data/business';

export interface CheckoutElements {
  checkoutName: HTMLInputElement;
  checkoutDelivery: HTMLElement;
  checkoutPayment: HTMLElement;
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
    els.checkoutDeliveryInfo.hidden = deliverySelected?.value !== 'envio';

    const paymentSelected = els.checkoutPayment.querySelector<HTMLInputElement>(
      'input[name="payment"]:checked',
    );
    els.checkoutPaymentInfo.hidden = paymentSelected?.value !== 'transferencia';
  }

  function handleSend(): void {
    const name = els.checkoutName.value.trim();
    if (!name) {
      els.checkoutName.focus();
      els.checkoutName.style.borderBottomColor = 'var(--color-coral)';
      setTimeout(() => {
        els.checkoutName.style.borderBottomColor = '';
      }, 2000);
      return;
    }

    const deliveryInput = els.checkoutDelivery.querySelector<HTMLInputElement>(
      'input[name="delivery"]:checked',
    );
    const paymentInput = els.checkoutPayment.querySelector<HTMLInputElement>(
      'input[name="payment"]:checked',
    );

    const mensaje = buildWhatsAppMessage({
      name,
      items: cartStore.items,
      deliveryLabel: deliveryInput?.value === 'envio' ? 'Envío por Cadete' : 'Retiro en Local',
      paymentLabel: paymentInput?.value === 'transferencia' ? 'Transferencia' : 'Efectivo',
      subtotal: cartStore.subtotal,
    });

    window.location.href = `https://wa.me/${business.whatsapp}?text=${encodeURIComponent(mensaje)}`;
  }

  function init(cartViewController: { showCartView(): void }): void {
    els.checkoutDelivery.addEventListener('change', updateConditionalMessages);
    els.checkoutPayment.addEventListener('change', updateConditionalMessages);

    els.sendBtn.addEventListener('click', handleSend);
    els.backBtn.addEventListener('click', () => cartViewController.showCartView());
  }

  return { init };
}
