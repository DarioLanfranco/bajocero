import { cartStore } from '../store/cart';
import { buildWhatsAppOrderUrl } from './cartMessage';
import { business } from '../data/business';
import { showErrorToast } from './toast';
import type { CheckoutFormData } from './checkoutValidation';
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

function getFormData(els: CheckoutElements): CheckoutFormData {
  return {
    name: els.checkoutName.value,
    deliveryMode: getRadioValue(els.checkoutDelivery, 'delivery') ?? 'retiro',
    address: els.checkoutAddress.value,
    paymentMethod: getRadioValue(els.checkoutPayment, 'payment') ?? 'efectivo',
  };
}

function renderFieldErrors(errors: Partial<Record<keyof CheckoutFormData, string>>, els: CheckoutElements): void {
  clearAllFieldErrors([els.checkoutName, els.checkoutAddress]);
  if (errors.name) {
    markFieldError(els.checkoutName, true);
    els.checkoutName.focus();
  } else if (errors.address) {
    markFieldError(els.checkoutAddress, true);
    els.checkoutAddress.focus();
  }
}

function openExternalUrl(url: string): boolean {
  return window.open(url, '_blank') !== null;
}

function resetCheckoutState(): void {
  cartStore.clear();
  closeCartDrawer();
}

function handleOrderDispatch(url: string): void {
  const opened = openExternalUrl(url);
  if (opened) {
    resetCheckoutState();
    showSuccessModal();
  } else {
    showSuccessModal({
      whatsappUrl: url,
      onConfirm: resetCheckoutState,
    });
  }
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
    const formData = getFormData(els);
    const validation = validateCheckoutForm(formData);

    if (!validation.valid) {
      renderFieldErrors(validation.errors, els);
      return;
    }

    showConfirmModal(cartStore.items, cartStore.subtotal)
      .then((result) => {
        if (!result.confirmed) return;

        try {
          const url = buildWhatsAppOrderUrl(business.whatsapp, {
            name: formData.name.trim(),
            items: cartStore.items,
            deliveryMode: formData.deliveryMode === 'envio' ? 'envio' : 'retiro',
            deliveryAddress: formData.address.trim(),
            paymentMethod: formData.paymentMethod,
            subtotal: cartStore.subtotal,
          });
          handleOrderDispatch(url);
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
