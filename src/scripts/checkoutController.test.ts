import { describe, it, expect, beforeEach, vi } from 'vitest';

beforeEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

function createCheckoutElements() {
  document.body.innerHTML = `
    <input id="checkout-name" value="Patricia" />
    <div id="checkout-delivery">
      <input type="radio" name="delivery" value="retiro" checked />
      <input type="radio" name="delivery" value="envio" />
    </div>
    <div id="checkout-payment">
      <input type="radio" name="payment" value="efectivo" checked />
      <input type="radio" name="payment" value="transferencia" />
    </div>
    <input id="checkout-address" />
    <div id="checkout-address-wrapper"></div>
    <div id="checkout-delivery-info"></div>
    <div id="checkout-payment-info"></div>
    <div id="checkout-payment-restriction"></div>
    <button id="send-btn"></button>
    <button id="back-btn"></button>
  `;
  return {
    checkoutName: document.getElementById('checkout-name') as HTMLInputElement,
    checkoutDelivery: document.getElementById('checkout-delivery') as HTMLElement,
    checkoutPayment: document.getElementById('checkout-payment') as HTMLElement,
    checkoutAddress: document.getElementById('checkout-address') as HTMLInputElement,
    checkoutAddressWrapper: document.getElementById('checkout-address-wrapper') as HTMLElement,
    checkoutDeliveryInfo: document.getElementById('checkout-delivery-info') as HTMLElement,
    checkoutPaymentInfo: document.getElementById('checkout-payment-info') as HTMLElement,
    checkoutPaymentRestriction: document.getElementById('checkout-payment-restriction') as HTMLElement,
    sendBtn: document.getElementById('send-btn') as HTMLButtonElement,
    backBtn: document.getElementById('back-btn') as HTMLElement,
  };
}

function clickAndChange(input: HTMLInputElement): void {
  const name = input.name;
  if (name) {
    // Desmarcar todos los radios del mismo grupo
    const form = input.closest('form') || document;
    const radios = form.querySelectorAll<HTMLInputElement>(`input[type="radio"][name="${name}"]`);
    radios.forEach((r) => {
      r.checked = false;
    });
  }
  input.checked = true;
  input.dispatchEvent(new Event('change', { bubbles: true }));
  input.closest('div')?.dispatchEvent(new Event('change', { bubbles: true }));
}

describe('createCheckoutController', () => {
  it('creates a controller with init method', async () => {
    const mod = await import('./checkoutController');
    const els = createCheckoutElements();
    const controller = mod.createCheckoutController(els);
    expect(controller).toHaveProperty('init');
    expect(typeof controller.init).toBe('function');
  });

  it('shows delivery info when delivery mode is envio', async () => {
    const mod = await import('./checkoutController');
    const els = createCheckoutElements();
    const controller = mod.createCheckoutController(els);
    controller.init({ showCartView: vi.fn() });

    const envioRadio = els.checkoutDelivery.querySelector('input[value="envio"]') as HTMLInputElement;
    clickAndChange(envioRadio);

    expect(els.checkoutDeliveryInfo.hidden).toBe(false);
  });

  it('hides delivery info when switching to retiro from envio', async () => {
    const mod = await import('./checkoutController');
    const els = createCheckoutElements();
    const controller = mod.createCheckoutController(els);
    controller.init({ showCartView: vi.fn() });

    const envioRadio = els.checkoutDelivery.querySelector('input[value="envio"]') as HTMLInputElement;
    clickAndChange(envioRadio);
    expect(els.checkoutDeliveryInfo.hidden).toBe(false);

    const retiroRadio = els.checkoutDelivery.querySelector('input[value="retiro"]') as HTMLInputElement;
    clickAndChange(retiroRadio);

    expect(els.checkoutDeliveryInfo.hidden).toBe(true);
  });

  it('shows address wrapper when delivery is envio', async () => {
    const mod = await import('./checkoutController');
    const els = createCheckoutElements();
    const controller = mod.createCheckoutController(els);
    controller.init({ showCartView: vi.fn() });

    const envioRadio = els.checkoutDelivery.querySelector('input[value="envio"]') as HTMLInputElement;
    clickAndChange(envioRadio);

    expect(els.checkoutAddressWrapper.classList.contains('visible')).toBe(true);
  });

  it('clears address when switching to retiro from envio', async () => {
    const mod = await import('./checkoutController');
    const els = createCheckoutElements();
    els.checkoutAddress.value = 'Calle Falsa 123';
    const controller = mod.createCheckoutController(els);
    controller.init({ showCartView: vi.fn() });

    const envioRadio = els.checkoutDelivery.querySelector('input[value="envio"]') as HTMLInputElement;
    clickAndChange(envioRadio);
    expect(els.checkoutAddressWrapper.classList.contains('visible')).toBe(true);
    expect(els.checkoutAddress.value).toBe('Calle Falsa 123');

    const retiroRadio = els.checkoutDelivery.querySelector('input[value="retiro"]') as HTMLInputElement;
    clickAndChange(retiroRadio);

    expect(els.checkoutAddress.value).toBe('');
  });

  it('shows payment info for transferencia', async () => {
    const mod = await import('./checkoutController');
    const els = createCheckoutElements();
    const controller = mod.createCheckoutController(els);
    controller.init({ showCartView: vi.fn() });

    const transferenciaRadio = els.checkoutPayment.querySelector('input[value="transferencia"]') as HTMLInputElement;
    clickAndChange(transferenciaRadio);

    expect(els.checkoutPaymentInfo.hidden).toBe(false);
  });

  it('hides payment info when switching to efectivo from transferencia', async () => {
    const mod = await import('./checkoutController');
    const els = createCheckoutElements();
    const controller = mod.createCheckoutController(els);
    controller.init({ showCartView: vi.fn() });

    const transferenciaRadio = els.checkoutPayment.querySelector('input[value="transferencia"]') as HTMLInputElement;
    clickAndChange(transferenciaRadio);
    expect(els.checkoutPaymentInfo.hidden).toBe(false);

    const efectivoRadio = els.checkoutPayment.querySelector('input[value="efectivo"]') as HTMLInputElement;
    clickAndChange(efectivoRadio);

    expect(els.checkoutPaymentInfo.hidden).toBe(true);
  });

  it('forces transferencia and disables efectivo when delivery is envio', async () => {
    const mod = await import('./checkoutController');
    const els = createCheckoutElements();
    const controller = mod.createCheckoutController(els);
    controller.init({ showCartView: vi.fn() });

    const envioRadio = els.checkoutDelivery.querySelector('input[value="envio"]') as HTMLInputElement;
    clickAndChange(envioRadio);

    const paymentChecked = els.checkoutPayment.querySelector<HTMLInputElement>('input[name="payment"]:checked');
    expect(paymentChecked?.value).toBe('transferencia');

    const efectivoInput = els.checkoutPayment.querySelector<HTMLInputElement>('input[value="efectivo"]');
    expect(efectivoInput?.disabled).toBe(true);

    expect(els.checkoutPaymentRestriction.hidden).toBe(false);
  });

  it('re-enables efectivo and hides restriction when switching back to retiro', async () => {
    const mod = await import('./checkoutController');
    const els = createCheckoutElements();
    const controller = mod.createCheckoutController(els);
    controller.init({ showCartView: vi.fn() });

    const envioRadio = els.checkoutDelivery.querySelector('input[value="envio"]') as HTMLInputElement;
    clickAndChange(envioRadio);

    const retiroRadio = els.checkoutDelivery.querySelector('input[value="retiro"]') as HTMLInputElement;
    clickAndChange(retiroRadio);

    const efectivoInput = els.checkoutPayment.querySelector<HTMLInputElement>('input[value="efectivo"]');
    expect(efectivoInput?.disabled).toBe(false);

    expect(els.checkoutPaymentRestriction.hidden).toBe(true);
  });
});
